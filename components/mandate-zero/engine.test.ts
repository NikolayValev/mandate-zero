import { describe, expect, it } from "vitest";
import { SCENARIOS } from "./data";
import {
  applyActorEffects,
  applyEffectsQueueForTurn,
  computeBaselineDrift,
  computeMandateObjectives,
  computePressureGain,
  computePressureRelief,
  computeTrend,
  computeSystemCoupling,
  createInitialGame,
  estimatePressureDelta,
  estimateActionOutcome,
  evaluateThresholdTriggers,
  isDemoSeedArray,
  isGameStateLike,
  normalizeSeed,
  pickScenarioWithChains,
  pickScenario,
  queueDelayedEffects,
  resolvePendingEffects,
  rollUncertainStatEffects,
  sampleActionOutcome,
  simulateRegions,
  toTier,
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

describe("engine qualitative state helpers", () => {
  it("maps stat values into qualitative tiers", () => {
    expect(toTier(10).label).toBe("Critical");
    expect(toTier(38).label).toBe("Fragile");
    expect(toTier(50).label).toBe("Unstable");
    expect(toTier(72).label).toBe("Stable");
    expect(toTier(94).label).toBe("Strong");
  });

  it("computes direction and accelerating momentum from history", () => {
    expect(computeTrend([55]).direction).toBe("flat");
    expect(computeTrend([60, 58]).direction).toBe("down");
    expect(computeTrend([60, 58, 56]).momentum).toBe("accelerating");
    expect(computeTrend([48, 48, 49]).direction).toBe("up");
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
    expect(queued.queued[0].turnToApply).toBe(3);
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

  it("applies queued effects deterministically for a given turn", () => {
    const queue = [
      {
        id: "queued-1",
        turnToApply: 2,
        scope: "global" as const,
        tags: ["delayed"],
        source: "Queued one",
        deltas: { statEffects: { trust: -2 } },
      },
      {
        id: "queued-2",
        turnToApply: 3,
        scope: "global" as const,
        tags: ["delayed"],
        source: "Queued two",
        deltas: { resourceEffects: { intel: 1 } },
      },
    ];
    const first = applyEffectsQueueForTurn(queue, 2, 42, "Medium");
    const second = applyEffectsQueueForTurn(queue, 2, 42, "Medium");
    expect(first).toEqual(second);
    expect(first.applied).toHaveLength(1);
    expect(first.remaining).toHaveLength(1);
    expect(first.statEffects.trust).toBe(-2);
  });

  it("estimates deterministic outcome ranges from scoped action rng", () => {
    const game = createInitialGame("range-seed");
    const option = SCENARIOS[0].options[0];
    const first = estimateActionOutcome(game, option, SCENARIOS[0].id);
    const second = estimateActionOutcome(game, option, SCENARIOS[0].id);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first[0].confidence).toMatch(/High|Medium|Low/);
  });

  it("samples deterministic action outcomes by scoped seed", () => {
    const game = createInitialGame("sample-seed");
    const action = {
      id: "sample-action",
      statEffects: { trust: -4, security: 3 },
    };
    const first = sampleActionOutcome(game, action, game.scenarioId);
    const second = sampleActionOutcome(game, action, game.scenarioId);
    expect(first.effects).toEqual(second.effects);
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

  it("fires threshold triggers once and schedules next-turn fallout", () => {
    const game = createInitialGame("threshold-check");
    const first = evaluateThresholdTriggers(
      game.stats,
      { ...game.stats, trust: 35, treasury: 28, security: 32 },
      {},
      "populist",
      game.turn,
    );
    expect(first.queuedEffects.length).toBe(3);
    expect(first.updatedThresholds["trust-protests"]).toBe(true);

    const second = evaluateThresholdTriggers(
      { ...game.stats, trust: 35, treasury: 28, security: 32 },
      { ...game.stats, trust: 25, treasury: 20, security: 20 },
      first.updatedThresholds,
      "populist",
      game.turn + 1,
    );
    expect(second.queuedEffects.length).toBe(0);
  });

  it("chains crises deterministically when rule conditions match", () => {
    const scenario = SCENARIOS.find((entry) => entry.id === "bank-run")!;
    const option = scenario.options.find((entry) => entry.id === "freeze-transfers")!;
    const first = pickScenarioWithChains(
      scenario.id,
      scenario,
      option,
      { stability: 40, treasury: 30, influence: 40, security: 45, trust: 35 },
      {
        banks: { loyalty: 50, pressure: 55 },
        military: { loyalty: 52, pressure: 45 },
        media: { loyalty: 48, pressure: 58 },
        public: { loyalty: 46, pressure: 68 },
      },
      80,
      1234,
    );
    const second = pickScenarioWithChains(
      scenario.id,
      scenario,
      option,
      { stability: 40, treasury: 30, influence: 40, security: 45, trust: 35 },
      {
        banks: { loyalty: 50, pressure: 55 },
        military: { loyalty: 52, pressure: 45 },
        media: { loyalty: 48, pressure: 58 },
        public: { loyalty: 46, pressure: 68 },
      },
      80,
      1234,
    );
    expect(first).toEqual(second);
  });
});

describe("pressure and mandate helpers", () => {
  it("computes bounded pressure gain with stronger security mitigation", () => {
    const lowMitigation = computePressureGain(6, 4, 2, 30);
    const highMitigation = computePressureGain(6, 4, 2, 90);

    expect(lowMitigation).toBeGreaterThanOrEqual(0);
    expect(lowMitigation).toBeLessThanOrEqual(7);
    expect(highMitigation).toBeGreaterThanOrEqual(0);
    expect(highMitigation).toBeLessThanOrEqual(7);
    expect(highMitigation).toBeLessThan(lowMitigation);
  });

  it("applies trust decay only when pressure is high enough after doctrine modifiers", () => {
    const baseline = computeBaselineDrift(null, 20);
    expect(baseline.treasury).toBe(-2);
    expect(Math.abs(baseline.trust ?? 0)).toBe(0);
    expect(computeBaselineDrift("militarist", 45).trust).toBe(-2);
    expect(Math.abs(computeBaselineDrift("populist", 45).trust ?? 0)).toBe(0);
  });

  it("computes mandate objectives pass/fail snapshot from current game state", () => {
    const base = createInitialGame("objective-check");
    const allPass = computeMandateObjectives({
      ...base,
      stats: { stability: 55, treasury: 50, influence: 50, security: 50, trust: 45 },
      pressure: 70,
      coupRisk: 60,
      regions: { north: 50, south: 48, capital: 52, industry: 49, border: 51, coast: 47 },
    });
    expect(allPass.passes.all).toBe(true);

    const fail = computeMandateObjectives({
      ...base,
      stats: { stability: 30, treasury: 50, influence: 50, security: 50, trust: 20 },
      pressure: 92,
      coupRisk: 80,
      regions: { north: 88, south: 84, capital: 90, industry: 80, border: 85, coast: 87 },
    });
    expect(fail.passes.stability).toBe(false);
    expect(fail.passes.trust).toBe(false);
    expect(fail.passes.pressure).toBe(false);
    expect(fail.passes.avgStress).toBe(false);
    expect(fail.passes.coupRisk).toBe(false);
  });

  it("estimates pressure delta with relief tags and critical-region relief rule", () => {
    const noRelief = estimatePressureDelta({
      scenarioSeverity: 4,
      pressure: 60,
      security: 50,
      trust: 45,
      hotRegions: 2,
      criticalRegions: 1,
      optionSpread: 2,
      optionTags: [],
    });
    const withRelief = estimatePressureDelta({
      scenarioSeverity: 4,
      pressure: 60,
      security: 50,
      trust: 65,
      hotRegions: 2,
      criticalRegions: 0,
      optionSpread: 1,
      optionTags: ["deescalation"],
    });

    expect(noRelief.gain).toBeGreaterThanOrEqual(0);
    expect(withRelief.relief).toBeGreaterThan(0);
    expect(withRelief.projectedPressure).toBeLessThanOrEqual(100);
    expect(withRelief.net).toBeLessThanOrEqual(noRelief.net);
    expect(computePressureRelief(65, 0, ["relief"])).toBe(2);
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
