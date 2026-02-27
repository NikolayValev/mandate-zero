export type StatKey = "stability" | "treasury" | "influence" | "security" | "trust";
export type CoreSystemKey = StatKey | "pressure";
export type ResourceKey = "intel" | "supplies" | "capital";
export type ActorKey = "banks" | "military" | "media" | "public";
export type RegionKey = "north" | "south" | "capital" | "industry" | "border" | "coast";
export type Phase = "playing" | "won" | "lost";
export type TurnStage = "crisis" | "decision" | "resolution" | "fallout";
export type RiskLevel = "Low" | "Medium" | "High";
export type DoctrineId = "technocrat" | "populist" | "militarist";
export type ThresholdKey = "trust-protests" | "treasury-austerity" | "security-insurgency";
export type PolicyId =
  | "emergency-powers-act"
  | "central-bank-authority"
  | "civic-autonomy-charter";
export type Delta<T extends string> = Partial<Record<T, number>>;
export type TierId = "critical" | "fragile" | "unstable" | "stable" | "strong";
export type TrendDirection = "up" | "down" | "flat";
export type TrendMomentum = "accelerating" | null;

export interface ActorState {
  loyalty: number;
  pressure: number;
}

export interface ActorShift {
  loyalty?: number;
  pressure?: number;
}

export type ActorEffects = Partial<Record<ActorKey, ActorShift>>;

export interface EffectPack {
  statEffects?: Delta<StatKey>;
  resourceEffects?: Delta<ResourceKey>;
  actorEffects?: ActorEffects;
  coupRisk?: number;
}

export type EffectScope = "global" | { regions?: RegionKey[]; actors?: ActorKey[] };

export interface QueuedEffect {
  id: string;
  turnToApply: number;
  scope: EffectScope;
  deltas: EffectPack;
  tags: string[];
  source: string;
  hidden?: boolean;
}

export interface DelayedTemplate {
  label: string;
  chance: number;
  delayMin: number;
  delayMax: number;
  effects: EffectPack;
}

export interface PendingEffect {
  id: string;
  label: string;
  turnsLeft: number;
  hidden: boolean;
  effects: EffectPack;
}

export interface ScenarioOption {
  id: string;
  title: string;
  description: string;
  narrative?: string;
  riskHint?: string;
  risk: RiskLevel;
  factionReaction: string;
  tags?: string[];
  spread: number;
  statEffects: Delta<StatKey>;
  resourceEffects?: Delta<ResourceKey>;
  actorEffects?: ActorEffects;
  delayed?: DelayedTemplate[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  briefing?: string;
  severity: number;
  tags?: string[];
  regionTargets: RegionKey[];
  options: ScenarioOption[];
}

export interface CrisisFollowupRule {
  id: string;
  fromScenarioId: string | "any";
  toScenarioId: string;
  chance: number;
  optionId?: string;
  requiresAnyScenarioTag?: string[];
  requiresAnyOptionTag?: string[];
  minPressure?: number;
  maxSecurity?: number;
  maxTrust?: number;
  maxTreasury?: number;
  maxInfluence?: number;
  minPublicPressure?: number;
}

export interface DoctrineRuleMods {
  varianceBias: number;
  trustDecayModifier: number;
  actionApAdjustments: Partial<Record<string, number>>;
  thresholdDanger: Partial<Record<ThresholdKey, number>>;
}

export interface Doctrine {
  id: DoctrineId;
  title: string;
  description: string;
  uncertaintyShift: number;
  securityTrustPenalty: number;
  ruleMods: DoctrineRuleMods;
  startEffects: EffectPack;
}

export interface StrategicAction {
  id: string;
  title: string;
  description: string;
  narrative?: string;
  riskHint?: string;
  apCost: number;
  cooldown: number;
  risk: RiskLevel;
  resourceCost?: Delta<ResourceKey>;
  effects: EffectPack;
}

export interface PolicyCommitment {
  id: PolicyId;
  title: string;
  description: string;
  apCost: number;
  capitalCost: number;
  maxActionPointBonus?: number;
  immediate: EffectPack;
  passive: EffectPack;
}

export interface DemoSeed {
  id: string;
  name: string;
  value: string;
  custom?: boolean;
}

export interface RegionMemoryState {
  resentment: number;
  dependency: number;
}

export interface TierState {
  tierId: TierId;
  label: string;
  severity: number;
}

export interface CausalityStep {
  label: string;
  detail: string;
}

export interface CausalityEntry {
  id: string;
  turn: number;
  phase: TurnStage;
  actionId: string;
  actionLabel: string;
  crisisId: string;
  crisisLabel: string;
  immediateDeltas: Delta<StatKey>;
  delayedEnqueued: string[];
  thresholdsTriggered: string[];
  regionImpacts: RegionKey[];
  title?: string;
  affectedRegions?: RegionKey[];
  steps?: CausalityStep[];
}

export interface TrendState {
  direction: TrendDirection;
  momentum: TrendMomentum;
}

export interface OutcomeEstimate {
  system: StatKey;
  min: number;
  max: number;
  confidence: IntelProfile["confidence"];
}

export interface MandateObjectiveSnapshot {
  stabilityTarget: number;
  trustTarget: number;
  pressureCap: number;
  avgStressCap: number;
  coupRiskCap: number;
  currentAvgStress: number;
  passes: {
    stability: boolean;
    trust: boolean;
    pressure: boolean;
    avgStress: boolean;
    coupRisk: boolean;
    all: boolean;
  };
}

export interface GameState {
  seedText: string;
  rngState: number;
  turn: number;
  maxTurns: number;
  phase: Phase;
  turnStage: TurnStage;
  message: string;
  scenarioId: string;
  doctrine: DoctrineId | null;
  maxActionPoints: number;
  actionPoints: number;
  pressure: number;
  collapseCount: number;
  coupRisk: number;
  stats: Record<StatKey, number>;
  resources: Record<ResourceKey, number>;
  actors: Record<ActorKey, ActorState>;
  regions: Record<RegionKey, number>;
  regionMemory: Record<RegionKey, RegionMemoryState>;
  cooldowns: Record<string, number>;
  thresholdsFired: Partial<Record<ThresholdKey, boolean>>;
  activePolicies: PolicyId[];
  effectsQueue: QueuedEffect[];
  lastTurnSystems: Record<CoreSystemKey, number>;
  systemHistory: Array<Record<CoreSystemKey, number>>;
  lastStatDelta: Delta<StatKey>;
  lastResourceDelta: Delta<ResourceKey>;
  lastActorLoyaltyDelta: Delta<ActorKey>;
  lastActorPressureDelta: Delta<ActorKey>;
}

export interface SavedRunPayload {
  game: GameState;
  history: string[];
  causalityHistory?: CausalityEntry[];
  seedInput: string;
}

export interface IntelProfile {
  confidence: "High" | "Medium" | "Low";
  variance: number;
}
