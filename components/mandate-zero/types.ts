export type StatKey = "stability" | "treasury" | "influence" | "security" | "trust";
export type ResourceKey = "intel" | "supplies" | "capital";
export type ActorKey = "banks" | "military" | "media" | "public";
export type RegionKey = "north" | "south" | "capital" | "industry" | "border" | "coast";
export type Phase = "playing" | "won" | "lost";
export type RiskLevel = "Low" | "Medium" | "High";
export type DoctrineId = "technocrat" | "populist" | "militarist";
export type PolicyId =
  | "emergency-powers-act"
  | "central-bank-authority"
  | "civic-autonomy-charter";
export type Delta<T extends string> = Partial<Record<T, number>>;

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
  risk: RiskLevel;
  factionReaction: string;
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
  severity: number;
  regionTargets: RegionKey[];
  options: ScenarioOption[];
}

export interface Doctrine {
  id: DoctrineId;
  title: string;
  description: string;
  uncertaintyShift: number;
  securityTrustPenalty: number;
  startEffects: EffectPack;
}

export interface StrategicAction {
  id: string;
  title: string;
  description: string;
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

export interface GameState {
  seedText: string;
  rngState: number;
  turn: number;
  maxTurns: number;
  phase: Phase;
  message: string;
  scenarioId: string;
  doctrine: DoctrineId | null;
  maxActionPoints: number;
  actionPoints: number;
  collapseCount: number;
  coupRisk: number;
  stats: Record<StatKey, number>;
  resources: Record<ResourceKey, number>;
  actors: Record<ActorKey, ActorState>;
  regions: Record<RegionKey, number>;
  cooldowns: Record<string, number>;
  activePolicies: PolicyId[];
  pendingEffects: PendingEffect[];
  lastStatDelta: Delta<StatKey>;
  lastResourceDelta: Delta<ResourceKey>;
  lastActorLoyaltyDelta: Delta<ActorKey>;
  lastActorPressureDelta: Delta<ActorKey>;
}

export interface SavedRunPayload {
  game: GameState;
  history: string[];
  seedInput: string;
}

export interface IntelProfile {
  confidence: "High" | "Medium" | "Low";
  variance: number;
}
