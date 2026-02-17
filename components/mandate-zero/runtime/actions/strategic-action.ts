import { STAT_META } from "@/components/mandate-zero/data";
import {
  applyActorEffects,
  applyResourceEffects,
  applyStatEffects,
  mergeDelta,
  randomChance,
  randomInt,
  sampleActionOutcome,
  summarizeDelta,
} from "@/components/mandate-zero/engine";
import { actorKeysFromDeltas, statKeysFromDelta, withSystemHistory } from "@/components/mandate-zero/runtime/helpers";
import type { AppLanguage } from "@/components/mandate-zero/i18n";
import type {
  CausalityEntry,
  CoreSystemKey,
  Delta,
  GameState,
  ActorKey,
  RegionKey,
  QueuedEffect,
  ResourceKey,
  StrategicAction,
} from "@/components/mandate-zero/types";
import type { Dispatch, SetStateAction } from "react";

interface TriggerStrategicActionArgs {
  action: StrategicAction;
  game: GameState;
  language: AppLanguage;
  actionTitleById: Record<StrategicAction["id"], string>;
  localizedScenarioTitle: string;
  getActionDisabledReason: (action: StrategicAction) => string | null;
  getAdjustedActionCost: (action: StrategicAction) => number;
  setGame: Dispatch<SetStateAction<GameState>>;
  setHistory: Dispatch<SetStateAction<string[]>>;
  appendCausalityEntry: (entryInput: Omit<CausalityEntry, "id">) => void;
  flashConsequenceHighlights: (
    systems: CoreSystemKey[],
    regions: RegionKey[],
    actors: ActorKey[],
  ) => void;
}

export function triggerStrategicAction({
  action,
  game,
  language,
  actionTitleById,
  localizedScenarioTitle,
  getActionDisabledReason,
  getAdjustedActionCost,
  setGame,
  setHistory,
  appendCausalityEntry,
  flashConsequenceHighlights,
}: TriggerStrategicActionArgs) {
  const reason = getActionDisabledReason(action);
  if (reason) {
    return;
  }
  const actionTitle = actionTitleById[action.id] ?? action.title;

  let rngState = game.rngState;
  const rolledStats = sampleActionOutcome(game, action, game.scenarioId);

  const resourceCostDelta: Delta<ResourceKey> = {};
  for (const [key, cost] of Object.entries(action.resourceCost ?? {}) as Array<[ResourceKey, number]>) {
    resourceCostDelta[key] = -cost;
  }

  const resourceDelta = mergeDelta(resourceCostDelta, action.effects.resourceEffects);
  const resources = applyResourceEffects(game.resources, resourceDelta);
  const stats = applyStatEffects(game.stats, rolledStats.effects);
  const actorApplication = applyActorEffects(game.actors, action.effects.actorEffects ?? {});
  const actionCost = getAdjustedActionCost(action);
  const actionPoints = Math.max(0, game.actionPoints - actionCost);
  const cooldowns = { ...game.cooldowns, [action.id]: action.cooldown };

  const queuedEffects: QueuedEffect[] = [];
  if (action.id === "reserve-mobilization") {
    const hitRoll = randomChance(rngState, 0.55);
    rngState = hitRoll.nextState;
    if (hitRoll.hit) {
      const delayRoll = randomInt(rngState, 1, 2);
      rngState = delayRoll.nextState;
      queuedEffects.push({
        id: `action-${action.id}-${game.turn}-${rngState}`,
        turnToApply: game.turn + delayRoll.value,
        scope: "global",
        tags: ["action", "backlash", "security"],
        source: "Mobilization backlash",
        deltas: {
          statEffects: { trust: -3, stability: -1 },
          actorEffects: { public: { pressure: 3 } },
          coupRisk: 2,
        },
      });
    }
  }
  if (action.id === "emergency-subsidy") {
    const hitRoll = randomChance(rngState, 0.45);
    rngState = hitRoll.nextState;
    if (hitRoll.hit) {
      const delayRoll = randomInt(rngState, 2, 3);
      rngState = delayRoll.nextState;
      queuedEffects.push({
        id: `action-${action.id}-${game.turn}-${rngState}`,
        turnToApply: game.turn + delayRoll.value,
        scope: "global",
        tags: ["action", "inflation"],
        source: "Subsidy inflation drag",
        deltas: {
          statEffects: { treasury: -3, trust: -2 },
          actorEffects: { public: { pressure: 2 } },
        },
      });
    }
  }

  setGame((prev) => ({
    ...prev,
    turnStage: "decision",
    rngState,
    stats,
    resources,
    actors: actorApplication.actors,
    ...withSystemHistory(prev, stats, prev.pressure),
    actionPoints,
    cooldowns,
    effectsQueue: [...prev.effectsQueue, ...queuedEffects],
    message:
      actionPoints === 0
        ? language === "bg"
          ? `${actionTitle}: Ð¸Ð·Ð¿ÑŠÐ»Ð½ÐµÐ½Ð¾. Ð Ð¸ÑÐºÑŠÑ‚ Ð¾Ñ‚ Ð¿Ñ€ÐµÑ€Ð°Ð·Ñ‚ÑÐ³Ð°Ð½Ðµ Ðµ Ð°ÐºÑ‚Ð¸Ð²ÐµÐ½ Ð·Ð° Ñ‚Ð¾Ð·Ð¸ Ñ…Ð¾Ð´.`
          : `${actionTitle} executed. Overextension risk armed for this turn.`
        : language === "bg"
          ? `${actionTitle}: Ð¸Ð·Ð¿ÑŠÐ»Ð½ÐµÐ½Ð¾.`
          : `${actionTitle} executed.`,
    lastStatDelta: rolledStats.effects,
    lastResourceDelta: resourceDelta,
    lastActorLoyaltyDelta: actorApplication.loyaltyDelta,
    lastActorPressureDelta: actorApplication.pressureDelta,
  }));
  flashConsequenceHighlights(
    statKeysFromDelta(rolledStats.effects),
    [],
    actorKeysFromDeltas(actorApplication.loyaltyDelta, actorApplication.pressureDelta),
  );

  const statSummary = summarizeDelta(rolledStats.effects, STAT_META);
  const queueSummary =
    queuedEffects.length > 0
      ? ` | queued: ${queuedEffects.map((effect) => `${effect.source} T${effect.turnToApply}`).join(", ")}`
      : "";
  setHistory((prev) => {
    const line =
      language === "bg"
        ? `Ð¡Ñ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ‡ÐµÑÐºÐ¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ -> ${actionTitle}${statSummary ? ` (${statSummary})` : ""}${queueSummary}`
        : `Strategic action -> ${actionTitle}${statSummary ? ` (${statSummary})` : ""}${queueSummary}`;
    return [line, ...prev].slice(0, 18);
  });
  appendCausalityEntry({
    turn: game.turn,
    phase: "decision",
    actionId: action.id,
    actionLabel: `${language === "bg" ? "Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ" : "Action"}: ${actionTitle}`,
    crisisId: game.scenarioId,
    crisisLabel: localizedScenarioTitle,
    immediateDeltas: rolledStats.effects,
    delayedEnqueued:
      queuedEffects.length > 0
        ? queuedEffects.map((effect) => `${effect.source} (T${effect.turnToApply})`)
        : [],
    thresholdsTriggered: [],
    regionImpacts: [],
  });
}
