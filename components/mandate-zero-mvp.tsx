"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILT_IN_DEMO_SEEDS,
  CUSTOM_SEEDS_STORAGE_KEY,
  DEFAULT_SEED,
  DOCTRINES,
  POLICIES,
  REGION_META,
  RUN_STORAGE_KEY,
  STAT_META,
  STRATEGIC_ACTIONS,
} from "@/components/mandate-zero/data";
import { ActorsRegionsCard } from "@/components/mandate-zero/actors-regions-card";
import { DemoSeedsCard } from "@/components/mandate-zero/demo-seeds-card";
import { MainStageCard } from "@/components/mandate-zero/main-stage-card";
import { OnboardingOverlay } from "@/components/mandate-zero/onboarding-overlay";
import { PoliciesCard } from "@/components/mandate-zero/policies-card";
import { RunDebriefCard } from "@/components/mandate-zero/run-debrief-card";
import { SimulationLogCard } from "@/components/mandate-zero/simulation-log-card";
import { StrategicActionsCard } from "@/components/mandate-zero/strategic-actions-card";
import { SystemStateCard } from "@/components/mandate-zero/system-state-card";
import {
  getResourceLabel,
  localizeDemoSeed,
  localizeDoctrine,
  localizePolicy,
  localizeScenario,
  localizeStrategicAction,
  type AppLanguage,
} from "@/components/mandate-zero/i18n";
import {
  applyActorEffects,
  applyEffectsQueueForTurn,
  applyPolicyPassiveEffects,
  applyRegionMemoryForResolution,
  applyResourceEffects,
  applyStatEffects,
  clamp,
  computeBaselineDrift,
  computePressureGain,
  computeSystemCoupling,
  createInitialGame,
  estimateActionOutcome,
  evaluateThresholdTriggers,
  getActionPointCost,
  getDoctrine,
  getIntelProfile,
  getScenario,
  isDemoSeedArray,
  isGameStateLike,
  isRecord,
  mergeActorEffects,
  mergeDelta,
  normalizeSeed,
  pickScenarioWithChains,
  queueDelayedEffects,
  randomChance,
  randomInt,
  reduceCooldowns,
  sampleActionOutcome,
  simulateRegions,
  snapshotCoreSystems,
  summarizeDelta,
} from "@/components/mandate-zero/engine";
import type {
  ActorKey,
  ActorEffects,
  CausalityEntry,
  CoreSystemKey,
  Delta,
  DemoSeed,
  DoctrineId,
  GameState,
  Phase,
  PolicyCommitment,
  QueuedEffect,
  RegionKey,
  ResourceKey,
  SavedRunPayload,
  ScenarioOption,
  StatKey,
  StrategicAction,
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

function hydrateLoadedGame(rawGame: GameState): GameState {
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

interface MandateZeroMvpProps {
  language: AppLanguage;
}

export function MandateZeroMvp({ language }: MandateZeroMvpProps) {
  const [game, setGame] = useState<GameState>(() => createInitialGame(DEFAULT_SEED));
  const [history, setHistory] = useState<string[]>([]);
  const [causalityHistory, setCausalityHistory] = useState<CausalityEntry[]>([]);
  const [selectedCausalityId, setSelectedCausalityId] = useState<string | null>(null);
  const [highlightedSystems, setHighlightedSystems] = useState<CoreSystemKey[]>([]);
  const [highlightedActors, setHighlightedActors] = useState<ActorKey[]>([]);
  const [highlightedRegions, setHighlightedRegions] = useState<RegionKey[]>([]);
  const [showDebugNumbers, setShowDebugNumbers] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
  const [customSeeds, setCustomSeeds] = useState<DemoSeed[]>([]);
  const [newSeedName, setNewSeedName] = useState("");
  const [newSeedValue, setNewSeedValue] = useState("");
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const highlightClearTimeoutRef = useRef<number | null>(null);

  const withSystemHistory = (
    previous: GameState,
    stats: Record<StatKey, number>,
    pressure: number,
  ) => {
    const previousSnapshot =
      previous.systemHistory[previous.systemHistory.length - 1] ??
      snapshotCoreSystems(previous.stats, previous.pressure);
    const nextSnapshot = snapshotCoreSystems(stats, pressure);
    return {
      lastTurnSystems: previousSnapshot,
      systemHistory: [...previous.systemHistory, nextSnapshot].slice(-8),
    };
  };

  const statKeysFromDelta = (delta: Delta<StatKey>) =>
    (Object.entries(delta) as Array<[StatKey, number]>)
      .filter(([, value]) => value !== 0)
      .map(([key]) => key);

  const actorKeysFromDeltas = (loyaltyDelta: Delta<ActorKey>, pressureDelta: Delta<ActorKey>) => {
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
  };

  const flashConsequenceHighlights = (
    systems: CoreSystemKey[],
    regions: RegionKey[],
    actors: ActorKey[],
  ) => {
    setHighlightedSystems(systems);
    setHighlightedRegions(regions);
    setHighlightedActors(actors);

    if (highlightClearTimeoutRef.current !== null) {
      window.clearTimeout(highlightClearTimeoutRef.current);
    }
    highlightClearTimeoutRef.current = window.setTimeout(() => {
      setHighlightedSystems([]);
      setHighlightedRegions([]);
      setHighlightedActors([]);
      highlightClearTimeoutRef.current = null;
    }, 900) as unknown as number;
  };

  const appendCausalityEntry = (
    entryInput: Omit<CausalityEntry, "id">,
  ) => {
    const entry: CausalityEntry = {
      id: `${entryInput.turn}-${entryInput.phase}-${entryInput.actionId}-${Date.now()}`,
      ...entryInput,
    };
    setCausalityHistory((prev) => [entry, ...prev].slice(0, 18));
  };

  useEffect(() => {
    return () => {
      if (highlightClearTimeoutRef.current !== null) {
        window.clearTimeout(highlightClearTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      const seedsRaw = window.localStorage.getItem(CUSTOM_SEEDS_STORAGE_KEY);
      if (seedsRaw) {
        const parsedSeeds: unknown = JSON.parse(seedsRaw);
        if (isDemoSeedArray(parsedSeeds)) {
          setCustomSeeds(parsedSeeds.map((seed) => ({ ...seed, custom: true })));
        }
      }

      const runRaw = window.localStorage.getItem(RUN_STORAGE_KEY);
      if (runRaw) {
        const parsedRun: unknown = JSON.parse(runRaw);
        if (isRecord(parsedRun) && isGameStateLike(parsedRun.game)) {
          setGame(hydrateLoadedGame(parsedRun.game));
          const parsedHistory =
            Array.isArray(parsedRun.history)
              ? parsedRun.history.filter((entry): entry is string => typeof entry === "string")
              : [];
          setHistory(parsedHistory);

          if (isCausalityEntryArray(parsedRun.causalityHistory)) {
            setCausalityHistory(parsedRun.causalityHistory);
          } else {
            const fallbackEntries: CausalityEntry[] = parsedHistory.map((entry, index) => ({
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
            setCausalityHistory(fallbackEntries);
          }
          if (typeof parsedRun.seedInput === "string") {
            setSeedInput(parsedRun.seedInput);
          }
        }
      }
    } catch {
      // Ignore malformed local storage payloads.
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const payload: SavedRunPayload = { game, history, causalityHistory, seedInput };
    window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(payload));
  }, [game, history, causalityHistory, seedInput, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    window.localStorage.setItem(
      CUSTOM_SEEDS_STORAGE_KEY,
      JSON.stringify(customSeeds.map((seed) => ({ ...seed, custom: undefined }))),
    );
  }, [customSeeds, storageReady]);

  const scenario = useMemo(() => getScenario(game.scenarioId), [game.scenarioId]);
  const localizedScenario = useMemo(() => localizeScenario(scenario, language), [language, scenario]);
  const intelProfile = useMemo(
    () => getIntelProfile(game.resources.intel, game.doctrine),
    [game.doctrine, game.resources.intel],
  );
  const localizedDoctrines = useMemo(
    () => DOCTRINES.map((doctrine) => localizeDoctrine(doctrine, language)),
    [language],
  );
  const localizedPolicies = useMemo(
    () => POLICIES.map((policy) => localizePolicy(policy, language)),
    [language],
  );
  const localizedStrategicActions = useMemo(
    () => STRATEGIC_ACTIONS.map((action) => localizeStrategicAction(action, language)),
    [language],
  );
  const doctrineTitleById = useMemo(
    () =>
      Object.fromEntries(
        localizedDoctrines.map((doctrine) => [doctrine.id, doctrine.title]),
      ) as Record<DoctrineId, string>,
    [localizedDoctrines],
  );
  const policyTitleById = useMemo(
    () => Object.fromEntries(localizedPolicies.map((policy) => [policy.id, policy.title])),
    [localizedPolicies],
  );
  const actionTitleById = useMemo(
    () => Object.fromEntries(localizedStrategicActions.map((action) => [action.id, action.title])),
    [localizedStrategicActions],
  );
  const allSeeds = useMemo(() => [...BUILT_IN_DEMO_SEEDS, ...customSeeds], [customSeeds]);
  const displaySeeds = useMemo(
    () => allSeeds.map((seed) => (seed.custom ? seed : localizeDemoSeed(seed, language))),
    [allSeeds, language],
  );
  const optionOutcomeEstimates = useMemo(() => {
    const outcomeState = {
      seedText: game.seedText,
      turn: game.turn,
      scenarioId: game.scenarioId,
      resources: game.resources,
      doctrine: game.doctrine,
      pressure: game.pressure,
    };
    const entries = scenario.options.map((option) => [
      option.id,
      estimateActionOutcome(outcomeState, option, scenario.id),
    ]);
    return Object.fromEntries(entries);
  }, [
    game.doctrine,
    game.pressure,
    game.resources,
    game.scenarioId,
    game.seedText,
    game.turn,
    scenario.id,
    scenario.options,
  ]);
  const upcomingEffects = useMemo(
    () =>
      game.effectsQueue
        .filter((effect) => effect.turnToApply <= game.turn + 2)
        .sort((left, right) => left.turnToApply - right.turnToApply),
    [game.effectsQueue, game.turn],
  );

  const hotRegions = REGION_META.filter((region) => game.regions[region.key] >= 70).length;
  const criticalRegions = REGION_META.filter((region) => game.regions[region.key] >= 85).length;
  const escalationClock = Math.max(1, 4 - Math.floor((hotRegions + criticalRegions) / 2));

  const canPlay = game.phase === "playing" && Boolean(game.doctrine);
  const showOnboarding =
    !onboardingDismissed &&
    game.phase === "playing" &&
    game.turn === 1 &&
    !game.doctrine &&
    history.length === 0;

  const startRunWithSeed = (seedValue: string) => {
    const normalizedSeed = normalizeSeed(seedValue);
    setSeedInput(normalizedSeed);
    const nextGame = createInitialGame(normalizedSeed);
    setGame({
      ...nextGame,
      message:
        language === "bg"
          ? "Избери доктрина, изразходвай AP и реши кризата. Отложени последствия и прагови шокове са активни."
          : nextGame.message,
    });
    setHistory([]);
    setCausalityHistory([]);
    setSelectedCausalityId(null);
    setHighlightedSystems([]);
    setHighlightedActors([]);
    setHighlightedRegions([]);
    setOnboardingDismissed(false);
    setSeedMessage(
      language === "bg" ? `Зареден сийд '${normalizedSeed}'.` : `Loaded seed '${normalizedSeed}'.`,
    );
  };

  const chooseDoctrine = (doctrineId: DoctrineId) => {
    if (game.doctrine || game.phase !== "playing") {
      return;
    }
    const selected = getDoctrine(doctrineId);
    if (!selected) {
      return;
    }

    const stats = applyStatEffects(game.stats, selected.startEffects.statEffects ?? {});
    const resources = applyResourceEffects(game.resources, selected.startEffects.resourceEffects ?? {});
    const actorApplication = applyActorEffects(game.actors, selected.startEffects.actorEffects ?? {});
    const doctrineTitle = doctrineTitleById[doctrineId] ?? selected.title;

    setGame((prev) => ({
      ...prev,
      doctrine: doctrineId,
      turnStage: "decision",
      stats,
      resources,
      actors: actorApplication.actors,
      ...withSystemHistory(prev, stats, prev.pressure),
      message:
        language === "bg"
          ? `Избрана доктрина: ${doctrineTitle}. Стратегическите компромиси вече са заключени.`
          : `${doctrineTitle} doctrine selected. Strategic tradeoffs are now locked in.`,
      lastStatDelta: selected.startEffects.statEffects ?? {},
      lastResourceDelta: selected.startEffects.resourceEffects ?? {},
      lastActorLoyaltyDelta: actorApplication.loyaltyDelta,
      lastActorPressureDelta: actorApplication.pressureDelta,
    }));
    setHistory((prev) =>
      [
        language === "bg"
          ? `Избрана доктрина -> ${doctrineTitle}`
          : `Doctrine selected -> ${doctrineTitle}`,
        ...prev,
      ].slice(0, 18),
    );
    appendCausalityEntry({
      turn: game.turn,
      phase: "decision",
      actionId: selected.id,
      actionLabel: `${language === "bg" ? "Доктрина" : "Doctrine"}: ${doctrineTitle}`,
      crisisId: game.scenarioId,
      crisisLabel: localizedScenario.title,
      immediateDeltas: selected.startEffects.statEffects ?? {},
      delayedEnqueued: [],
      thresholdsTriggered: [],
      regionImpacts: [],
    });
  };

  const enactPolicy = (policy: PolicyCommitment) => {
    if (!canPlay || game.activePolicies.includes(policy.id)) {
      return;
    }
    if (game.actionPoints < policy.apCost) {
      return;
    }
    if (game.resources.capital < policy.capitalCost) {
      return;
    }

    const capitalCostDelta: Delta<ResourceKey> = { capital: -policy.capitalCost };
    const resourceDelta = mergeDelta(capitalCostDelta, policy.immediate.resourceEffects);
    const resources = applyResourceEffects(game.resources, resourceDelta);
    const stats = applyStatEffects(game.stats, policy.immediate.statEffects ?? {});
    const actorApplication = applyActorEffects(game.actors, policy.immediate.actorEffects ?? {});
    const maxActionPoints = clamp(game.maxActionPoints + (policy.maxActionPointBonus ?? 0), 1, 4);
    const actionPoints = Math.max(0, game.actionPoints - policy.apCost);
    const policyTitle = policyTitleById[policy.id] ?? policy.title;

    setGame((prev) => ({
      ...prev,
      turnStage: "decision",
      stats,
      resources,
      actors: actorApplication.actors,
      ...withSystemHistory(prev, stats, prev.pressure),
      activePolicies: [...prev.activePolicies, policy.id],
      maxActionPoints,
      actionPoints,
      coupRisk: clamp(prev.coupRisk + (policy.immediate.coupRisk ?? 0)),
      message:
        language === "bg"
          ? `Политика приета: ${policyTitle}. Ангажиментът е необратим.`
          : `Policy enacted: ${policyTitle}. Commitment is irreversible.`,
      lastStatDelta: policy.immediate.statEffects ?? {},
      lastResourceDelta: resourceDelta,
      lastActorLoyaltyDelta: actorApplication.loyaltyDelta,
      lastActorPressureDelta: actorApplication.pressureDelta,
    }));

    setHistory((prev) =>
      [
        language === "bg" ? `Приета политика -> ${policyTitle}` : `Policy enacted -> ${policyTitle}`,
        ...prev,
      ].slice(0, 18),
    );
    appendCausalityEntry({
      turn: game.turn,
      phase: "decision",
      actionId: policy.id,
      actionLabel: `${language === "bg" ? "Политика" : "Policy"}: ${policyTitle}`,
      crisisId: game.scenarioId,
      crisisLabel: localizedScenario.title,
      immediateDeltas: policy.immediate.statEffects ?? {},
      delayedEnqueued: [],
      thresholdsTriggered: [],
      regionImpacts: [],
    });
  };

  const getAdjustedActionCost = (action: StrategicAction) =>
    getActionPointCost(action.apCost, action.id, game.doctrine);

  const getActionDisabledReason = (action: StrategicAction) => {
    if (!canPlay) {
      return language === "bg" ? "Първо избери доктрина" : "Choose doctrine first";
    }
    const cooldown = game.cooldowns[action.id] ?? 0;
    if (cooldown > 0) {
      return language === "bg" ? `Възстановяване ${cooldown}` : `Cooldown ${cooldown}`;
    }
    const actionCost = getAdjustedActionCost(action);
    if (game.actionPoints < actionCost) {
      return language === "bg" ? `Нужни са ${actionCost} AP` : `Need ${actionCost} AP`;
    }
    if (action.resourceCost) {
      for (const [key, cost] of Object.entries(action.resourceCost) as Array<[ResourceKey, number]>) {
        if (game.resources[key] < cost) {
          return language === "bg"
            ? `Нужни са ${cost} ${getResourceLabel(key, language)}`
            : `Need ${cost} ${key}`;
        }
      }
    }
    return null;
  };

  const triggerStrategicAction = (action: StrategicAction) => {
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
            ? `${actionTitle}: изпълнено. Рискът от преразтягане е активен за този ход.`
            : `${actionTitle} executed. Overextension risk armed for this turn.`
          : language === "bg"
            ? `${actionTitle}: изпълнено.`
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
          ? `Стратегическо действие -> ${actionTitle}${statSummary ? ` (${statSummary})` : ""}${queueSummary}`
          : `Strategic action -> ${actionTitle}${statSummary ? ` (${statSummary})` : ""}${queueSummary}`;
      return [line, ...prev].slice(0, 18);
    });
    appendCausalityEntry({
      turn: game.turn,
      phase: "decision",
      actionId: action.id,
      actionLabel: `${language === "bg" ? "Действие" : "Action"}: ${actionTitle}`,
      crisisId: game.scenarioId,
      crisisLabel: localizedScenario.title,
      immediateDeltas: rolledStats.effects,
      delayedEnqueued:
        queuedEffects.length > 0
          ? queuedEffects.map((effect) => `${effect.source} (T${effect.turnToApply})`)
          : [],
      thresholdsTriggered: [],
      regionImpacts: [],
    });
  };

  const resolveCrisisOption = (option: ScenarioOption) => {
    if (!canPlay) {
      return;
    }

    let rngState = game.rngState;
    const queuedResolution = applyEffectsQueueForTurn(
      game.effectsQueue,
      game.turn,
      rngState,
      intelProfile.confidence,
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
    const pressure = clamp(game.pressure + pressureGain);

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
        ? `${localizedScenario.title}: ${option.title}. ${regionSimulation.summary}. Натиск +${pressureGain}.`
        : `${localizedScenario.title}: ${option.title}. ${regionSimulation.summary}. Pressure +${pressureGain}.`;

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
            ? "Активиран е авариен режим. Институциите устояха засега, но още един срив ще прекрати симулацията."
            : "Emergency mode triggered. Institutions held for now, but one more collapse ends the run.";
      } else {
        phase = "lost";
        message =
          language === "bg"
            ? `Колапс на режима: ${collapsedStats
                .map((entry) => {
                  const bgStatLabels: Record<StatKey, string> = {
                    stability: "Стабилност",
                    treasury: "Хазна",
                    influence: "Влияние",
                    security: "Сигурност",
                    trust: "Обществено доверие",
                  };
                  return bgStatLabels[entry.key];
                })
                .join(", ")} отново се сринаха.`
            : `Regime collapse: ${collapsedStats.map((entry) => entry.label).join(", ")} failed again.`;
      }
    }

    if (phase === "playing" && coupRisk >= 100) {
      phase = "lost";
      message =
        language === "bg"
          ? "Рискът от преврат достигна критичен праг. Командната власт се срина."
          : "Coup risk reached critical threshold. Command authority collapsed.";
    }
    if (phase === "playing" && pressure >= 100) {
      phase = "lost";
      message =
        language === "bg"
          ? "Натискът достигна системно претоварване. Каскадни кризи прекратиха мандата."
          : "Pressure reached systemic overload. Cascading crises ended the mandate.";
    }

    const nextTurn = game.turn + 1;
    let scenarioId = game.scenarioId;
    let chainRuleId: string | null = null;
    if (phase === "playing") {
      if (nextTurn > game.maxTurns) {
        const averageStress =
          Object.values(regions).reduce((sum, value) => sum + value, 0) / REGION_META.length;
        if (
          stats.stability >= 40 &&
          stats.trust >= 35 &&
          coupRisk < 70 &&
          averageStress < 70 &&
          pressure < 85
        ) {
          phase = "won";
          message =
            language === "bg"
              ? "Мандатът оцеля. Овладяхте кризите без пълен срив."
              : "Mandate survived. You contained crises without full breakdown.";
        } else {
          phase = "lost";
          message =
            language === "bg"
              ? "Мандатът завърши в системна крехкост. Ранните компромиси окончателно пречупиха държавата."
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
          ? `${message} Задействана е последваща верига (${chainRuleId}).`
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
    const affectedSystems: CoreSystemKey[] = [
      ...statKeysFromDelta(statDelta),
      ...(pressure !== game.pressure ? (["pressure"] as const) : []),
    ];
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
    const logLine = `${localizedScenario.title} -> ${option.title}${optionSummary ? ` (${optionSummary})` : ""}${queueLine}${chainLine}`;
    setHistory((prev) => [logLine, ...prev].slice(0, 18));

    appendCausalityEntry({
      turn: game.turn,
      phase: "resolution",
      actionId: option.id,
      actionLabel: option.title,
      crisisId: scenario.id,
      crisisLabel: localizedScenario.title,
      immediateDeltas: rolledOptionStats.effects,
      delayedEnqueued:
        queuedDelayed.queued.length > 0
          ? queuedDelayed.queued.map((entry) => `${entry.source} (T${entry.turnToApply})`)
          : [],
      thresholdsTriggered: thresholdTriggers.logs,
      regionImpacts: regionSimulation.impactedRegions,
    });
  };

  const addCustomSeed = () => {
    const seedValue = normalizeSeed(newSeedValue || seedInput);
    const seedName = (newSeedName.trim() || seedValue).slice(0, 40);
    const exists = allSeeds.some(
      (seed) =>
        seed.name.toLowerCase() === seedName.toLowerCase() ||
        seed.value.toLowerCase() === seedValue.toLowerCase(),
    );
    if (exists) {
      setSeedMessage(language === "bg" ? "Сийдът вече съществува." : "Seed already exists.");
      return;
    }
    const nextSeed: DemoSeed = {
      id: `custom-${Date.now()}`,
      name: seedName,
      value: seedValue,
      custom: true,
    };
    setCustomSeeds((prev) => [nextSeed, ...prev].slice(0, 16));
    setNewSeedName("");
    setNewSeedValue("");
    setSeedMessage(language === "bg" ? `Запазен '${seedName}'.` : `Saved '${seedName}'.`);
  };

  const removeCustomSeed = (seedId: string) => {
    setCustomSeeds((prev) => prev.filter((seed) => seed.id !== seedId));
    setSeedMessage(language === "bg" ? "Премахнат персонален сийд." : "Custom seed removed.");
  };

  const clearLocalData = () => {
    window.localStorage.removeItem(RUN_STORAGE_KEY);
    window.localStorage.removeItem(CUSTOM_SEEDS_STORAGE_KEY);
    setCustomSeeds([]);
    startRunWithSeed(DEFAULT_SEED);
    setSeedMessage(
      language === "bg"
        ? "Изчистени са локалната симулация и персоналните сийдове."
        : "Cleared local run and custom seeds.",
    );
  };

  const warnings = [
    game.stats.stability < 30
      ? language === "bg"
        ? "Критична институционална стабилност"
        : "Institutional stability critical"
      : null,
    game.stats.trust < 30
      ? language === "bg"
        ? "Риск от срив на общественото доверие"
        : "Public trust collapse risk"
      : null,
    game.resources.intel < 4
      ? language === "bg"
        ? "Ниско разузнаване: прогнозите са шумни"
        : "Intel is low: forecasts are noisy"
      : null,
    game.coupRisk >= 70
      ? language === "bg"
        ? "Рискът от преврат ескалира бързо"
        : "Coup risk is escalating rapidly"
      : null,
    game.pressure >= 70
      ? language === "bg"
        ? "Кривата на натиск е в червената зона"
        : "Pressure curve is in red zone"
      : null,
  ].filter((warning): warning is string => Boolean(warning));

  const selectCausalityEntry = (entry: CausalityEntry) => {
    setSelectedCausalityId(entry.id);
    setHighlightedRegions(entry.regionImpacts);
    setHighlightedSystems(statKeysFromDelta(entry.immediateDeltas));
  };

  return (
    <div className="relative">
      {showOnboarding ? (
        <OnboardingOverlay language={language} onDismiss={() => setOnboardingDismissed(true)} />
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.5fr_1fr]">
        <div className="order-2 space-y-6 lg:order-1">
        <PoliciesCard
          game={game}
          canPlay={canPlay}
          language={language}
          policies={localizedPolicies}
          onEnactPolicy={enactPolicy}
        />
        <StrategicActionsCard
          language={language}
          actions={localizedStrategicActions}
          getActionDisabledReason={getActionDisabledReason}
          getActionPointCost={getAdjustedActionCost}
          getActionOutcomeEstimate={(action) => estimateActionOutcome(game, action, game.scenarioId)}
          upcomingEffects={upcomingEffects}
          onTriggerStrategicAction={triggerStrategicAction}
        />
        <SimulationLogCard
          entries={causalityHistory}
          selectedEntryId={selectedCausalityId}
          language={language}
          onSelectEntry={selectCausalityEntry}
        />
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          {game.phase !== "playing" ? (
            <RunDebriefCard
              game={game}
              entries={causalityHistory}
              language={language}
              onRestart={() => startRunWithSeed(game.seedText)}
            />
          ) : null}
          <MainStageCard
            game={game}
            scenario={localizedScenario}
            intelProfile={intelProfile}
            escalationClock={escalationClock}
            hotRegions={hotRegions}
            criticalRegions={criticalRegions}
            upcomingEffects={upcomingEffects}
            optionOutcomeEstimates={optionOutcomeEstimates}
            canPlay={canPlay}
            showDebugNumbers={showDebugNumbers}
            language={language}
            doctrines={localizedDoctrines}
            onChooseDoctrine={chooseDoctrine}
            onResolveCrisisOption={resolveCrisisOption}
          />
        </div>

        <div className="order-3 space-y-6">
          <DemoSeedsCard
            language={language}
            seedInput={seedInput}
            onSeedInputChange={setSeedInput}
            onStartRunWithSeed={startRunWithSeed}
            onClearLocalData={clearLocalData}
            newSeedName={newSeedName}
            onNewSeedNameChange={setNewSeedName}
            newSeedValue={newSeedValue}
            onNewSeedValueChange={setNewSeedValue}
            onAddCustomSeed={addCustomSeed}
            seedMessage={seedMessage}
            allSeeds={displaySeeds}
            onRemoveCustomSeed={removeCustomSeed}
          />
          <SystemStateCard
            game={game}
            warnings={warnings}
            highlightedSystems={highlightedSystems}
            showDebugNumbers={showDebugNumbers}
            language={language}
            onToggleDebugNumbers={() => setShowDebugNumbers((prev) => !prev)}
          />
          <ActorsRegionsCard
            game={game}
            language={language}
            highlightedRegions={highlightedRegions}
            highlightedActors={highlightedActors}
          />
        </div>
      </div>
    </div>
  );
}
