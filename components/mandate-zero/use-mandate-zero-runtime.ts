"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILT_IN_DEMO_SEEDS,
  CUSTOM_SEEDS_STORAGE_KEY,
  DEFAULT_SEED,
  DOCTRINES,
  POLICIES,
  RUN_STORAGE_KEY,
  STRATEGIC_ACTIONS,
} from "@/components/mandate-zero/data";
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
  applyResourceEffects,
  applyStatEffects,
  clamp,
  createInitialGame,
  estimateActionOutcome,
  getActionPointCost,
  getIntelProfile,
  getScenario,
  isDemoSeedArray,
  isGameStateLike,
  isRecord,
  mergeDelta,
  normalizeSeed,
} from "@/components/mandate-zero/engine";
import {
  getEscalationState,
  statKeysFromDelta,
  withSystemHistory,
} from "@/components/mandate-zero/runtime/helpers";
import { triggerCrisisResolutionAction } from "@/components/mandate-zero/runtime/actions/crisis-resolution";
import { triggerDoctrineAction } from "@/components/mandate-zero/runtime/actions/doctrine";
import { triggerStrategicAction as executeStrategicAction } from "@/components/mandate-zero/runtime/actions/strategic-action";
import {
  hydrateLoadedGame,
  parseCausalityHistory,
} from "@/components/mandate-zero/runtime/storage";
import type {
  ActorKey,
  CausalityEntry,
  CoreSystemKey,
  Delta,
  DemoSeed,
  DoctrineId,
  GameState,
  PolicyCommitment,
  RegionKey,
  ResourceKey,
  SavedRunPayload,
  ScenarioOption,
  StrategicAction,
} from "@/components/mandate-zero/types";

export function useMandateZeroRuntime(language: AppLanguage) {
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

          setCausalityHistory(parseCausalityHistory(parsedRun.causalityHistory, parsedHistory));
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

  const { hotRegions, criticalRegions, escalationClock } = getEscalationState(game.regions);

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
    triggerDoctrineAction({
      doctrineId,
      game,
      language,
      localizedScenarioTitle: localizedScenario.title,
      doctrineTitleById,
      setGame,
      setHistory,
      appendCausalityEntry,
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
    executeStrategicAction({
      action,
      game,
      language,
      actionTitleById: actionTitleById as Record<StrategicAction["id"], string>,
      localizedScenarioTitle: localizedScenario.title,
      getActionDisabledReason,
      getAdjustedActionCost,
      setGame,
      setHistory,
      appendCausalityEntry,
      flashConsequenceHighlights,
    });
  };

  const resolveCrisisOption = (option: ScenarioOption) => {
    triggerCrisisResolutionAction({
      option,
      canPlay,
      game,
      scenario,
      localizedScenarioTitle: localizedScenario.title,
      intelConfidence: intelProfile.confidence,
      language,
      setGame,
      setHistory,
      appendCausalityEntry,
      flashConsequenceHighlights,
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
        ? "ÐšÑ€Ð¸Ñ‚Ð¸Ñ‡Ð½Ð° Ð¸Ð½ÑÑ‚Ð¸Ñ‚ÑƒÑ†Ð¸Ð¾Ð½Ð°Ð»Ð½Ð° ÑÑ‚Ð°Ð±Ð¸Ð»Ð½Ð¾ÑÑ‚"
        : "Institutional stability critical"
      : null,
    game.stats.trust < 30
      ? language === "bg"
        ? "Ð Ð¸ÑÐº Ð¾Ñ‚ ÑÑ€Ð¸Ð² Ð½Ð° Ð¾Ð±Ñ‰ÐµÑÑ‚Ð²ÐµÐ½Ð¾Ñ‚Ð¾ Ð´Ð¾Ð²ÐµÑ€Ð¸Ðµ"
        : "Public trust collapse risk"
      : null,
    game.resources.intel < 4
      ? language === "bg"
        ? "ÐÐ¸ÑÐºÐ¾ Ñ€Ð°Ð·ÑƒÐ·Ð½Ð°Ð²Ð°Ð½Ðµ: Ð¿Ñ€Ð¾Ð³Ð½Ð¾Ð·Ð¸Ñ‚Ðµ ÑÐ° ÑˆÑƒÐ¼Ð½Ð¸"
        : "Intel is low: forecasts are noisy"
      : null,
    game.coupRisk >= 70
      ? language === "bg"
        ? "Ð Ð¸ÑÐºÑŠÑ‚ Ð¾Ñ‚ Ð¿Ñ€ÐµÐ²Ñ€Ð°Ñ‚ ÐµÑÐºÐ°Ð»Ð¸Ñ€Ð° Ð±ÑŠÑ€Ð·Ð¾"
        : "Coup risk is escalating rapidly"
      : null,
    game.pressure >= 70
      ? language === "bg"
        ? "ÐšÑ€Ð¸Ð²Ð°Ñ‚Ð° Ð½Ð° Ð½Ð°Ñ‚Ð¸ÑÐº Ðµ Ð² Ñ‡ÐµÑ€Ð²ÐµÐ½Ð°Ñ‚Ð° Ð·Ð¾Ð½Ð°"
        : "Pressure curve is in red zone"
      : null,
  ].filter((warning): warning is string => Boolean(warning));

  const selectCausalityEntry = (entry: CausalityEntry) => {
    setSelectedCausalityId(entry.id);
    setHighlightedRegions(entry.regionImpacts);
    setHighlightedSystems(statKeysFromDelta(entry.immediateDeltas));
  };

  return {
    game,
    canPlay,
    showOnboarding,
    dismissOnboarding: () => setOnboardingDismissed(true),
    localizedScenario,
    intelProfile,
    escalationClock,
    hotRegions,
    criticalRegions,
    upcomingEffects,
    optionOutcomeEstimates,
    localizedDoctrines,
    localizedPolicies,
    localizedStrategicActions,
    displaySeeds,
    warnings,
    showDebugNumbers,
    toggleDebugNumbers: () => setShowDebugNumbers((prev) => !prev),
    causalityHistory,
    selectedCausalityId,
    highlightedSystems,
    highlightedActors,
    highlightedRegions,
    seedInput,
    setSeedInput,
    newSeedName,
    setNewSeedName,
    newSeedValue,
    setNewSeedValue,
    seedMessage,
    startRunWithSeed,
    chooseDoctrine,
    enactPolicy,
    getAdjustedActionCost,
    getActionDisabledReason,
    getActionOutcomeEstimate: (action: StrategicAction) =>
      estimateActionOutcome(game, action, game.scenarioId),
    triggerStrategicAction,
    resolveCrisisOption,
    addCustomSeed,
    removeCustomSeed,
    clearLocalData,
    selectCausalityEntry,
  };
}
