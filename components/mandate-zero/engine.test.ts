import { describe, expect, it } from "vitest";
import { SCENARIOS } from "./data";
import {
  applyActorEffects,
  computeSystemCoupling,
  createInitialGame,
  isDemoSeedArray,
  isGameStateLike,
  normalizeSeed,
  pickScenario,
  queueDelayedEffects,
  resolvePendingEffects,
  rollUncertainStatEffects,
  simulateRegions,
} from "./engine";
import type { PendingEffect, ScenarioOption } from "./types";

describe("engine seed behavior", () => {
  it("normalizes blank seeds to default", () => {
    expect(normalizeSeed("")).toBe("demo-seed-001");
    expect(normalizeSeed("   ")).toBe("demo-seed-001");
    expect(normalizeSeed(" crisis-seed ")).toBe("crisis-seed");
  });

  it("creates deterministic initial runs for the same seed", () => {
    const first = createInitialGame("alpha-seed");
    const second = createInitialGame("alpha-seed");

    expect(first.scenarioId).toBe(second.scenarioId);
    expect(first.rngState).toBe(second.rngState);
    expect(first.turn).toBe(1);
    expect(first.phase).toBe("playing");
  });

  it("picks a different next scenario when multiple scenarios exist", () => {
    const previous = SCENARIOS[0].id;
    const picked = pickScenario(previous, 123456789);
    expect(picked.scenarioId).not.toBe(previous);
  });
});

describe("engine effect resolution", () => {
  it("rolls uncertain effects deterministically for a fixed rng state", () => {
    const input = { trust: 4, treasury: -3 };
    const first = rollUncertainStatEffects(input, 3, 42);
    const second = rollUncertainStatEffects(input, 3, 42);
    expect(first).toEqual(second);
  });

  it("applies and clamps actor effects while returning deltas", () => {
    const actors = createInitialGame("actor-check").actors;
    const result = applyActorEffects(actors, {
      banks: { loyalty: 999 },
      media: { pressure: -999 },
    });

    expect(result.actors.banks.loyalty).toBe(100);
    expect(result.actors.media.pressure).toBe(0);
    expect(result.loyaltyDelta.banks).toBe(45);
    expect(result.pressureDelta.media).toBe(-51);
  });

  it("queues delayed effects deterministically", () => {
    const option: ScenarioOption = {
      id: "test-option",
      title: "Test Option",
      description: "Test delayed queue",
      risk: "Medium",
      factionReaction: "Neutral",
      spread: 1,
      statEffects: { trust: 1 },
      delayed: [
        {
          label: "Aftershock",
          chance: 1,
          delayMin: 2,
          delayMax: 2,
          effects: { statEffects: { stability: -2 }, coupRisk: 1 },
        },
      ],
    };

    const queued = queueDelayedEffects(option, 5, 100);
    expect(queued.queued).toHaveLength(1);
    expect(queued.queued[0].turnsLeft).toBe(2);
    expect(queued.queued[0].hidden).toBe(true);
    expect(queued.logs[0]).toContain("Potential latent shock");
  });

  it("resolves matured pending effects and decrements non-matured ones", () => {
    const pending: PendingEffect[] = [
      {
        id: "mature",
        label: "Matured Effect",
        turnsLeft: 1,
        hidden: true,
        effects: { statEffects: { trust: -3 }, coupRisk: 2 },
      },
      {
        id: "future",
        label: "Future Effect",
        turnsLeft: 3,
        hidden: false,
        effects: { resourceEffects: { intel: 2 } },
      },
    ];

    const result = resolvePendingEffects(pending, 777, "Low");
    expect(result.statEffects.trust).toBe(-3);
    expect(result.coupRisk).toBe(2);
    expect(result.remaining).toHaveLength(1);
    expect(result.remaining[0].turnsLeft).toBe(2);
    expect(result.logs[0]).toBe("A hidden aftershock triggered unexpectedly.");
  });
});

describe("engine simulation outputs", () => {
  it("simulates regions deterministically for fixed inputs", () => {
    const game = createInitialGame("region-sim");
    const scenario = SCENARIOS[0];
    const option = scenario.options[0];

    const first = simulateRegions(game.regions, scenario, option, 52, 321);
    const second = simulateRegions(game.regions, scenario, option, 52, 321);

    expect(first).toEqual(second);
    expect(first.summary).toMatch(/hot/);
    expect(first.summary).toMatch(/critical/);
  });

  it("computes coupling effects when systems are in stress conditions", () => {
    const base = createInitialGame("coupling");
    const result = computeSystemCoupling(
      {
        stability: 60,
        treasury: 80,
        influence: 75,
        security: 82,
        trust: 50,
      },
      { intel: 2, supplies: 10, capital: 10 },
      {
        banks: { loyalty: 75, pressure: 65 },
        military: { loyalty: 50, pressure: 70 },
        media: { loyalty: 72, pressure: 63 },
        public: { loyalty: 74, pressure: 66 },
      },
      base.doctrine,
    );

    expect(result.statEffects.trust).toBeLessThan(0);
    expect(result.statEffects.stability).toBeLessThan(0);
    expect(result.statEffects.influence).toBeLessThan(0);
    expect(result.resourceEffects.capital).toBe(1);
    expect(result.coupRisk).toBeGreaterThan(0);
  });
});

describe("engine payload guards", () => {
  it("validates game-state-like payloads", () => {
    const game = createInitialGame("guard-seed");
    expect(isGameStateLike(game)).toBe(true);
    expect(isGameStateLike({ ...game, turn: "2" })).toBe(false);
    expect(isGameStateLike(null)).toBe(false);
  });

  it("validates seed arrays", () => {
    expect(
      isDemoSeedArray([
        { id: "a", name: "Alpha", value: "seed-a" },
        { id: "b", name: "Beta", value: "seed-b" },
      ]),
    ).toBe(true);

    expect(
      isDemoSeedArray([{ id: "a", name: "Alpha", value: 12 } as unknown as { id: string }]),
    ).toBe(false);
    expect(isDemoSeedArray({})).toBe(false);
  });
});

