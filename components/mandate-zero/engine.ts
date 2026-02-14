import {
  ACTOR_META,
  DEFAULT_SEED,
  DOCTRINES,
  POLICIES,
  REGION_META,
  RESOURCE_META,
  SCENARIOS,
  STAT_META,
} from "./data";
import type {
  ActorEffects,
  ActorKey,
  ActorState,
  Delta,
  DemoSeed,
  DoctrineId,
  GameState,
  IntelProfile,
  PendingEffect,
  PolicyId,
  RegionKey,
  ResourceKey,
  RiskLevel,
  Scenario,
  ScenarioOption,
  StatKey,
} from "./types";

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeSeed(seedText: string) {
  const trimmed = seedText.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_SEED;
}

export function hashSeed(seedText: string) {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

export function nextRngState(state: number) {
  return (Math.imul(1664525, state) + 1013904223) >>> 0;
}

export function randomFromState(state: number) {
  const nextState = nextRngState(state);
  return { value: nextState / 4294967296, nextState };
}

export function randomInt(state: number, min: number, max: number) {
  const random = randomFromState(state);
  const value = Math.floor(random.value * (max - min + 1)) + min;
  return { value, nextState: random.nextState };
}

export function randomChance(state: number, chance: number) {
  const random = randomFromState(state);
  return { hit: random.value < chance, nextState: random.nextState };
}

export function mergeDelta<T extends string>(base: Delta<T>, addition?: Delta<T>) {
  if (!addition) {
    return base;
  }
  const next = { ...base };
  for (const [key, value] of Object.entries(addition) as Array<[T, number]>) {
    next[key] = (next[key] ?? 0) + value;
  }
  return next;
}

export function mergeActorEffects(...effects: Array<ActorEffects | undefined>) {
  const merged: ActorEffects = {};
  for (const effect of effects) {
    if (!effect) {
      continue;
    }
    for (const actor of ACTOR_META.map((item) => item.key)) {
      const shift = effect[actor];
      if (!shift) {
        continue;
      }
      const previous = merged[actor] ?? {};
      merged[actor] = {
        loyalty: (previous.loyalty ?? 0) + (shift.loyalty ?? 0),
        pressure: (previous.pressure ?? 0) + (shift.pressure ?? 0),
      };
    }
  }
  return merged;
}

export function applyStatEffects(
  stats: Record<StatKey, number>,
  delta: Delta<StatKey>,
): Record<StatKey, number> {
  const next = { ...stats };
  for (const stat of STAT_META) {
    const value = delta[stat.key] ?? 0;
    next[stat.key] = clamp(next[stat.key] + value);
  }
  return next;
}

export function applyResourceEffects(
  resources: Record<ResourceKey, number>,
  delta: Delta<ResourceKey>,
): Record<ResourceKey, number> {
  const next = { ...resources };
  for (const resource of RESOURCE_META) {
    const value = delta[resource.key] ?? 0;
    next[resource.key] = clamp(next[resource.key] + value);
  }
  return next;
}

export function applyActorEffects(
  actors: Record<ActorKey, ActorState>,
  effects: ActorEffects,
) {
  const next: Record<ActorKey, ActorState> = {
    banks: { ...actors.banks },
    military: { ...actors.military },
    media: { ...actors.media },
    public: { ...actors.public },
  };
  const loyaltyDelta: Delta<ActorKey> = {};
  const pressureDelta: Delta<ActorKey> = {};

  for (const actor of ACTOR_META.map((item) => item.key)) {
    const shift = effects[actor];
    if (!shift) {
      continue;
    }

    const nextLoyalty = clamp(next[actor].loyalty + (shift.loyalty ?? 0));
    const nextPressure = clamp(next[actor].pressure + (shift.pressure ?? 0));
    loyaltyDelta[actor] = nextLoyalty - next[actor].loyalty;
    pressureDelta[actor] = nextPressure - next[actor].pressure;
    next[actor] = { loyalty: nextLoyalty, pressure: nextPressure };
  }

  return { actors: next, loyaltyDelta, pressureDelta };
}

export function getDoctrine(doctrineId: DoctrineId | null) {
  if (!doctrineId) {
    return null;
  }
  return DOCTRINES.find((doctrine) => doctrine.id === doctrineId) ?? null;
}

export function getPolicy(policyId: PolicyId) {
  return POLICIES.find((policy) => policy.id === policyId);
}

export function getScenario(scenarioId: string) {
  return SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? SCENARIOS[0];
}

export function getIntelProfile(intel: number, doctrineId: DoctrineId | null): IntelProfile {
  const doctrine = getDoctrine(doctrineId);
  const shift = doctrine?.uncertaintyShift ?? 0;
  const baseVariance = intel >= 12 ? 2 : intel >= 8 ? 4 : 6;
  const variance = clamp(baseVariance + shift, 1, 8);
  const confidence: IntelProfile["confidence"] =
    variance <= 2 ? "High" : variance <= 4 ? "Medium" : "Low";
  return { confidence, variance };
}

export function rollUncertainStatEffects(
  baseEffects: Delta<StatKey>,
  variance: number,
  rngState: number,
) {
  let nextRng = rngState;
  const rolled: Delta<StatKey> = {};

  for (const stat of STAT_META.map((item) => item.key)) {
    const base = baseEffects[stat];
    if (base === undefined || base === 0) {
      continue;
    }

    const width = Math.max(1, variance - (Math.abs(base) <= 2 ? 1 : 0));
    const noise = randomInt(nextRng, -width, width);
    nextRng = noise.nextState;
    rolled[stat] = base + noise.value;
  }

  return { effects: rolled, rngState: nextRng };
}

export function estimateEffectRange(base: number, variance: number): {
  min: number;
  max: number;
} {
  return { min: base - variance, max: base + variance };
}

export function summarizeDelta<T extends string>(
  delta: Delta<T>,
  labels: Array<{ key: T; label: string }>,
) {
  return labels
    .map((entry) => {
      const value = delta[entry.key] ?? 0;
      if (value === 0) {
        return null;
      }
      return `${entry.label} ${value > 0 ? `+${value}` : value}`;
    })
    .filter((line): line is string => Boolean(line))
    .join(", ");
}

export function riskVariant(risk: RiskLevel): "default" | "secondary" | "destructive" {
  if (risk === "High") {
    return "destructive";
  }
  if (risk === "Medium") {
    return "secondary";
  }
  return "default";
}

export function pickScenario(previousId: string | undefined, rngState: number) {
  const choices = SCENARIOS.filter((scenario) => scenario.id !== previousId);
  const pool = choices.length > 0 ? choices : SCENARIOS;
  const random = randomFromState(rngState);
  const index = Math.floor(random.value * pool.length);
  return { scenarioId: pool[index].id, rngState: random.nextState };
}

export function createInitialGame(seedText: string): GameState {
  const normalizedSeed = normalizeSeed(seedText);
  const firstPick = pickScenario(undefined, hashSeed(normalizedSeed));

  return {
    seedText: normalizedSeed,
    rngState: firstPick.rngState,
    turn: 1,
    maxTurns: 12,
    phase: "playing",
    message:
      "Choose a doctrine, spend AP, then resolve crisis. Hidden effects and delayed shocks are active.",
    scenarioId: firstPick.scenarioId,
    doctrine: null,
    maxActionPoints: 2,
    actionPoints: 2,
    collapseCount: 0,
    coupRisk: 12,
    stats: {
      stability: 60,
      treasury: 56,
      influence: 54,
      security: 52,
      trust: 55,
    },
    resources: {
      intel: 8,
      supplies: 8,
      capital: 8,
    },
    actors: {
      banks: { loyalty: 55, pressure: 42 },
      military: { loyalty: 52, pressure: 40 },
      media: { loyalty: 47, pressure: 51 },
      public: { loyalty: 50, pressure: 54 },
    },
    regions: {
      north: 28,
      south: 26,
      capital: 34,
      industry: 30,
      border: 32,
      coast: 27,
    },
    cooldowns: {},
    activePolicies: [],
    pendingEffects: [],
    lastStatDelta: {},
    lastResourceDelta: {},
    lastActorLoyaltyDelta: {},
    lastActorPressureDelta: {},
  };
}

export function reduceCooldowns(cooldowns: Record<string, number>) {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(cooldowns)) {
    const reduced = Math.max(0, value - 1);
    if (reduced > 0) {
      next[key] = reduced;
    }
  }
  return next;
}

export function applyPolicyPassiveEffects(activePolicies: PolicyId[]) {
  let statEffects: Delta<StatKey> = {};
  let resourceEffects: Delta<ResourceKey> = {};
  let actorEffects: ActorEffects = {};
  let coupRisk = 0;

  for (const policyId of activePolicies) {
    const policy = getPolicy(policyId);
    if (!policy) {
      continue;
    }
    statEffects = mergeDelta(statEffects, policy.passive.statEffects);
    resourceEffects = mergeDelta(resourceEffects, policy.passive.resourceEffects);
    actorEffects = mergeActorEffects(actorEffects, policy.passive.actorEffects);
    coupRisk += policy.passive.coupRisk ?? 0;
  }

  return { statEffects, resourceEffects, actorEffects, coupRisk };
}

export function resolvePendingEffects(
  pendingEffects: PendingEffect[],
  rngState: number,
  intelConfidence: IntelProfile["confidence"],
) {
  let statEffects: Delta<StatKey> = {};
  let resourceEffects: Delta<ResourceKey> = {};
  let actorEffects: ActorEffects = {};
  let coupRisk = 0;
  const remaining: PendingEffect[] = [];
  const logs: string[] = [];
  let nextRng = rngState;

  for (const pending of pendingEffects) {
    const turnsLeft = pending.turnsLeft - 1;
    if (turnsLeft > 0) {
      remaining.push({ ...pending, turnsLeft });
      continue;
    }

    statEffects = mergeDelta(statEffects, pending.effects.statEffects);
    resourceEffects = mergeDelta(resourceEffects, pending.effects.resourceEffects);
    actorEffects = mergeActorEffects(actorEffects, pending.effects.actorEffects);
    coupRisk += pending.effects.coupRisk ?? 0;

    if (pending.hidden && intelConfidence === "Low") {
      logs.push("A hidden aftershock triggered unexpectedly.");
    } else {
      logs.push(`Aftershock triggered: ${pending.label}.`);
    }

    nextRng = randomFromState(nextRng).nextState;
  }

  return {
    remaining,
    statEffects,
    resourceEffects,
    actorEffects,
    coupRisk,
    logs,
    rngState: nextRng,
  };
}

export function queueDelayedEffects(
  option: ScenarioOption,
  intel: number,
  rngState: number,
): { queued: PendingEffect[]; logs: string[]; rngState: number } {
  const queued: PendingEffect[] = [];
  const logs: string[] = [];
  let nextRng = rngState;

  for (const delayed of option.delayed ?? []) {
    const intelModifier = intel < 6 ? 0.12 : intel > 10 ? -0.08 : 0;
    const chance = clamp(delayed.chance + intelModifier, 0, 1);
    const hitRoll = randomChance(nextRng, chance);
    nextRng = hitRoll.nextState;

    if (!hitRoll.hit) {
      continue;
    }

    const delayRoll = randomInt(nextRng, delayed.delayMin, delayed.delayMax);
    nextRng = delayRoll.nextState;
    const hidden = intel < 8;

    queued.push({
      id: `${delayed.label}-${nextRng}`,
      label: delayed.label,
      turnsLeft: delayRoll.value,
      hidden,
      effects: delayed.effects,
    });

    if (hidden) {
      logs.push("Potential latent shock detected (low confidence).");
    } else {
      logs.push(`${delayed.label} expected in ${delayRoll.value} turns.`);
    }
  }

  return { queued, logs, rngState: nextRng };
}

export function simulateRegions(
  regions: Record<RegionKey, number>,
  scenario: Scenario,
  option: ScenarioOption,
  security: number,
  rngState: number,
) {
  const next = { ...regions };
  let nextRng = rngState;

  for (const region of REGION_META.map((entry) => entry.key)) {
    next[region] = clamp(next[region] - 2);
  }

  for (const target of scenario.regionTargets) {
    const roll = randomInt(nextRng, 0, 4);
    nextRng = roll.nextState;
    next[target] = clamp(
      next[target] + scenario.severity * 6 + option.spread * 3 + roll.value,
    );
  }

  const spillRoll = randomInt(nextRng, 0, REGION_META.length - 1);
  nextRng = spillRoll.nextState;
  const spillRegion = REGION_META[spillRoll.value].key;
  next[spillRegion] = clamp(next[spillRegion] + scenario.severity * 2);

  const mitigationRoll = randomInt(nextRng, 0, REGION_META.length - 1);
  nextRng = mitigationRoll.nextState;
  const mitigationRegion = REGION_META[mitigationRoll.value].key;
  const mitigation = Math.floor(security / 12) + 2;
  next[mitigationRegion] = clamp(next[mitigationRegion] - mitigation);

  const hotRegions = REGION_META.filter((region) => next[region.key] >= 70).length;
  const criticalRegions = REGION_META.filter((region) => next[region.key] >= 85).length;

  return {
    regions: next,
    statPenalty: { trust: -hotRegions, stability: -criticalRegions } as Delta<StatKey>,
    coupRiskDelta: criticalRegions * 3,
    summary: `${hotRegions} hot / ${criticalRegions} critical`,
    rngState: nextRng,
  };
}

export function computeSystemCoupling(
  stats: Record<StatKey, number>,
  resources: Record<ResourceKey, number>,
  actors: Record<ActorKey, ActorState>,
  doctrineId: DoctrineId | null,
) {
  let statEffects: Delta<StatKey> = {};
  let resourceEffects: Delta<ResourceKey> = {};
  let actorEffects: ActorEffects = {};
  let coupRisk = 0;

  const doctrine = getDoctrine(doctrineId);
  const securityTrustPenalty = doctrine?.securityTrustPenalty ?? 2;

  if (stats.security > 70) {
    statEffects = mergeDelta(statEffects, { trust: -securityTrustPenalty });
  }
  if (stats.treasury > 75) {
    statEffects = mergeDelta(statEffects, { stability: -2, trust: -1 });
  }
  if (stats.influence > 70) {
    statEffects = mergeDelta(statEffects, { trust: -2, treasury: 1 });
    coupRisk += 3;
  }
  if (stats.treasury < 25) {
    statEffects = mergeDelta(statEffects, { stability: -2 });
  }

  if (actors.banks.pressure > 60) {
    statEffects = mergeDelta(statEffects, { treasury: -2 });
  }
  if (actors.media.pressure > 60) {
    statEffects = mergeDelta(statEffects, { trust: -2 });
  }
  if (actors.public.pressure > 60) {
    statEffects = mergeDelta(statEffects, { stability: -2 });
  }
  if (actors.military.pressure > 65) {
    coupRisk += 5;
  }

  if (actors.banks.loyalty > 70) {
    resourceEffects = mergeDelta(resourceEffects, { capital: 1 });
  }
  if (actors.public.loyalty > 70) {
    statEffects = mergeDelta(statEffects, { trust: 1 });
  }
  if (actors.media.loyalty > 70) {
    actorEffects = mergeActorEffects(actorEffects, { media: { pressure: -1 } });
  }

  if (resources.intel < 3) {
    statEffects = mergeDelta(statEffects, { influence: -2, security: -1 });
  }

  return { statEffects, resourceEffects, actorEffects, coupRisk };
}

export function describeEstimatedImpact(option: ScenarioOption, profile: IntelProfile) {
  const lines = STAT_META.map((stat) => {
    const base = option.statEffects[stat.key];
    if (!base) {
      return null;
    }
    const range = estimateEffectRange(base, profile.variance);
    return `${stat.label} ${range.min > 0 ? "+" : ""}${range.min} to ${
      range.max > 0 ? "+" : ""
    }${range.max}`;
  }).filter((line): line is string => Boolean(line));

  return lines.slice(0, 3).join(" | ");
}

export function regionClass(stress: number) {
  if (stress >= 85) {
    return "border-red-500 bg-red-500/10";
  }
  if (stress >= 70) {
    return "border-orange-400 bg-orange-400/10";
  }
  if (stress >= 45) {
    return "border-yellow-400 bg-yellow-400/10";
  }
  return "border-emerald-500/40 bg-emerald-500/10";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isGameStateLike(value: unknown): value is GameState {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.seedText === "string" &&
    typeof value.rngState === "number" &&
    typeof value.turn === "number" &&
    typeof value.phase === "string" &&
    typeof value.scenarioId === "string" &&
    isRecord(value.stats) &&
    isRecord(value.resources) &&
    isRecord(value.actors) &&
    isRecord(value.regions)
  );
}

export function isDemoSeedArray(value: unknown): value is DemoSeed[] {
  return (
    Array.isArray(value) &&
    value.every((seed) => {
      return (
        isRecord(seed) &&
        typeof seed.id === "string" &&
        typeof seed.name === "string" &&
        typeof seed.value === "string"
      );
    })
  );
}
