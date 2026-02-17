import { createInitialGame, isRecord, snapshotCoreSystems } from "@/components/mandate-zero/engine";
import type {
  CausalityEntry,
  CoreSystemKey,
  GameState,
  QueuedEffect,
} from "@/components/mandate-zero/types";

function isCausalityEntryArray(value: unknown): value is CausalityEntry[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      return (
        isRecord(entry) &&
        typeof entry.id === "string" &&
        typeof entry.turn === "number" &&
        typeof entry.phase === "string" &&
        typeof entry.actionId === "string" &&
        typeof entry.actionLabel === "string" &&
        typeof entry.crisisId === "string" &&
        typeof entry.crisisLabel === "string" &&
        isRecord(entry.immediateDeltas) &&
        Array.isArray(entry.delayedEnqueued) &&
        Array.isArray(entry.thresholdsTriggered) &&
        Array.isArray(entry.regionImpacts)
      );
    })
  );
}

function isQueuedEffectArray(value: unknown): value is QueuedEffect[] {
  return (
    Array.isArray(value) &&
    value.every((effect) => {
      return (
        isRecord(effect) &&
        typeof effect.id === "string" &&
        typeof effect.turnToApply === "number" &&
        typeof effect.source === "string" &&
        isRecord(effect.deltas)
      );
    })
  );
}

function isSystemSnapshot(
  value: unknown,
): value is Record<CoreSystemKey, number> {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.stability === "number" &&
    typeof value.treasury === "number" &&
    typeof value.influence === "number" &&
    typeof value.security === "number" &&
    typeof value.trust === "number" &&
    typeof value.pressure === "number"
  );
}

function isSystemHistoryArray(value: unknown): value is Array<Record<CoreSystemKey, number>> {
  return Array.isArray(value) && value.every((entry) => isSystemSnapshot(entry));
}

export function hydrateLoadedGame(rawGame: GameState): GameState {
  const fallback = createInitialGame(rawGame.seedText);
  const raw = rawGame as GameState & {
    effectsQueue?: unknown;
    thresholdsFired?: unknown;
    lastTurnSystems?: unknown;
    systemHistory?: unknown;
  };
  const nextStats = rawGame.stats ?? fallback.stats;
  const nextPressure = typeof rawGame.pressure === "number" ? rawGame.pressure : fallback.pressure;
  const synthesizedSnapshot = snapshotCoreSystems(nextStats, nextPressure);
  const lastTurnSystems = isSystemSnapshot(raw.lastTurnSystems)
    ? raw.lastTurnSystems
    : synthesizedSnapshot;
  const systemHistory = isSystemHistoryArray(raw.systemHistory)
    ? raw.systemHistory.slice(-8)
    : [lastTurnSystems, synthesizedSnapshot].slice(-8);

  return {
    ...fallback,
    ...rawGame,
    pressure: nextPressure,
    turnStage: rawGame.turnStage ?? fallback.turnStage,
    regionMemory: rawGame.regionMemory ?? fallback.regionMemory,
    effectsQueue: isQueuedEffectArray(raw.effectsQueue) ? raw.effectsQueue : fallback.effectsQueue,
    thresholdsFired: isRecord(raw.thresholdsFired) ? raw.thresholdsFired : fallback.thresholdsFired,
    lastTurnSystems,
    systemHistory,
  };
}

export function parseCausalityHistory(
  value: unknown,
  fallbackHistory: string[],
): CausalityEntry[] {
  if (isCausalityEntryArray(value)) {
    return value;
  }
  return fallbackHistory.map((entry, index) => ({
    id: `legacy-${index}`,
    turn: 0,
    phase: "fallout",
    actionId: `legacy-${index}`,
    actionLabel: "Legacy Entry",
    crisisId: "legacy",
    crisisLabel: "Imported history",
    immediateDeltas: {},
    delayedEnqueued: [entry],
    thresholdsTriggered: [],
    regionImpacts: [],
  }));
}
