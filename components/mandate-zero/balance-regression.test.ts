import { describe, expect, it } from "vitest";
import { STRATEGIC_ACTIONS } from "./data";
import {
  createInitialGame,
  getActionPointCost,
  getIntelProfile,
  getScenario,
} from "./engine";
import { triggerCrisisResolutionAction } from "./runtime/actions/crisis-resolution";
import { triggerDoctrineAction } from "./runtime/actions/doctrine";
import { triggerStrategicAction } from "./runtime/actions/strategic-action";
import type { DoctrineId, GameState, ScenarioOption, StrategicAction } from "./types";

const FIXED_SEEDS = Array.from({ length: 30 }, (_, index) => `fixed-${index + 1}`);
const DOCTRINE: DoctrineId = "populist";

const DOCTRINE_TITLES: Record<DoctrineId, string> = {
  technocrat: "Technocrat",
  populist: "Populist",
  militarist: "Militarist",
};

const ACTION_TITLES = Object.fromEntries(
  STRATEGIC_ACTIONS.map((action) => [action.id, action.title]),
) as Record<StrategicAction["id"], string>;

function applyDoctrine(seed: string, doctrineId: DoctrineId): GameState {
  let game = createInitialGame(seed);
  const setGame = (next: GameState | ((previous: GameState) => GameState)) => {
    game = typeof next === "function" ? next(game) : next;
  };

  triggerDoctrineAction({
    doctrineId,
    game,
    language: "en",
    localizedScenarioTitle: getScenario(game.scenarioId).title,
    doctrineTitleById: DOCTRINE_TITLES,
    setGame,
    setHistory: () => undefined,
    appendCausalityEntry: () => undefined,
  });

  return game;
}

function resolveOption(game: GameState, option: ScenarioOption): GameState {
  let next = game;
  const setGame = (update: GameState | ((previous: GameState) => GameState)) => {
    next = typeof update === "function" ? update(next) : update;
  };
  const scenario = getScenario(game.scenarioId);
  const intelConfidence = getIntelProfile(game.resources.intel, game.doctrine).confidence;

  triggerCrisisResolutionAction({
    option,
    canPlay: game.phase === "playing" && Boolean(game.doctrine),
    game,
    scenario,
    localizedScenarioTitle: scenario.title,
    intelConfidence,
    language: "en",
    setGame,
    setHistory: () => undefined,
    appendCausalityEntry: () => undefined,
    flashConsequenceHighlights: () => undefined,
  });

  return next;
}

function applyStrategicAction(game: GameState, action: StrategicAction | null): GameState {
  if (!action) {
    return game;
  }

  let next = game;
  const setGame = (update: GameState | ((previous: GameState) => GameState)) => {
    next = typeof update === "function" ? update(next) : update;
  };

  const getAdjustedActionCost = (candidate: StrategicAction) =>
    getActionPointCost(candidate.apCost, candidate.id, next.doctrine);
  const getActionDisabledReason = (candidate: StrategicAction) => {
    if (!(next.phase === "playing" && next.doctrine)) {
      return "inactive";
    }
    if ((next.cooldowns[candidate.id] ?? 0) > 0) {
      return "cooldown";
    }

    const adjustedCost = getAdjustedActionCost(candidate);
    if (next.actionPoints < adjustedCost) {
      return "ap";
    }
    if (next.actionPoints - adjustedCost < 1) {
      return "overextend";
    }

    if (candidate.resourceCost) {
      for (const [key, value] of Object.entries(candidate.resourceCost)) {
        if ((next.resources[key as keyof GameState["resources"]] ?? 0) < value) {
          return "resource";
        }
      }
    }
    return null;
  };

  if (getActionDisabledReason(action)) {
    return game;
  }

  triggerStrategicAction({
    action,
    game,
    language: "en",
    actionTitleById: ACTION_TITLES,
    localizedScenarioTitle: getScenario(game.scenarioId).title,
    getActionDisabledReason,
    getAdjustedActionCost,
    setGame,
    setHistory: () => undefined,
    appendCausalityEntry: () => undefined,
    flashConsequenceHighlights: () => undefined,
  });

  return next;
}

function scoreState(game: GameState): number {
  const averageStress =
    Object.values(game.regions).reduce((sum, value) => sum + value, 0) /
    Object.values(game.regions).length;

  return (
    (game.phase === "won" ? 9000 : 0) +
    (game.phase === "lost" ? -9000 : 0) +
    game.stats.stability * 2 +
    game.stats.trust * 2.1 +
    game.stats.security * 1.2 +
    game.stats.influence * 0.7 +
    game.stats.treasury * 0.5 -
    game.pressure * 1.1 -
    game.coupRisk * 0.8 -
    averageStress
  );
}

function chooseRandomOption(game: GameState): ScenarioOption {
  const options = getScenario(game.scenarioId).options;
  return options[game.rngState % options.length];
}

function chooseCompetentTurn(game: GameState): { action: StrategicAction | null; option: ScenarioOption } {
  let bestAction: StrategicAction | null = null;
  let bestOption = getScenario(game.scenarioId).options[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const action of [null, ...STRATEGIC_ACTIONS]) {
    const afterAction = applyStrategicAction(game, action);
    const options = getScenario(afterAction.scenarioId).options;
    for (const option of options) {
      const preview = resolveOption(afterAction, option);
      const score = scoreState(preview);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
        bestOption = option;
      }
    }
  }

  return { action: bestAction, option: bestOption };
}

function runSeed(seed: string, mode: "random" | "competent"): GameState["phase"] {
  let game = applyDoctrine(seed, DOCTRINE);
  let turns = 0;

  while (game.phase === "playing" && turns < 40) {
    turns += 1;
    if (mode === "random") {
      game = resolveOption(game, chooseRandomOption(game));
      continue;
    }

    const choice = chooseCompetentTurn(game);
    game = resolveOption(applyStrategicAction(game, choice.action), choice.option);
  }

  return game.phase;
}

describe("deterministic balance regression", () => {
  it("keeps competent deterministic play in the target win band", () => {
    const wins = FIXED_SEEDS.reduce((sum, seed) => sum + (runSeed(seed, "competent") === "won" ? 1 : 0), 0);
    const rate = wins / FIXED_SEEDS.length;

    expect(rate).toBeGreaterThanOrEqual(0.35);
    expect(rate).toBeLessThanOrEqual(0.55);
  });

  it("keeps random baseline weaker and non-trivial", () => {
    const randomWins = FIXED_SEEDS.reduce((sum, seed) => sum + (runSeed(seed, "random") === "won" ? 1 : 0), 0);
    const competentWins = FIXED_SEEDS.reduce((sum, seed) => sum + (runSeed(seed, "competent") === "won" ? 1 : 0), 0);

    expect(randomWins).toBeLessThan(competentWins);
    expect(randomWins).toBeGreaterThan(0);
    expect(randomWins).toBeLessThan(FIXED_SEEDS.length);
  });
});
