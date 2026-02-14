"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatKey = "stability" | "treasury" | "influence" | "security" | "trust";
type ResourceKey = "intel" | "supplies" | "capital";
type Phase = "playing" | "won" | "lost";
type Delta<T extends string> = Partial<Record<T, number>>;

interface ScenarioOption {
  id: string;
  title: string;
  description: string;
  statEffects: Delta<StatKey>;
  resourceEffects?: Delta<ResourceKey>;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  options: ScenarioOption[];
}

interface StrategicAction {
  id: string;
  title: string;
  description: string;
  apCost: number;
  cooldown: number;
  resourceCost?: Delta<ResourceKey>;
  statEffects: Delta<StatKey>;
  resourceEffects?: Delta<ResourceKey>;
}

interface GameState {
  seedText: string;
  rngState: number;
  turn: number;
  maxTurns: number;
  phase: Phase;
  message: string;
  maxActionPoints: number;
  actionPoints: number;
  stats: Record<StatKey, number>;
  resources: Record<ResourceKey, number>;
  cooldowns: Record<string, number>;
}

interface DemoSeed {
  id: string;
  name: string;
  value: string;
  custom?: boolean;
}

interface SavedRunPayload {
  game: GameState;
  scenarioId: string;
  history: string[];
  seedInput: string;
}

const STAT_META: Array<{ key: StatKey; label: string }> = [
  { key: "stability", label: "Stability" },
  { key: "treasury", label: "Treasury" },
  { key: "influence", label: "Influence" },
  { key: "security", label: "Security" },
  { key: "trust", label: "Public Trust" },
];

const RESOURCE_META: Array<{ key: ResourceKey; label: string }> = [
  { key: "intel", label: "Intel" },
  { key: "supplies", label: "Supplies" },
  { key: "capital", label: "Political Capital" },
];

const STRATEGIC_ACTIONS: StrategicAction[] = [
  {
    id: "intel-sweep",
    title: "Intel Sweep",
    description: "Run covert surveillance and map short-term threats.",
    apCost: 1,
    cooldown: 2,
    resourceCost: { supplies: 2 },
    statEffects: { security: 4, influence: 2 },
    resourceEffects: { intel: 5 },
  },
  {
    id: "emergency-subsidy",
    title: "Emergency Subsidy",
    description: "Buy social calm with direct household support.",
    apCost: 2,
    cooldown: 3,
    resourceCost: { capital: 4 },
    statEffects: { trust: 7, stability: 5, treasury: -8 },
  },
  {
    id: "diplomatic-tour",
    title: "Diplomatic Tour",
    description: "Trade concessions for coalition stability and foreign backing.",
    apCost: 1,
    cooldown: 3,
    resourceCost: { intel: 2, capital: 2 },
    statEffects: { influence: 7, trust: 2, security: -2 },
    resourceEffects: { capital: 2 },
  },
  {
    id: "reserve-mobilization",
    title: "Reserve Mobilization",
    description: "Raise readiness quickly at political cost.",
    apCost: 1,
    cooldown: 3,
    resourceCost: { supplies: 3 },
    statEffects: { security: 9, stability: 2, trust: -4, treasury: -3 },
  },
  {
    id: "industrial-push",
    title: "Industrial Push",
    description: "Accelerate domestic production pipelines.",
    apCost: 2,
    cooldown: 2,
    resourceCost: { capital: 3 },
    statEffects: { treasury: 6, stability: 3, trust: -2 },
    resourceEffects: { supplies: 4 },
  },
];

const SCENARIOS: Scenario[] = [
  {
    id: "port-strike",
    title: "Port Worker Strike",
    description: "Cargo lanes are blocked. Every hour hurts your economy and your image.",
    options: [
      {
        id: "negotiate",
        title: "Negotiate Fair Terms",
        description: "Pay more now, calm tensions, and regain trust.",
        statEffects: { treasury: -10, trust: 10, stability: 7 },
        resourceEffects: { capital: -2 },
      },
      {
        id: "force",
        title: "Deploy Security Units",
        description: "Restore operations quickly with a visible crackdown.",
        statEffects: { security: 8, stability: 4, trust: -11, influence: -4 },
        resourceEffects: { supplies: -3 },
      },
      {
        id: "outsource",
        title: "Hire External Contractors",
        description: "Short-term fix with political backlash.",
        statEffects: { treasury: -7, stability: 3, trust: -6, influence: 4 },
        resourceEffects: { capital: -1, supplies: 2 },
      },
    ],
  },
  {
    id: "intel-breach",
    title: "Intelligence Breach",
    description: "A rival leaked your tactical notes. The council expects a response.",
    options: [
      {
        id: "counter-op",
        title: "Run Counter-Operation",
        description: "Restore deterrence with covert pressure.",
        statEffects: { security: 10, influence: 5, treasury: -6, trust: -5 },
        resourceEffects: { intel: -4 },
      },
      {
        id: "public-inquiry",
        title: "Launch Public Inquiry",
        description: "Be transparent and accept short-term embarrassment.",
        statEffects: { trust: 9, stability: 4, influence: -4 },
        resourceEffects: { capital: 2 },
      },
      {
        id: "bury-story",
        title: "Suppress the Story",
        description: "Works briefly, but risks future fallout.",
        statEffects: { stability: 6, influence: 3, trust: -9 },
        resourceEffects: { intel: -1 },
      },
    ],
  },
  {
    id: "border-raid",
    title: "Border Raid Alert",
    description: "A fast-moving hostile force probes your perimeter defenses.",
    options: [
      {
        id: "mobilize",
        title: "Full Mobilization",
        description: "Maximum readiness at high operating cost.",
        statEffects: { security: 12, treasury: -9, stability: 4, trust: -3 },
        resourceEffects: { supplies: -5 },
      },
      {
        id: "precision",
        title: "Precision Response",
        description: "Targeted strike with balanced risk.",
        statEffects: { security: 7, influence: 4, treasury: -4, trust: -2 },
        resourceEffects: { intel: -2, supplies: -2 },
      },
      {
        id: "diplomatic",
        title: "Demand Talks",
        description: "Lower conflict risk if rivals accept terms.",
        statEffects: { trust: 5, treasury: -2, stability: -3, security: -4 },
        resourceEffects: { capital: 2, intel: 1 },
      },
    ],
  },
  {
    id: "energy-collapse",
    title: "Energy Grid Failure",
    description: "Rolling blackouts spread through key districts during peak hours.",
    options: [
      {
        id: "emergency-import",
        title: "Emergency Fuel Imports",
        description: "Expensive, but citizens see immediate relief.",
        statEffects: { treasury: -13, trust: 8, stability: 5 },
        resourceEffects: { supplies: 4, capital: -2 },
      },
      {
        id: "rationing",
        title: "Strict Rationing Plan",
        description: "Technically efficient and socially unpopular.",
        statEffects: { treasury: 2, stability: 2, trust: -10, security: -2 },
        resourceEffects: { supplies: 3 },
      },
      {
        id: "private-grid",
        title: "Partner with Private Grid",
        description: "Fast scale-up with influence gains for backers.",
        statEffects: { influence: 8, stability: 4, treasury: -5, trust: -4 },
        resourceEffects: { capital: -1, supplies: 2 },
      },
    ],
  },
  {
    id: "media-storm",
    title: "Media Storm",
    description: "A relentless cycle frames your administration as disconnected.",
    options: [
      {
        id: "town-halls",
        title: "Hold Open Town Halls",
        description: "Direct engagement restores confidence over time.",
        statEffects: { trust: 10, stability: 4, influence: -3 },
        resourceEffects: { capital: -2 },
      },
      {
        id: "ad-campaign",
        title: "Massive Ad Campaign",
        description: "You control narrative momentum, for a price.",
        statEffects: { influence: 9, treasury: -8, trust: -3, stability: 2 },
        resourceEffects: { capital: -3 },
      },
      {
        id: "ignore",
        title: "Ignore and Keep Building",
        description: "Preserve resources and gamble on future results.",
        statEffects: { treasury: 3, trust: -8, stability: -4 },
        resourceEffects: { capital: 1 },
      },
    ],
  },
  {
    id: "coalition-vote",
    title: "Coalition Confidence Vote",
    description: "Allies want concessions before they back your leadership agenda.",
    options: [
      {
        id: "share-power",
        title: "Share Cabinet Seats",
        description: "Stable majority, weaker individual authority.",
        statEffects: { stability: 10, influence: -6, trust: 4 },
        resourceEffects: { capital: -3 },
      },
      {
        id: "hardline",
        title: "Force Party Discipline",
        description: "Project strength, alienate moderates.",
        statEffects: { influence: 8, stability: -7, trust: -7, security: 2 },
        resourceEffects: { capital: 2 },
      },
      {
        id: "policy-trade",
        title: "Offer Policy Trade",
        description: "Pragmatic compromise with mixed outcomes.",
        statEffects: { stability: 5, trust: 3, treasury: -4, influence: 3 },
        resourceEffects: { capital: -1 },
      },
    ],
  },
  {
    id: "cyber-blackout",
    title: "Cyber Blackout",
    description: "A cascading attack disables payment rails and municipal networks.",
    options: [
      {
        id: "offline-protocol",
        title: "Activate Offline Protocol",
        description: "Stabilize essentials while systems stay limited.",
        statEffects: { stability: 6, trust: 3, treasury: -4 },
        resourceEffects: { supplies: -2 },
      },
      {
        id: "foreign-contract",
        title: "Hire Foreign Security Firm",
        description: "Fast patching with sovereignty concerns.",
        statEffects: { security: 9, influence: -4, trust: -3, treasury: -6 },
        resourceEffects: { intel: 2 },
      },
      {
        id: "domestic-taskforce",
        title: "Build Domestic Taskforce",
        description: "Slower response, stronger long-term capability.",
        statEffects: { security: 5, influence: 5, stability: 2 },
        resourceEffects: { intel: 4, capital: -2 },
      },
    ],
  },
  {
    id: "bank-run",
    title: "Regional Bank Run",
    description: "Panic withdrawals spread from one province into national headlines.",
    options: [
      {
        id: "guarantee-deposits",
        title: "Guarantee Deposits",
        description: "Reassure citizens at direct budgetary risk.",
        statEffects: { trust: 10, stability: 6, treasury: -12 },
        resourceEffects: { capital: -2 },
      },
      {
        id: "freeze-transfers",
        title: "Freeze Large Transfers",
        description: "Stops outflow and triggers public outrage.",
        statEffects: { security: 4, treasury: 4, trust: -10, influence: -3 },
        resourceEffects: { capital: 1 },
      },
      {
        id: "merge-banks",
        title: "Force Emergency Mergers",
        description: "Technocratic fix with elite resistance.",
        statEffects: { stability: 7, treasury: -3, influence: 4, trust: -3 },
        resourceEffects: { capital: -1 },
      },
    ],
  },
  {
    id: "election-shock",
    title: "Snap Election Shock",
    description: "A surprise legal ruling brings elections forward by several months.",
    options: [
      {
        id: "campaign-now",
        title: "Shift to Campaign Mode",
        description: "Consolidate support and pause structural reforms.",
        statEffects: { trust: 7, influence: 6, treasury: -5, stability: -2 },
        resourceEffects: { capital: -4 },
      },
      {
        id: "govern-hard",
        title: "Pass Hard Reforms Immediately",
        description: "Deliver outcomes quickly and absorb social backlash.",
        statEffects: { treasury: 6, stability: 4, trust: -8, influence: -2 },
        resourceEffects: { capital: -2, supplies: 1 },
      },
      {
        id: "unity-cabinet",
        title: "Form Unity Cabinet",
        description: "Reduce polarization and dilute your agenda.",
        statEffects: { stability: 8, trust: 5, influence: -7 },
        resourceEffects: { capital: 2 },
      },
    ],
  },
];

const DEFAULT_SEED = "demo-seed-001";
const CUSTOM_SEEDS_STORAGE_KEY = "mandate-zero-demo-seeds-v1";
const RUN_STORAGE_KEY = "mandate-zero-run-v1";
const BUILT_IN_DEMO_SEEDS: DemoSeed[] = [
  { id: "baseline", name: "Baseline", value: DEFAULT_SEED },
  { id: "economic", name: "Economic Stress", value: "econ-shock-2026" },
  { id: "security", name: "Security Spiral", value: "security-spiral-77" },
  { id: "media", name: "Media Meltdown", value: "media-storm-9x" },
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function normalizeSeed(seedText: string) {
  const trimmed = seedText.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_SEED;
}

function hashSeed(seedText: string) {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

function nextRngState(state: number) {
  return (Math.imul(1664525, state) + 1013904223) >>> 0;
}

function randomFromState(state: number) {
  const nextState = nextRngState(state);
  return { value: nextState / 4294967296, nextState };
}

function createInitialGame(seedText: string): GameState {
  const normalizedSeed = normalizeSeed(seedText);
  return {
    seedText: normalizedSeed,
    rngState: hashSeed(normalizedSeed),
    turn: 1,
    maxTurns: 12,
    phase: "playing",
    message: "Spend AP on strategic actions, then resolve the crisis.",
    maxActionPoints: 3,
    actionPoints: 3,
    stats: {
      stability: 62,
      treasury: 58,
      influence: 55,
      security: 54,
      trust: 56,
    },
    resources: {
      intel: 8,
      supplies: 8,
      capital: 8,
    },
    cooldowns: {},
  };
}

function pickScenario(previousId: string | undefined, rngState: number) {
  const choices = SCENARIOS.filter((scenario) => scenario.id !== previousId);
  const pool = choices.length > 0 ? choices : SCENARIOS;
  const random = randomFromState(rngState);
  const index = Math.floor(random.value * pool.length);
  return { scenario: pool[index], rngState: random.nextState };
}

function initializeRun(seedText: string) {
  const game = createInitialGame(seedText);
  const start = pickScenario(undefined, game.rngState);
  return {
    game: {
      ...game,
      rngState: start.rngState,
    },
    scenario: start.scenario,
  };
}

const DEFAULT_RUN = initializeRun(DEFAULT_SEED);

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function applyStatDelta(current: Record<StatKey, number>, delta: Delta<StatKey>) {
  const next = { ...current };
  for (const stat of STAT_META) {
    const change = delta[stat.key] ?? 0;
    next[stat.key] = clamp(next[stat.key] + change);
  }
  return next;
}

function applyResourceDelta(
  current: Record<ResourceKey, number>,
  delta: Delta<ResourceKey>,
) {
  const next = { ...current };
  for (const resource of RESOURCE_META) {
    const change = delta[resource.key] ?? 0;
    next[resource.key] = clamp(next[resource.key] + change);
  }
  return next;
}

function mergeDelta<T extends string>(base: Delta<T>, addition?: Delta<T>) {
  if (!addition) {
    return base;
  }
  const next = { ...base };
  for (const [key, value] of Object.entries(addition) as Array<[T, number]>) {
    next[key] = (next[key] ?? 0) + value;
  }
  return next;
}

function hasResourceCost(resources: Record<ResourceKey, number>, cost?: Delta<ResourceKey>) {
  if (!cost) {
    return true;
  }
  return Object.entries(cost).every(([key, value]) => {
    const required = value ?? 0;
    return resources[key as ResourceKey] >= required;
  });
}

function costToDelta(cost?: Delta<ResourceKey>): Delta<ResourceKey> {
  if (!cost) {
    return {};
  }
  const delta: Delta<ResourceKey> = {};
  for (const [key, value] of Object.entries(cost) as Array<[ResourceKey, number]>) {
    delta[key] = -(value ?? 0);
  }
  return delta;
}

function reduceCooldowns(cooldowns: Record<string, number>) {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(cooldowns)) {
    const reduced = Math.max(0, value - 1);
    if (reduced > 0) {
      next[key] = reduced;
    }
  }
  return next;
}

function summarizeDelta<T extends string>(
  delta: Delta<T>,
  meta: Array<{ key: T; label: string }>,
) {
  return meta
    .map((item) => {
      const value = delta[item.key] ?? 0;
      if (value === 0) {
        return null;
      }
      return `${item.label} ${formatDelta(value)}`;
    })
    .filter((line): line is string => Boolean(line))
    .join(", ");
}

function computeResourcePenalty(resources: Record<ResourceKey, number>) {
  const penalty: Delta<StatKey> = {};
  const warnings: string[] = [];

  if (resources.supplies === 0) {
    penalty.security = (penalty.security ?? 0) - 6;
    penalty.stability = (penalty.stability ?? 0) - 4;
    warnings.push("Supply lines exhausted");
  }

  if (resources.intel === 0) {
    penalty.influence = (penalty.influence ?? 0) - 5;
    penalty.security = (penalty.security ?? 0) - 2;
    warnings.push("No intelligence coverage");
  }

  if (resources.capital === 0) {
    penalty.trust = (penalty.trust ?? 0) - 6;
    penalty.stability = (penalty.stability ?? 0) - 3;
    warnings.push("Coalition goodwill depleted");
  }

  return { penalty, warnings };
}

function resolveScenarioTurn(game: GameState, scenario: Scenario, option: ScenarioOption) {
  const passiveStats: Delta<StatKey> = { treasury: -2, trust: -1 };
  const passiveResources: Delta<ResourceKey> = { intel: 1, supplies: 1, capital: 1 };

  let statDelta = mergeDelta<StatKey>(passiveStats, option.statEffects);
  const resourceDelta = mergeDelta<ResourceKey>(passiveResources, option.resourceEffects);

  const nextResources = applyResourceDelta(game.resources, resourceDelta);
  const penaltyState = computeResourcePenalty(nextResources);
  statDelta = mergeDelta<StatKey>(statDelta, penaltyState.penalty);

  const nextStats = applyStatDelta(game.stats, statDelta);
  const completedTurn = game.turn + 1;
  const depletedStats = STAT_META.filter((stat) => nextStats[stat.key] === 0);

  let phase: Phase = "playing";
  let message = `${scenario.title}: ${option.title}`;

  if (depletedStats.length > 0) {
    phase = "lost";
    message = `Collapse: ${depletedStats.map((stat) => stat.label).join(", ")} reached zero.`;
  } else if (completedTurn > game.maxTurns) {
    const totalResources = nextResources.intel + nextResources.supplies + nextResources.capital;
    if (
      nextStats.stability >= 42 &&
      nextStats.trust >= 38 &&
      nextStats.security >= 35 &&
      totalResources >= 18
    ) {
      phase = "won";
      message = "Victory: mandate secured with institutions intact.";
    } else {
      phase = "lost";
      message = "Defeat: term completed, but your coalition and systems were too fragile.";
    }
  } else if (penaltyState.warnings.length > 0) {
    message = `${scenario.title}: ${option.title}. ${penaltyState.warnings.join("; ")}.`;
  }

  const cooldowns = reduceCooldowns(game.cooldowns);
  const statLine = summarizeDelta(statDelta, STAT_META);
  const resourceLine = summarizeDelta(resourceDelta, RESOURCE_META);
  const detailLine = [statLine, resourceLine].filter(Boolean).join(" | ");

  return {
    game: {
      ...game,
      turn: completedTurn,
      phase,
      message,
      stats: nextStats,
      resources: nextResources,
      actionPoints: game.maxActionPoints,
      cooldowns,
    },
    log: `${scenario.title} -> ${option.title}${detailLine ? ` (${detailLine})` : ""}`,
  };
}

function getActionDisabledReason(game: GameState, action: StrategicAction) {
  if (game.phase !== "playing") {
    return "Run has ended";
  }

  const cooldown = game.cooldowns[action.id] ?? 0;
  if (cooldown > 0) {
    return `Cooldown: ${cooldown} turn${cooldown === 1 ? "" : "s"}`;
  }

  if (game.actionPoints < action.apCost) {
    return `Need ${action.apCost} AP`;
  }

  if (!hasResourceCost(game.resources, action.resourceCost)) {
    return "Insufficient resources";
  }

  return null;
}

function formatCost(cost?: Delta<ResourceKey>) {
  if (!cost) {
    return "No resource cost";
  }
  return Object.entries(cost)
    .map(([key, value]) => {
      const label = RESOURCE_META.find((resource) => resource.key === key)?.label;
      return `${value} ${label}`;
    })
    .join(", ");
}

function findScenarioById(id: string) {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) {
    return false;
  }

  const stats = value.stats;
  const resources = value.resources;
  const cooldowns = value.cooldowns;

  return (
    typeof value.seedText === "string" &&
    typeof value.rngState === "number" &&
    typeof value.turn === "number" &&
    typeof value.maxTurns === "number" &&
    typeof value.phase === "string" &&
    typeof value.message === "string" &&
    typeof value.maxActionPoints === "number" &&
    typeof value.actionPoints === "number" &&
    isRecord(stats) &&
    typeof stats.stability === "number" &&
    typeof stats.treasury === "number" &&
    typeof stats.influence === "number" &&
    typeof stats.security === "number" &&
    typeof stats.trust === "number" &&
    isRecord(resources) &&
    typeof resources.intel === "number" &&
    typeof resources.supplies === "number" &&
    typeof resources.capital === "number" &&
    isRecord(cooldowns)
  );
}

function isSavedRunPayload(value: unknown): value is SavedRunPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isGameState(value.game) &&
    typeof value.scenarioId === "string" &&
    Array.isArray(value.history) &&
    value.history.every((entry) => typeof entry === "string") &&
    typeof value.seedInput === "string"
  );
}

function isDemoSeedArray(value: unknown): value is DemoSeed[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.value === "string"
    );
  });
}

export function MandateZeroMvp() {
  const [game, setGame] = useState<GameState>(() => DEFAULT_RUN.game);
  const [scenario, setScenario] = useState<Scenario>(() => DEFAULT_RUN.scenario);
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
  const [customDemoSeeds, setCustomDemoSeeds] = useState<DemoSeed[]>([]);
  const [newSeedName, setNewSeedName] = useState("");
  const [newSeedValue, setNewSeedValue] = useState("");
  const [seedUiMessage, setSeedUiMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [runStorageReady, setRunStorageReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOM_SEEDS_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!isDemoSeedArray(parsed)) {
        return;
      }

      const normalized = parsed
        .map((seed) => ({
          id: seed.id,
          name: seed.name.trim(),
          value: normalizeSeed(seed.value),
          custom: true,
        }))
        .filter((seed) => seed.name.length > 0);

      setCustomDemoSeeds(normalized);
    } catch {
      // Ignore invalid local storage payloads.
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RUN_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!isSavedRunPayload(parsed)) {
        return;
      }

      const scenarioFromStorage = findScenarioById(parsed.scenarioId);
      if (!scenarioFromStorage) {
        return;
      }

      setGame(parsed.game);
      setScenario(scenarioFromStorage);
      setHistory(parsed.history);
      setSeedInput(parsed.seedInput);
      setSeedUiMessage("Loaded saved local run.");
    } catch {
      // Ignore invalid saved run payloads.
    } finally {
      setRunStorageReady(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      CUSTOM_SEEDS_STORAGE_KEY,
      JSON.stringify(
        customDemoSeeds.map((seed) => ({
          id: seed.id,
          name: seed.name,
          value: seed.value,
        })),
      ),
    );
  }, [customDemoSeeds]);

  useEffect(() => {
    if (!runStorageReady) {
      return;
    }

    const payload: SavedRunPayload = {
      game,
      scenarioId: scenario.id,
      history,
      seedInput,
    };
    window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(payload));
  }, [game, history, runStorageReady, scenario.id, seedInput]);

  const allDemoSeeds = useMemo(
    () => [...BUILT_IN_DEMO_SEEDS, ...customDemoSeeds],
    [customDemoSeeds],
  );

  const startRunWithSeed = (seedValue: string) => {
    const normalizedSeed = normalizeSeed(seedValue);
    setSeedInput(normalizedSeed);
    const next = initializeRun(normalizedSeed);
    setGame(next.game);
    setScenario(next.scenario);
    setHistory([]);
  };

  const addDemoSeed = () => {
    const normalizedValue = normalizeSeed(newSeedValue || seedInput);
    const normalizedName = newSeedName.trim() || normalizedValue;

    const duplicate = allDemoSeeds.some((seed) => {
      return (
        seed.name.toLowerCase() === normalizedName.toLowerCase() ||
        seed.value.toLowerCase() === normalizedValue.toLowerCase()
      );
    });

    if (duplicate) {
      setSeedUiMessage("Seed name or value already exists.");
      return;
    }

    const nextSeed: DemoSeed = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: normalizedName,
      value: normalizedValue,
      custom: true,
    };

    setCustomDemoSeeds((prev) => [nextSeed, ...prev].slice(0, 16));
    setNewSeedName("");
    setNewSeedValue("");
    setSeedUiMessage(`Saved demo seed '${normalizedName}'.`);
  };

  const removeDemoSeed = (seedId: string) => {
    setCustomDemoSeeds((prev) => prev.filter((seed) => seed.id !== seedId));
    setSeedUiMessage("Removed demo seed.");
  };

  const clearLocalData = () => {
    window.localStorage.removeItem(CUSTOM_SEEDS_STORAGE_KEY);
    window.localStorage.removeItem(RUN_STORAGE_KEY);
    setCustomDemoSeeds([]);
    setNewSeedName("");
    setNewSeedValue("");
    startRunWithSeed(DEFAULT_SEED);
    setSeedUiMessage("Cleared all local demo data.");
  };

  const statusVariant = useMemo(() => {
    if (game.phase === "won") {
      return "default" as const;
    }
    if (game.phase === "lost") {
      return "destructive" as const;
    }
    return "secondary" as const;
  }, [game.phase]);

  const triggerStrategicAction = (action: StrategicAction) => {
    const disabledReason = getActionDisabledReason(game, action);
    if (disabledReason) {
      return;
    }

    const costDelta = costToDelta(action.resourceCost);
    const resourceDelta = mergeDelta<ResourceKey>(costDelta, action.resourceEffects);
    const nextResources = applyResourceDelta(game.resources, resourceDelta);
    const nextStats = applyStatDelta(game.stats, action.statEffects);
    const nextCooldowns = { ...game.cooldowns, [action.id]: action.cooldown };

    setGame((prev) => ({
      ...prev,
      resources: nextResources,
      stats: nextStats,
      actionPoints: prev.actionPoints - action.apCost,
      cooldowns: nextCooldowns,
      message: `Strategic action used: ${action.title}`,
    }));

    const statLine = summarizeDelta(action.statEffects, STAT_META);
    const resourceLine = summarizeDelta(resourceDelta, RESOURCE_META);
    const detailLine = [statLine, resourceLine].filter(Boolean).join(" | ");
    const logLine = `Strategic -> ${action.title}${detailLine ? ` (${detailLine})` : ""}`;
    setHistory((prev) => [logLine, ...prev].slice(0, 12));
  };

  const resolveCurrentScenario = (option: ScenarioOption) => {
    if (game.phase !== "playing") {
      return;
    }

    const result = resolveScenarioTurn(game, scenario, option);
    setHistory((prev) => [result.log, ...prev].slice(0, 12));

    if (result.game.phase === "playing") {
      const nextScenario = pickScenario(scenario.id, result.game.rngState);
      setScenario(nextScenario.scenario);
      setGame({
        ...result.game,
        rngState: nextScenario.rngState,
      });
    } else {
      setGame(result.game);
    }
  };

  const restart = () => {
    startRunWithSeed(seedInput);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Mandate Zero MVP</CardTitle>
              <CardDescription>
                Turn {Math.min(game.turn, game.maxTurns)} of {game.maxTurns} | AP {game.actionPoints}/
                {game.maxActionPoints}
              </CardDescription>
              <p className="mt-1 text-xs text-muted-foreground">Seed: {game.seedText}</p>
            </div>
            <Badge variant={statusVariant}>
              {game.phase === "playing" && "In Session"}
              {game.phase === "won" && "Victory"}
              {game.phase === "lost" && "Defeat"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Crisis</p>
            <h3 className="mt-1 text-lg font-semibold">{scenario.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{scenario.description}</p>
          </div>

          <div className="space-y-3">
            {scenario.options.map((option) => {
              const statLine = summarizeDelta(option.statEffects, STAT_META);
              const resourceLine = summarizeDelta(option.resourceEffects ?? {}, RESOURCE_META);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => resolveCurrentScenario(option)}
                  disabled={game.phase !== "playing"}
                  className="w-full rounded-lg border p-4 text-left transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="font-medium">{option.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Resolve turn: {[statLine, resourceLine].filter(Boolean).join(" | ")}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <details className="group rounded-lg border p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Demo Seeds
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {allDemoSeeds.length} saved presets
                  </p>
                </div>
                <span className="text-xs text-muted-foreground group-open:hidden">
                  Expand
                </span>
                <span className="hidden text-xs text-muted-foreground group-open:inline">
                  Collapse
                </span>
              </summary>

              <div className="mt-4 space-y-4">
                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
                  <div>
                    <Label htmlFor="seed-input">Current Seed</Label>
                    <Input
                      id="seed-input"
                      value={seedInput}
                      onChange={(event) => setSeedInput(event.target.value)}
                      placeholder={DEFAULT_SEED}
                    />
                  </div>
                  <Button onClick={restart} variant="outline">
                    Restart Seeded Run
                  </Button>
                  <Button
                    onClick={() => {
                      startRunWithSeed(DEFAULT_SEED);
                      setSeedUiMessage("Reset to default demo seed.");
                    }}
                    variant="secondary"
                  >
                    Reset Default Seed
                  </Button>
                  <Button onClick={clearLocalData} variant="destructive">
                    Clear Local Data
                  </Button>
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div>
                    <Label htmlFor="new-seed-name">New Seed Name</Label>
                    <Input
                      id="new-seed-name"
                      value={newSeedName}
                      onChange={(event) => setNewSeedName(event.target.value)}
                      placeholder="My Demo Path"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-seed-value">New Seed Value</Label>
                    <Input
                      id="new-seed-value"
                      value={newSeedValue}
                      onChange={(event) => setNewSeedValue(event.target.value)}
                      placeholder={seedInput}
                    />
                  </div>
                  <Button onClick={addDemoSeed}>Add Demo Seed</Button>
                </div>

                {seedUiMessage ? (
                  <p className="text-xs text-muted-foreground">{seedUiMessage}</p>
                ) : null}

                <div className="space-y-2">
                  {allDemoSeeds.map((seed) => (
                    <div
                      key={seed.id}
                      className="flex items-center justify-between gap-2 rounded-md border p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{seed.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{seed.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            startRunWithSeed(seed.value);
                            setSeedUiMessage(`Loaded seed '${seed.name}'.`);
                          }}
                        >
                          Load
                        </Button>
                        {seed.custom ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeDemoSeed(seed.id)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
            <p className="text-sm text-muted-foreground">{game.message}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Strategic Actions</CardTitle>
            <CardDescription>Spend AP before resolving the current crisis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STRATEGIC_ACTIONS.map((action) => {
              const disabledReason = getActionDisabledReason(game, action);
              return (
                <div key={action.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{action.title}</p>
                    <Badge variant="outline">AP {action.apCost}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cooldown: {action.cooldown} | Cost: {formatCost(action.resourceCost)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => triggerStrategicAction(action)}
                      disabled={Boolean(disabledReason)}
                    >
                      Use
                    </Button>
                    {disabledReason ? (
                      <span className="text-xs text-muted-foreground">{disabledReason}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>State</CardTitle>
            <CardDescription>
              Stats at zero end the run. Low resources trigger extra penalties.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {STAT_META.map((stat) => {
              const value = game.stats[stat.key];
              return (
                <div key={stat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{stat.label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Resources</p>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_META.map((resource) => (
                  <Badge key={resource.key} variant="outline">
                    {resource.label}: {game.resources[resource.key]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Log</CardTitle>
            <CardDescription>Recent strategic and crisis decisions.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No actions yet. Use a strategic action or resolve a crisis.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {history.map((entry, index) => (
                  <li key={`${entry}-${index}`} className="rounded border p-2">
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
