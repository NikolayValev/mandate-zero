import { REGION_META, STAT_META } from "@/components/mandate-zero/data";
import {
  applyActorEffects,
  applyEffectsQueueForTurn,
  applyPolicyPassiveEffects,
  applyRegionMemoryForResolution,
  applyResourceEffects,
  applyStatEffects,
  clamp,
  computeBaselineDrift,
  computeMandateObjectives,
  computePressureGain,
  computePressureRelief,
  computeSystemCoupling,
  evaluateThresholdTriggers,
  mergeActorEffects,
  mergeDelta,
  pickScenarioWithChains,
  queueDelayedEffects,
  reduceCooldowns,
  sampleActionOutcome,
  simulateRegions,
  summarizeDelta,
} from "@/components/mandate-zero/engine";
import {
  actorKeysFromDeltas,
  affectedSystemsFromResolution,
  withSystemHistory,
} from "@/components/mandate-zero/runtime/helpers";
import type { AppLanguage } from "@/components/mandate-zero/i18n";
import type {
  ActorEffects,
  CausalityEntry,
  Delta,
  GameState,
  Phase,
  ResourceKey,
  Scenario,
  ScenarioOption,
  StatKey,
  CoreSystemKey,
  ActorKey,
  RegionKey,
} from "@/components/mandate-zero/types";
import type { Dispatch, SetStateAction } from "react";

interface TriggerCrisisResolutionActionArgs {
  option: ScenarioOption;
  canPlay: boolean;
  game: GameState;
  scenario: Scenario;
  localizedScenarioTitle: string;
  intelConfidence: "Low" | "Medium" | "High";
  language: AppLanguage;
  setGame: Dispatch<SetStateAction<GameState>>;
  setHistory: Dispatch<SetStateAction<string[]>>;
  appendCausalityEntry: (entryInput: Omit<CausalityEntry, "id">) => void;
  flashConsequenceHighlights: (
    systems: CoreSystemKey[],
    regions: RegionKey[],
    actors: ActorKey[],
  ) => void;
}

export function triggerCrisisResolutionAction({
  option,
  canPlay,
  game,
  scenario,
  localizedScenarioTitle,
  intelConfidence,
  language,
  setGame,
  setHistory,
  appendCausalityEntry,
  flashConsequenceHighlights,
}: TriggerCrisisResolutionActionArgs) {
  if (!canPlay) {
    return;
  }

  let rngState = game.rngState;
  const queuedResolution = applyEffectsQueueForTurn(
    game.effectsQueue,
    game.turn,
    rngState,
    intelConfidence,
  );
  rngState = queuedResolution.rngState;

  const rolledOptionStats = sampleActionOutcome(game, option, scenario.id);

  const queuedDelayed = queueDelayedEffects(
    option,
    game.resources.intel,
    rngState,
    game.turn,
    scenario.regionTargets,
  );
  rngState = queuedDelayed.rngState;

  let statDelta: Delta<StatKey> = computeBaselineDrift(game.doctrine, game.pressure);
  let resourceDelta: Delta<ResourceKey> = { intel: 1, supplies: 1, capital: 1 };
  let actorEffects: ActorEffects = {};
  let coupRiskDelta = 0;

  statDelta = mergeDelta(statDelta, rolledOptionStats.effects);
  statDelta = mergeDelta(statDelta, queuedResolution.statEffects);
  resourceDelta = mergeDelta(resourceDelta, option.resourceEffects);
  resourceDelta = mergeDelta(resourceDelta, queuedResolution.resourceEffects);
  actorEffects = mergeActorEffects(actorEffects, option.actorEffects, queuedResolution.actorEffects);
  coupRiskDelta += queuedResolution.coupRisk;

  if (game.actionPoints === 0) {
    statDelta = mergeDelta(statDelta, { stability: -2, trust: -2 });
    coupRiskDelta += 2;
  }

  const passivePolicy = applyPolicyPassiveEffects(game.activePolicies);
  statDelta = mergeDelta(statDelta, passivePolicy.statEffects);
  resourceDelta = mergeDelta(resourceDelta, passivePolicy.resourceEffects);
  actorEffects = mergeActorEffects(actorEffects, passivePolicy.actorEffects);
  coupRiskDelta += passivePolicy.coupRisk;

  let stats = applyStatEffects(game.stats, statDelta);
  let resources = applyResourceEffects(game.resources, resourceDelta);
  const actorApply = applyActorEffects(game.actors, actorEffects);
  let actors = actorApply.actors;

  const coupling = computeSystemCoupling(stats, resources, actors, game.doctrine, game.pressure);
  stats = applyStatEffects(stats, coupling.statEffects);
  resources = applyResourceEffects(resources, coupling.resourceEffects);
  const couplingActorApply = applyActorEffects(actors, coupling.actorEffects);
  actors = couplingActorApply.actors;

  statDelta = mergeDelta(statDelta, coupling.statEffects);
  resourceDelta = mergeDelta(resourceDelta, coupling.resourceEffects);
  coupRiskDelta += coupling.coupRisk;

  const regionMemory = applyRegionMemoryForResolution(game.regionMemory, scenario, option);
  const regionSimulation = simulateRegions(
    game.regions,
    scenario,
    option,
    stats.security,
    rngState,
    game.pressure,
    regionMemory,
  );
  rngState = regionSimulation.rngState;
  const regions = regionSimulation.regions;
  stats = applyStatEffects(stats, regionSimulation.statPenalty);
  statDelta = mergeDelta(statDelta, regionSimulation.statPenalty);
  coupRiskDelta += regionSimulation.coupRiskDelta;

  const hotRegionsNext = REGION_META.filter((region) => regions[region.key] >= 70).length;
  const criticalRegionsNext = REGION_META.filter((region) => regions[region.key] >= 85).length;
  const pressureGain = computePressureGain(
    regionSimulation.effectiveSeverity,
    hotRegionsNext,
    criticalRegionsNext,
    stats.security,
  );
  const pressureRelief = computePressureRelief(stats.trust, criticalRegionsNext, option.tags ?? []);
  const pressure = clamp(game.pressure + pressureGain - pressureRelief);

  const thresholdTriggers = evaluateThresholdTriggers(
    game.stats,
    stats,
    game.thresholdsFired,
    game.doctrine,
    game.turn,
  );

  let effectsQueue = [
    ...queuedResolution.remaining,
    ...queuedDelayed.queued,
    ...thresholdTriggers.queuedEffects,
  ];
  let coupRisk = clamp(game.coupRisk + coupRiskDelta);
  let phase: Phase = "playing";
  let collapseCount = game.collapseCount;
  let message =
    language === "bg"
      ? `${localizedScenarioTitle}: ${option.title}. ${regionSimulation.summary}. ÐÐ°Ñ‚Ð¸ÑÐº +${pressureGain}.`
      : `${localizedScenarioTitle}: ${option.title}. ${regionSimulation.summary}. Pressure +${pressureGain}${pressureRelief > 0 ? `, relief -${pressureRelief}` : ""}.`;

  const collapsedStats = STAT_META.filter((entry) => stats[entry.key] === 0);
  if (collapsedStats.length > 0) {
    if (collapseCount === 0) {
      collapseCount = 1;
      for (const collapsed of collapsedStats) {
        stats[collapsed.key] = 15;
      }
      coupRisk = clamp(coupRisk + 20);
      message =
        language === "bg"
          ? "ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½ Ðµ Ð°Ð²Ð°Ñ€Ð¸ÐµÐ½ Ñ€ÐµÐ¶Ð¸Ð¼. Ð˜Ð½ÑÑ‚Ð¸Ñ‚ÑƒÑ†Ð¸Ð¸Ñ‚Ðµ ÑƒÑÑ‚Ð¾ÑÑ…Ð° Ð·Ð°ÑÐµÐ³Ð°, Ð½Ð¾ Ð¾Ñ‰Ðµ ÐµÐ´Ð¸Ð½ ÑÑ€Ð¸Ð² Ñ‰Ðµ Ð¿Ñ€ÐµÐºÑ€Ð°Ñ‚Ð¸ ÑÐ¸Ð¼ÑƒÐ»Ð°Ñ†Ð¸ÑÑ‚Ð°."
          : "Emergency mode triggered. Institutions held for now, but one more collapse ends the run.";
    } else {
      phase = "lost";
      message =
        language === "bg"
          ? `ÐšÐ¾Ð»Ð°Ð¿Ñ Ð½Ð° Ñ€ÐµÐ¶Ð¸Ð¼Ð°: ${collapsedStats
              .map((entry) => {
                const bgStatLabels: Record<StatKey, string> = {
                  stability: "Ð¡Ñ‚Ð°Ð±Ð¸Ð»Ð½Ð¾ÑÑ‚",
                  treasury: "Ð¥Ð°Ð·Ð½Ð°",
                  influence: "Ð’Ð»Ð¸ÑÐ½Ð¸Ðµ",
                  security: "Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¾ÑÑ‚",
                  trust: "ÐžÐ±Ñ‰ÐµÑÑ‚Ð²ÐµÐ½Ð¾ Ð´Ð¾Ð²ÐµÑ€Ð¸Ðµ",
                };
                return bgStatLabels[entry.key];
              })
              .join(", ")} Ð¾Ñ‚Ð½Ð¾Ð²Ð¾ ÑÐµ ÑÑ€Ð¸Ð½Ð°Ñ…Ð°.`
          : `Regime collapse: ${collapsedStats.map((entry) => entry.label).join(", ")} failed again.`;
    }
  }

  if (phase === "playing" && coupRisk >= 100) {
    phase = "lost";
    message =
      language === "bg"
        ? "Ð Ð¸ÑÐºÑŠÑ‚ Ð¾Ñ‚ Ð¿Ñ€ÐµÐ²Ñ€Ð°Ñ‚ Ð´Ð¾ÑÑ‚Ð¸Ð³Ð½Ð° ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡ÐµÐ½ Ð¿Ñ€Ð°Ð³. ÐšÐ¾Ð¼Ð°Ð½Ð´Ð½Ð°Ñ‚Ð° Ð²Ð»Ð°ÑÑ‚ ÑÐµ ÑÑ€Ð¸Ð½Ð°."
        : "Coup risk reached critical threshold. Command authority collapsed.";
  }
  if (phase === "playing" && pressure >= 100) {
    phase = "lost";
    message =
      language === "bg"
        ? "ÐÐ°Ñ‚Ð¸ÑÐºÑŠÑ‚ Ð´Ð¾ÑÑ‚Ð¸Ð³Ð½Ð° ÑÐ¸ÑÑ‚ÐµÐ¼Ð½Ð¾ Ð¿Ñ€ÐµÑ‚Ð¾Ð²Ð°Ñ€Ð²Ð°Ð½Ðµ. ÐšÐ°ÑÐºÐ°Ð´Ð½Ð¸ ÐºÑ€Ð¸Ð·Ð¸ Ð¿Ñ€ÐµÐºÑ€Ð°Ñ‚Ð¸Ñ…Ð° Ð¼Ð°Ð½Ð´Ð°Ñ‚Ð°."
        : "Pressure reached systemic overload. Cascading crises ended the mandate.";
  }

  const nextTurn = game.turn + 1;
  let scenarioId = game.scenarioId;
  let chainRuleId: string | null = null;
  if (phase === "playing") {
    if (nextTurn > game.maxTurns) {
      const objectives = computeMandateObjectives({
        ...game,
        stats,
        regions,
        pressure,
        coupRisk,
      });
      if (objectives.passes.all) {
        phase = "won";
        message =
          language === "bg"
            ? "ÐœÐ°Ð½Ð´Ð°Ñ‚ÑŠÑ‚ Ð¾Ñ†ÐµÐ»Ñ. ÐžÐ²Ð»Ð°Ð´ÑÑ…Ñ‚Ðµ ÐºÑ€Ð¸Ð·Ð¸Ñ‚Ðµ Ð±ÐµÐ· Ð¿ÑŠÐ»ÐµÐ½ ÑÑ€Ð¸Ð²."
            : "Mandate survived. You contained crises without full breakdown.";
      } else {
        phase = "lost";
        message =
          language === "bg"
            ? "ÐœÐ°Ð½Ð´Ð°Ñ‚ÑŠÑ‚ Ð·Ð°Ð²ÑŠÑ€ÑˆÐ¸ Ð² ÑÐ¸ÑÑ‚ÐµÐ¼Ð½Ð° ÐºÑ€ÐµÑ…ÐºÐ¾ÑÑ‚. Ð Ð°Ð½Ð½Ð¸Ñ‚Ðµ ÐºÐ¾Ð¼Ð¿Ñ€Ð¾Ð¼Ð¸ÑÐ¸ Ð¾ÐºÐ¾Ð½Ñ‡Ð°Ñ‚ÐµÐ»Ð½Ð¾ Ð¿Ñ€ÐµÑ‡ÑƒÐ¿Ð¸Ñ…Ð° Ð´ÑŠÑ€Ð¶Ð°Ð²Ð°Ñ‚Ð°."
            : "Term ended in systemic fragility. Earlier compromises finally broke the state.";
      }
    } else {
      const nextScenario = pickScenarioWithChains(
        game.scenarioId,
        scenario,
        option,
        stats,
        actors,
        pressure,
        rngState,
      );
      scenarioId = nextScenario.scenarioId;
      chainRuleId = nextScenario.chainRuleId;
      rngState = nextScenario.rngState;
    }
  }

  if (chainRuleId) {
    message =
      language === "bg"
        ? `${message} Ð—Ð°Ð´ÐµÐ¹ÑÑ‚Ð²Ð°Ð½Ð° Ðµ Ð¿Ð¾ÑÐ»ÐµÐ´Ð²Ð°Ñ‰Ð° Ð²ÐµÑ€Ð¸Ð³Ð° (${chainRuleId}).`
        : `${message} Follow-up chain triggered (${chainRuleId}).`;
  }

  const cooldowns = reduceCooldowns(game.cooldowns);
  const loyaltyDelta = mergeDelta(actorApply.loyaltyDelta, couplingActorApply.loyaltyDelta);
  const pressureDelta = mergeDelta(actorApply.pressureDelta, couplingActorApply.pressureDelta);

  if (phase !== "playing") {
    effectsQueue = [];
  }

  setGame((prev) => ({
    ...prev,
    rngState,
    turn: nextTurn,
    phase,
    turnStage: phase === "playing" ? "crisis" : "fallout",
    message,
    scenarioId,
    stats,
    resources,
    actors,
    regions,
    regionMemory,
    pressure,
    ...withSystemHistory(prev, stats, pressure),
    actionPoints: prev.maxActionPoints,
    cooldowns,
    effectsQueue,
    thresholdsFired: thresholdTriggers.updatedThresholds,
    coupRisk,
    collapseCount,
    lastStatDelta: statDelta,
    lastResourceDelta: resourceDelta,
    lastActorLoyaltyDelta: loyaltyDelta,
    lastActorPressureDelta: pressureDelta,
  }));
  const affectedSystems = affectedSystemsFromResolution(statDelta, pressure, game.pressure);
  flashConsequenceHighlights(
    [...new Set(affectedSystems)],
    regionSimulation.impactedRegions,
    actorKeysFromDeltas(loyaltyDelta, pressureDelta),
  );

  const optionSummary = summarizeDelta(rolledOptionStats.effects, STAT_META);
  const queueLogs = [...queuedResolution.logs, ...queuedDelayed.logs, ...thresholdTriggers.logs];
  const queueLine =
    queueLogs.length > 0 ? ` | ${queueLogs.slice(0, 2).join(" | ")}` : "";
  const chainLine = chainRuleId ? ` | chain ${chainRuleId}` : "";
  const logLine = `${localizedScenarioTitle} -> ${option.title}${optionSummary ? ` (${optionSummary})` : ""}${queueLine}${chainLine}`;
  setHistory((prev) => [logLine, ...prev].slice(0, 18));

  appendCausalityEntry({
    turn: game.turn,
    phase: "resolution",
    actionId: option.id,
    actionLabel: option.title,
    crisisId: scenario.id,
    crisisLabel: localizedScenarioTitle,
    immediateDeltas: rolledOptionStats.effects,
    delayedEnqueued:
      queuedDelayed.queued.length > 0
        ? queuedDelayed.queued.map((entry) => `${entry.source} (T${entry.turnToApply})`)
        : [],
    thresholdsTriggered: thresholdTriggers.logs,
    regionImpacts: regionSimulation.impactedRegions,
  });
}
