import { REGION_META } from "@/components/mandate-zero/data";
import { snapshotCoreSystems } from "@/components/mandate-zero/engine";
import type {
  ActorKey,
  CoreSystemKey,
  Delta,
  GameState,
  StatKey,
} from "@/components/mandate-zero/types";

export function withSystemHistory(
  previous: GameState,
  stats: Record<StatKey, number>,
  pressure: number,
) {
  const previousSnapshot =
    previous.systemHistory[previous.systemHistory.length - 1] ??
    snapshotCoreSystems(previous.stats, previous.pressure);
  const nextSnapshot = snapshotCoreSystems(stats, pressure);
  return {
    lastTurnSystems: previousSnapshot,
    systemHistory: [...previous.systemHistory, nextSnapshot].slice(-8),
  };
}

export function statKeysFromDelta(delta: Delta<StatKey>) {
  return (Object.entries(delta) as Array<[StatKey, number]>)
    .filter(([, value]) => value !== 0)
    .map(([key]) => key);
}

export function actorKeysFromDeltas(
  loyaltyDelta: Delta<ActorKey>,
  pressureDelta: Delta<ActorKey>,
) {
  const impacted = new Set<ActorKey>();
  for (const [key, value] of Object.entries(loyaltyDelta) as Array<[ActorKey, number]>) {
    if (value !== 0) {
      impacted.add(key);
    }
  }
  for (const [key, value] of Object.entries(pressureDelta) as Array<[ActorKey, number]>) {
    if (value !== 0) {
      impacted.add(key);
    }
  }
  return [...impacted];
}

export function getEscalationState(regions: GameState["regions"]) {
  const hotRegions = REGION_META.filter((region) => regions[region.key] >= 70).length;
  const criticalRegions = REGION_META.filter((region) => regions[region.key] >= 85).length;
  const escalationClock = Math.max(1, 4 - Math.floor((hotRegions + criticalRegions) / 2));
  return { hotRegions, criticalRegions, escalationClock };
}

export function affectedSystemsFromResolution(
  statDelta: Delta<StatKey>,
  pressure: number,
  previousPressure: number,
): CoreSystemKey[] {
  return [
    ...statKeysFromDelta(statDelta),
    ...(pressure !== previousPressure ? (["pressure"] as const) : []),
  ];
}
