import {
  ACTOR_META,
  DEFAULT_SEED,
  DOCTRINES,
  FOLLOWUP_RULES,
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
  CoreSystemKey,
  CrisisFollowupRule,
  Delta,
  DemoSeed,
  DoctrineId,
  EffectPack,
  GameState,
  IntelProfile,
  OutcomeEstimate,
  PendingEffect,
  PolicyId,
  QueuedEffect,
  RegionKey,
  RegionMemoryState,
  ResourceKey,
  RiskLevel,
  Scenario,
  ScenarioOption,
  StrategicAction,
  StatKey,
  TierState,
  ThresholdKey,
  TrendState,
} from "./types";

const DEFAULT_THRESHOLD_DANGER: Record<ThresholdKey, number> = {
  "trust-protests": 1,
  "treasury-austerity": 1,
  "security-insurgency": 1,
};

const EMPTY_DOCTRINE_RULES: {
  varianceBias: number;
  trustDecayModifier: number;
  actionApAdjustments: Partial<Record<string, number>>;
  thresholdDanger: Record<ThresholdKey, number>;
} = {
  varianceBias: 0,
  trustDecayModifier: 0,
  actionApAdjustments: {},
  thresholdDanger: DEFAULT_THRESHOLD_DANGER,
};

export const CORE_SYSTEM_KEYS: CoreSystemKey[] = [
  "stability",
  "treasury",
  "influence",
  "security",
  "trust",
  "pressure",
];

const TIER_BANDS: Array<{ min: number; state: TierState }> = [
  { min: 80, state: { tierId: "strong", label: "Strong", severity: 0 } },
  { min: 60, state: { tierId: "stable", label: "Stable", severity: 1 } },
  { min: 40, state: { tierId: "unstable", label: "Unstable", severity: 2 } },
  { min: 20, state: { tierId: "fragile", label: "Fragile", severity: 3 } },
  { min: 0, state: { tierId: "critical", label: "Critical", severity: 4 } },
];

const PRESSURE_BANDS: Array<{ min: number; label: string; severity: number }> = [
  { min: 75, label: "Breaking", severity: 3 },
  { min: 50, label: "Hot", severity: 2 },
  { min: 25, label: "Tense", severity: 1 },
  { min: 0, label: "Calm", severity: 0 },
];

type OutcomeState = Pick<
  GameState,
  "seedText" | "turn" | "scenarioId" | "resources" | "doctrine" | "pressure"
>;
type OutcomeAction = Pick<ScenarioOption, "id" | "statEffects"> | Pick<StrategicAction, "id" | "effects">;

function buildInitialRegionMemory(): Record<RegionKey, RegionMemoryState> {
  return {
    north: { resentment: 0, dependency: 0 },
    south: { resentment: 0, dependency: 0 },
    capital: { resentment: 0, dependency: 0 },
    industry: { resentment: 0, dependency: 0 },
    border: { resentment: 0, dependency: 0 },
    coast: { resentment: 0, dependency: 0 },
  };
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function toTier(value: number): TierState {
  const normalized = clamp(value, 0, 100);
  return TIER_BANDS.find((band) => normalized >= band.min)?.state ?? TIER_BANDS[TIER_BANDS.length - 1].state;
}

export function toPressureState(value: number): { label: string; severity: number } {
  const normalized = clamp(value, 0, 100);
  return (
    PRESSURE_BANDS.find((band) => normalized >= band.min) ?? PRESSURE_BANDS[PRESSURE_BANDS.length - 1]
  );
}

export function snapshotCoreSystems(
  stats: Record<StatKey, number>,
  pressure: number,
): Record<CoreSystemKey, number> {
  return {
    stability: stats.stability,
    treasury: stats.treasury,
    influence: stats.influence,
    security: stats.security,
    trust: stats.trust,
    pressure,
  };
}

export function computeTrend(history: number[]): TrendState {
  if (history.length < 2) {
    return { direction: "flat", momentum: null };
  }

  const latest = history[history.length - 1] - history[history.length - 2];
  const direction: TrendState["direction"] = latest > 0 ? "up" : latest < 0 ? "down" : "flat";
  let momentum: TrendState["momentum"] = null;

  if (direction !== "flat" && history.length >= 3) {
    const previous = history[history.length - 2] - history[history.length - 3];
    const previousDirection: TrendState["direction"] =
      previous > 0 ? "up" : previous < 0 ? "down" : "flat";
    if (previousDirection === direction) {
      momentum = "accelerating";
    }
  }

  return { direction, momentum };
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

function scaleDelta<T extends string>(delta: Delta<T> | undefined, multiplier: number): Delta<T> | undefined {
  if (!delta) {
    return undefined;
  }
  const next: Delta<T> = {};
  for (const [key, value] of Object.entries(delta) as Array<[T, number]>) {
    next[key] = Math.round(value * multiplier);
  }
  return next;
}

function scaleEffectPack(pack: EffectPack, multiplier: number): EffectPack {
  return {
    statEffects: scaleDelta(pack.statEffects, multiplier),
    resourceEffects: scaleDelta(pack.resourceEffects, multiplier),
    actorEffects: pack.actorEffects,
    coupRisk: pack.coupRisk !== undefined ? Math.round(pack.coupRisk * multiplier) : undefined,
  };
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

export function applyActorEffects(actors: Record<ActorKey, ActorState>, effects: ActorEffects) {
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

export function getDoctrineRules(doctrineId: DoctrineId | null) {
  const doctrine = getDoctrine(doctrineId);
  if (!doctrine) {
    return EMPTY_DOCTRINE_RULES;
  }
  return {
    ...doctrine.ruleMods,
    actionApAdjustments: doctrine.ruleMods.actionApAdjustments ?? {},
    thresholdDanger: { ...DEFAULT_THRESHOLD_DANGER, ...doctrine.ruleMods.thresholdDanger },
  };
}

export function getActionPointCost(baseCost: number, actionId: string, doctrineId: DoctrineId | null) {
  const rules = getDoctrineRules(doctrineId);
  const adjustment = rules.actionApAdjustments[actionId] ?? 0;
  return clamp(baseCost + adjustment, 0, 4);
}

export function getPolicy(policyId: PolicyId) {
  return POLICIES.find((policy) => policy.id === policyId);
}

export function getScenario(scenarioId: string) {
  return SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? SCENARIOS[0];
}

export function getIntelProfile(intel: number, doctrineId: DoctrineId | null): IntelProfile {
  const doctrine = getDoctrine(doctrineId);
  const rules = getDoctrineRules(doctrineId);
  const shift = doctrine?.uncertaintyShift ?? 0;
  const baseVariance = intel >= 12 ? 2 : intel >= 8 ? 4 : 6;
  const variance = clamp(baseVariance + shift + rules.varianceBias, 1, 10);
  const confidence: IntelProfile["confidence"] =
    variance <= 2 ? "High" : variance <= 5 ? "Medium" : "Low";
  return { confidence, variance };
}

export function computeOutcomeVariance(
  baseVariance: number,
  doctrineId: DoctrineId | null,
  pressure: number,
) {
  const pressureVariance =
    doctrineId === "populist" ? Math.floor(pressure / 18) : Math.floor(pressure / 45);
  return clamp(baseVariance + pressureVariance, 1, 10);
}

export function confidenceBand(variance: number): "High" | "Medium" | "Low" {
  if (variance <= 3) {
    return "High";
  }
  if (variance <= 6) {
    return "Medium";
  }
  return "Low";
}

function getActionStatEffects(action: OutcomeAction): Delta<StatKey> {
  if ("statEffects" in action) {
    return action.statEffects ?? {};
  }
  return action.effects.statEffects ?? {};
}

function actionScopeSeed(
  state: OutcomeState,
  crisisId: string,
  actionId: string,
  scope: "estimate" | "resolve",
) {
  return hashSeed(
    `${state.seedText}:${state.turn}:${crisisId}:${actionId}:${scope}:${state.resources.intel}:${state.pressure}:${state.doctrine ?? "none"}`,
  );
}

export function estimateActionOutcome(
  state: OutcomeState,
  action: OutcomeAction,
  crisisId = state.scenarioId,
): OutcomeEstimate[] {
  const profile = getIntelProfile(state.resources.intel, state.doctrine);
  const variance = computeOutcomeVariance(profile.variance, state.doctrine, state.pressure);
  let scopedRng = actionScopeSeed(state, crisisId, action.id, "estimate");
  const estimates: OutcomeEstimate[] = [];
  const statEffects = getActionStatEffects(action);

  for (const stat of STAT_META.map((item) => item.key)) {
    const base = statEffects[stat];
    if (!base) {
      continue;
    }

    const width = Math.max(1, variance - (Math.abs(base) <= 2 ? 1 : 0));
    const lowerRoll = randomInt(scopedRng, 0, width);
    scopedRng = lowerRoll.nextState;
    const upperRoll = randomInt(scopedRng, 0, width);
    scopedRng = upperRoll.nextState;

    const min = base - width - lowerRoll.value;
    const max = base + width + upperRoll.value;
    const low = Math.min(min, max);
    const high = Math.max(min, max);

    estimates.push({
      system: stat,
      min: low,
      max: high,
      confidence: confidenceBand(Math.max(1, Math.ceil((high - low) / 2))),
    });
  }

  return estimates;
}

export function sampleActionOutcome(
  state: OutcomeState,
  action: OutcomeAction,
  crisisId = state.scenarioId,
) {
  const profile = getIntelProfile(state.resources.intel, state.doctrine);
  const variance = computeOutcomeVariance(profile.variance, state.doctrine, state.pressure);
  let scopedRng = actionScopeSeed(state, crisisId, action.id, "resolve");
  const sampled: Delta<StatKey> = {};
  const statEffects = getActionStatEffects(action);

  for (const stat of STAT_META.map((item) => item.key)) {
    const base = statEffects[stat];
    if (!base) {
      continue;
    }

    const width = Math.max(1, variance - (Math.abs(base) <= 2 ? 1 : 0));
    const roll = randomInt(scopedRng, -width, width);
    scopedRng = roll.nextState;
    sampled[stat] = base + roll.value;
  }

  return { effects: sampled, rngState: scopedRng };
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

function ruleMatches(
  rule: CrisisFollowupRule,
  scenario: Scenario,
  option: ScenarioOption,
  stats: Record<StatKey, number>,
  actors: Record<ActorKey, ActorState>,
  pressure: number,
) {
  if (rule.fromScenarioId !== "any" && rule.fromScenarioId !== scenario.id) {
    return false;
  }
  if (rule.optionId && rule.optionId !== option.id) {
    return false;
  }
  if (rule.requiresAnyScenarioTag?.length) {
    const scenarioTags = scenario.tags ?? [];
    if (!rule.requiresAnyScenarioTag.some((tag) => scenarioTags.includes(tag))) {
      return false;
    }
  }
  if (rule.requiresAnyOptionTag?.length) {
    const optionTags = option.tags ?? [];
    if (!rule.requiresAnyOptionTag.some((tag) => optionTags.includes(tag))) {
      return false;
    }
  }
  if (rule.minPressure !== undefined && pressure < rule.minPressure) {
    return false;
  }
  if (rule.maxSecurity !== undefined && stats.security > rule.maxSecurity) {
    return false;
  }
  if (rule.maxTrust !== undefined && stats.trust > rule.maxTrust) {
    return false;
  }
  if (rule.maxTreasury !== undefined && stats.treasury > rule.maxTreasury) {
    return false;
  }
  if (rule.maxInfluence !== undefined && stats.influence > rule.maxInfluence) {
    return false;
  }
  if (rule.minPublicPressure !== undefined && actors.public.pressure < rule.minPublicPressure) {
    return false;
  }
  return true;
}

export function pickScenarioWithChains(
  previousId: string | undefined,
  scenario: Scenario,
  option: ScenarioOption,
  stats: Record<StatKey, number>,
  actors: Record<ActorKey, ActorState>,
  pressure: number,
  rngState: number,
): { scenarioId: string; rngState: number; chainRuleId: string | null } {
  let nextRng = rngState;
  for (const rule of FOLLOWUP_RULES) {
    if (!ruleMatches(rule, scenario, option, stats, actors, pressure)) {
      continue;
    }
    const chance = clamp(rule.chance + pressure * 0.002, 0, 0.95);
    const roll = randomChance(nextRng, chance);
    nextRng = roll.nextState;
    if (roll.hit) {
      return { scenarioId: rule.toScenarioId, rngState: nextRng, chainRuleId: rule.id };
    }
  }

  const fallback = pickScenario(previousId, nextRng);
  return { scenarioId: fallback.scenarioId, rngState: fallback.rngState, chainRuleId: null };
}

export function createInitialGame(seedText: string): GameState {
  const normalizedSeed = normalizeSeed(seedText);
  const firstPick = pickScenario(undefined, hashSeed(normalizedSeed));
  const initialStats = {
    stability: 60,
    treasury: 56,
    influence: 54,
    security: 52,
    trust: 55,
  };
  const initialPressure = 12;
  const initialSystems = snapshotCoreSystems(initialStats, initialPressure);

  return {
    seedText: normalizedSeed,
    rngState: firstPick.rngState,
    turn: 1,
    maxTurns: 12,
    phase: "playing",
    turnStage: "crisis",
    message:
      "Choose a doctrine, spend AP, then resolve crisis. Delayed fallout and threshold shocks are active.",
    scenarioId: firstPick.scenarioId,
    doctrine: null,
    maxActionPoints: 2,
    actionPoints: 2,
    pressure: initialPressure,
    collapseCount: 0,
    coupRisk: 12,
    stats: initialStats,
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
    regionMemory: buildInitialRegionMemory(),
    cooldowns: {},
    thresholdsFired: {},
    activePolicies: [],
    effectsQueue: [],
    lastTurnSystems: initialSystems,
    systemHistory: [initialSystems],
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

export function applyEffectsQueueForTurn(
  effectsQueue: QueuedEffect[],
  turn: number,
  rngState: number,
  intelConfidence: IntelProfile["confidence"],
) {
  let statEffects: Delta<StatKey> = {};
  let resourceEffects: Delta<ResourceKey> = {};
  let actorEffects: ActorEffects = {};
  let coupRisk = 0;
  const remaining: QueuedEffect[] = [];
  const applied: QueuedEffect[] = [];
  const logs: string[] = [];
  let nextRng = rngState;

  for (const queued of effectsQueue) {
    if (queued.turnToApply > turn) {
      remaining.push(queued);
      continue;
    }

    applied.push(queued);
    statEffects = mergeDelta(statEffects, queued.deltas.statEffects);
    resourceEffects = mergeDelta(resourceEffects, queued.deltas.resourceEffects);
    actorEffects = mergeActorEffects(actorEffects, queued.deltas.actorEffects);
    coupRisk += queued.deltas.coupRisk ?? 0;

    if (queued.hidden && intelConfidence === "Low") {
      logs.push("An untracked fallout event triggered.");
    } else {
      logs.push(`Fallout triggered: ${queued.source}.`);
    }
    nextRng = randomFromState(nextRng).nextState;
  }

  return {
    remaining,
    applied,
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
  currentTurn = 1,
  scopeRegions: RegionKey[] = [],
): { queued: QueuedEffect[]; logs: string[]; rngState: number } {
  const queued: QueuedEffect[] = [];
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
      id: `${option.id}-${delayed.label}-${currentTurn}-${nextRng}`,
      turnToApply: currentTurn + delayRoll.value,
      scope: scopeRegions.length > 0 ? { regions: scopeRegions } : "global",
      deltas: delayed.effects,
      tags: [...(option.tags ?? []), "delayed", delayed.label.toLowerCase()],
      source: delayed.label,
      hidden,
    });

    if (hidden) {
      logs.push("Potential latent shock detected (low confidence).");
    } else {
      logs.push(`${delayed.label} expected by turn ${currentTurn + delayRoll.value}.`);
    }
  }

  return { queued, logs, rngState: nextRng };
}

export function applyRegionMemoryDecay(
  regionMemory: Record<RegionKey, RegionMemoryState>,
): Record<RegionKey, RegionMemoryState> {
  const next = { ...regionMemory };
  for (const region of REGION_META.map((entry) => entry.key)) {
    next[region] = {
      resentment: Math.max(0, regionMemory[region].resentment - 1),
      dependency: Math.max(0, regionMemory[region].dependency - 1),
    };
  }
  return next;
}

export function applyRegionMemoryForResolution(
  regionMemory: Record<RegionKey, RegionMemoryState>,
  scenario: Scenario,
  option: ScenarioOption,
) {
  const next = applyRegionMemoryDecay(regionMemory);
  const tags = option.tags ?? [];
  const resentmentBase =
    (tags.some((tag) => ["repression", "controls", "coverup", "austerity"].includes(tag)) ? 8 : 0) +
    (option.risk === "High" ? 2 : 0);
  const dependencyBase = tags.some((tag) => ["relief", "bailout", "continuity"].includes(tag))
    ? 6
    : tags.some((tag) => ["coalition", "consensus", "deescalation"].includes(tag))
      ? 3
      : 0;

  for (const target of scenario.regionTargets) {
    const current = next[target];
    next[target] = {
      resentment: clamp(current.resentment + resentmentBase, 0, 100),
      dependency: clamp(current.dependency + dependencyBase, 0, 100),
    };
  }
  return next;
}

export function computePressureGain(
  scenarioSeverity: number,
  hotRegions: number,
  criticalRegions: number,
  security: number,
) {
  return Math.max(
    1,
    2 + scenarioSeverity + hotRegions + criticalRegions * 2 - Math.floor(security / 50),
  );
}

export function computeSpreadChance(pressure: number) {
  return clamp(0.08 + pressure * 0.005, 0.08, 0.58);
}

export function computeBaselineDrift(doctrineId: DoctrineId | null, pressure: number): Delta<StatKey> {
  const rules = getDoctrineRules(doctrineId);
  const trustDecay = Math.max(0, 1 + Math.floor(pressure / 40) + rules.trustDecayModifier);
  return { treasury: -2, trust: -trustDecay };
}

export function evaluateThresholdTriggers(
  previousStats: Record<StatKey, number>,
  nextStats: Record<StatKey, number>,
  thresholdsFired: Partial<Record<ThresholdKey, boolean>>,
  doctrineId: DoctrineId | null,
  currentTurn: number,
): {
  updatedThresholds: Partial<Record<ThresholdKey, boolean>>;
  queuedEffects: QueuedEffect[];
  logs: string[];
} {
  const rules = getDoctrineRules(doctrineId);
  const updatedThresholds = { ...thresholdsFired };
  const queuedEffects: QueuedEffect[] = [];
  const logs: string[] = [];

  const maybeQueue = (
    key: ThresholdKey,
    crossed: boolean,
    source: string,
    pack: EffectPack,
    tags: string[],
  ) => {
    if (!crossed || updatedThresholds[key]) {
      return;
    }
    updatedThresholds[key] = true;
    const scaled = scaleEffectPack(pack, rules.thresholdDanger[key] ?? 1);
    queuedEffects.push({
      id: `threshold-${key}-${currentTurn}`,
      turnToApply: currentTurn + 1,
      scope: "global",
      deltas: scaled,
      tags,
      source,
      hidden: false,
    });
    logs.push(`Threshold triggered: ${source}.`);
  };

  maybeQueue(
    "trust-protests",
    previousStats.trust >= 40 && nextStats.trust < 40,
    "Trust collapsed below 40 (protest risk)",
    {
      statEffects: { stability: -2, trust: -2 },
      actorEffects: { public: { pressure: 3 } },
      coupRisk: 2,
    },
    ["threshold", "trust", "protests"],
  );

  maybeQueue(
    "treasury-austerity",
    previousStats.treasury >= 30 && nextStats.treasury < 30,
    "Treasury slipped below 30 (austerity drag)",
    {
      statEffects: { stability: -3, trust: -2 },
      resourceEffects: { capital: -1 },
    },
    ["threshold", "treasury", "austerity"],
  );

  maybeQueue(
    "security-insurgency",
    previousStats.security >= 35 && nextStats.security < 35,
    "Security dropped below 35 (insurgent incident)",
    {
      statEffects: { security: -3, stability: -2 },
      actorEffects: { military: { pressure: 2 }, public: { pressure: 2 } },
      coupRisk: 6,
    },
    ["threshold", "security", "insurgency"],
  );

  return { updatedThresholds, queuedEffects, logs };
}

export function simulateRegions(
  regions: Record<RegionKey, number>,
  scenario: Scenario,
  option: ScenarioOption,
  security: number,
  rngState: number,
  pressure = 0,
  regionMemory: Record<RegionKey, RegionMemoryState> = buildInitialRegionMemory(),
) {
  const next = { ...regions };
  const impacted = new Set<RegionKey>();
  let nextRng = rngState;

  const effectiveSeverity = clamp(scenario.severity + Math.floor(pressure / 25), 1, 7);

  for (const region of REGION_META.map((entry) => entry.key)) {
    next[region] = clamp(next[region] - 2);
  }

  for (const target of scenario.regionTargets) {
    const roll = randomInt(nextRng, 0, 4);
    nextRng = roll.nextState;
    const memory = regionMemory[target];
    const resentmentBias = Math.floor(memory.resentment / 25);
    const dependencyBias = Math.floor(memory.dependency / 35);
    next[target] = clamp(
      next[target] + effectiveSeverity * 6 + option.spread * 3 + roll.value + resentmentBias - dependencyBias,
    );
    impacted.add(target);
  }

  let spillCount = 1;
  const extraSpread = randomChance(nextRng, computeSpreadChance(pressure));
  nextRng = extraSpread.nextState;
  if (extraSpread.hit) {
    spillCount += 1;
  }
  if (pressure >= 75) {
    const secondSpread = randomChance(nextRng, 0.35);
    nextRng = secondSpread.nextState;
    if (secondSpread.hit) {
      spillCount += 1;
    }
  }

  for (let i = 0; i < spillCount; i += 1) {
    const spillRoll = randomInt(nextRng, 0, REGION_META.length - 1);
    nextRng = spillRoll.nextState;
    const spillRegion = REGION_META[spillRoll.value].key;
    next[spillRegion] = clamp(next[spillRegion] + effectiveSeverity * 2 + Math.floor(pressure / 25));
    impacted.add(spillRegion);
  }

  const mitigationRoll = randomInt(nextRng, 0, REGION_META.length - 1);
  nextRng = mitigationRoll.nextState;
  const mitigationRegion = REGION_META[mitigationRoll.value].key;
  const mitigation = Math.floor(security / 12) + 2;
  next[mitigationRegion] = clamp(next[mitigationRegion] - mitigation);
  impacted.add(mitigationRegion);

  const hotRegions = REGION_META.filter((region) => next[region.key] >= 70).length;
  const criticalRegions = REGION_META.filter((region) => next[region.key] >= 85).length;

  return {
    regions: next,
    impactedRegions: [...impacted],
    effectiveSeverity,
    statPenalty: {
      trust: -hotRegions - Math.floor(pressure / 30),
      stability: -criticalRegions,
    } as Delta<StatKey>,
    coupRiskDelta: criticalRegions * 3 + Math.floor(pressure / 18),
    summary: `${hotRegions} hot / ${criticalRegions} critical`,
    rngState: nextRng,
  };
}

export function computeSystemCoupling(
  stats: Record<StatKey, number>,
  resources: Record<ResourceKey, number>,
  actors: Record<ActorKey, ActorState>,
  doctrineId: DoctrineId | null,
  pressure = 0,
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
  if (pressure >= 60) {
    statEffects = mergeDelta(statEffects, { trust: -1, stability: -1 });
    coupRisk += 2;
  }

  return { statEffects, resourceEffects, actorEffects, coupRisk };
}

export function describeEstimatedImpact(option: ScenarioOption, profile: IntelProfile, pressure = 0) {
  const variance = computeOutcomeVariance(profile.variance, null, pressure);
  const lines = STAT_META.map((stat) => {
    const base = option.statEffects[stat.key];
    if (!base) {
      return null;
    }
    const range = estimateEffectRange(base, variance);
    return `${stat.label} ${range.min > 0 ? "+" : ""}${range.min} to ${range.max > 0 ? "+" : ""}${
      range.max
    }`;
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
    isRecord(value.regions) &&
    isRecord(value.regionMemory)
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
