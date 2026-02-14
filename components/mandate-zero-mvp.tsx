"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUILT_IN_DEMO_SEEDS,
  CUSTOM_SEEDS_STORAGE_KEY,
  DEFAULT_SEED,
  REGION_META,
  RUN_STORAGE_KEY,
  STAT_META,
} from "@/components/mandate-zero/data";
import {
  ActorsRegionsCard,
} from "@/components/mandate-zero/actors-regions-card";
import { MainStageCard } from "@/components/mandate-zero/main-stage-card";
import { PoliciesCard } from "@/components/mandate-zero/policies-card";
import { SimulationLogCard } from "@/components/mandate-zero/simulation-log-card";
import { StrategicActionsCard } from "@/components/mandate-zero/strategic-actions-card";
import { SystemStateCard } from "@/components/mandate-zero/system-state-card";
import {
  applyActorEffects,
  applyPolicyPassiveEffects,
  applyResourceEffects,
  applyStatEffects,
  clamp,
  computeSystemCoupling,
  createInitialGame,
  getDoctrine,
  getIntelProfile,
  getScenario,
  isDemoSeedArray,
  isGameStateLike,
  isRecord,
  mergeActorEffects,
  mergeDelta,
  normalizeSeed,
  pickScenario,
  queueDelayedEffects,
  reduceCooldowns,
  resolvePendingEffects,
  rollUncertainStatEffects,
  simulateRegions,
  summarizeDelta,
} from "@/components/mandate-zero/engine";
import type {
  ActorEffects,
  Delta,
  DemoSeed,
  DoctrineId,
  GameState,
  Phase,
  PolicyCommitment,
  ResourceKey,
  SavedRunPayload,
  ScenarioOption,
  StatKey,
  StrategicAction,
} from "@/components/mandate-zero/types";

export function MandateZeroMvp() {
  const [game, setGame] = useState<GameState>(() => createInitialGame(DEFAULT_SEED));
  const [history, setHistory] = useState<string[]>([]);
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
  const [customSeeds, setCustomSeeds] = useState<DemoSeed[]>([]);
  const [newSeedName, setNewSeedName] = useState("");
  const [newSeedValue, setNewSeedValue] = useState("");
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

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
          setGame(parsedRun.game);
          setHistory(
            Array.isArray(parsedRun.history)
              ? parsedRun.history.filter((entry): entry is string => typeof entry === "string")
              : [],
          );
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

    const payload: SavedRunPayload = { game, history, seedInput };
    window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(payload));
  }, [game, history, seedInput, storageReady]);

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
  const intelProfile = useMemo(
    () => getIntelProfile(game.resources.intel, game.doctrine),
    [game.doctrine, game.resources.intel],
  );
  const allSeeds = useMemo(() => [...BUILT_IN_DEMO_SEEDS, ...customSeeds], [customSeeds]);

  const hotRegions = REGION_META.filter((region) => game.regions[region.key] >= 70).length;
  const criticalRegions = REGION_META.filter((region) => game.regions[region.key] >= 85).length;
  const escalationClock = Math.max(1, 4 - Math.floor((hotRegions + criticalRegions) / 2));

  const canPlay = game.phase === "playing" && Boolean(game.doctrine);

  const startRunWithSeed = (seedValue: string) => {
    const normalizedSeed = normalizeSeed(seedValue);
    setSeedInput(normalizedSeed);
    setGame(createInitialGame(normalizedSeed));
    setHistory([]);
    setSeedMessage(`Loaded seed '${normalizedSeed}'.`);
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
    const resources = applyResourceEffects(
      game.resources,
      selected.startEffects.resourceEffects ?? {},
    );
    const actorApplication = applyActorEffects(game.actors, selected.startEffects.actorEffects ?? {});

    setGame((prev) => ({
      ...prev,
      doctrine: doctrineId,
      stats,
      resources,
      actors: actorApplication.actors,
      message: `${selected.title} doctrine selected. Strategic tradeoffs are now locked in.`,
      lastStatDelta: selected.startEffects.statEffects ?? {},
      lastResourceDelta: selected.startEffects.resourceEffects ?? {},
      lastActorLoyaltyDelta: actorApplication.loyaltyDelta,
      lastActorPressureDelta: actorApplication.pressureDelta,
    }));
    setHistory((prev) => [`Doctrine selected -> ${selected.title}`, ...prev].slice(0, 18));
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

    setGame((prev) => ({
      ...prev,
      stats,
      resources,
      actors: actorApplication.actors,
      activePolicies: [...prev.activePolicies, policy.id],
      maxActionPoints,
      actionPoints,
      coupRisk: clamp(prev.coupRisk + (policy.immediate.coupRisk ?? 0)),
      message: `Policy enacted: ${policy.title}. Commitment is irreversible.`,
      lastStatDelta: policy.immediate.statEffects ?? {},
      lastResourceDelta: resourceDelta,
      lastActorLoyaltyDelta: actorApplication.loyaltyDelta,
      lastActorPressureDelta: actorApplication.pressureDelta,
    }));

    setHistory((prev) => [`Policy enacted -> ${policy.title}`, ...prev].slice(0, 18));
  };

  const getActionDisabledReason = (action: StrategicAction) => {
    if (!canPlay) {
      return "Choose doctrine first";
    }
    const cooldown = game.cooldowns[action.id] ?? 0;
    if (cooldown > 0) {
      return `Cooldown ${cooldown}`;
    }
    if (game.actionPoints < action.apCost) {
      return `Need ${action.apCost} AP`;
    }
    if (action.resourceCost) {
      for (const [key, cost] of Object.entries(action.resourceCost) as Array<[ResourceKey, number]>) {
        if (game.resources[key] < cost) {
          return `Need ${cost} ${key}`;
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

    let rngState = game.rngState;
    const uncertainty = Math.max(1, intelProfile.variance - 1);
    const rolledStats = rollUncertainStatEffects(
      action.effects.statEffects ?? {},
      uncertainty,
      rngState,
    );
    rngState = rolledStats.rngState;

    const resourceCostDelta: Delta<ResourceKey> = {};
    for (const [key, cost] of Object.entries(action.resourceCost ?? {}) as Array<[ResourceKey, number]>) {
      resourceCostDelta[key] = -cost;
    }

    const resourceDelta = mergeDelta(resourceCostDelta, action.effects.resourceEffects);
    const resources = applyResourceEffects(game.resources, resourceDelta);
    const stats = applyStatEffects(game.stats, rolledStats.effects);
    const actorApplication = applyActorEffects(game.actors, action.effects.actorEffects ?? {});

    const actionPoints = Math.max(0, game.actionPoints - action.apCost);
    const cooldowns = { ...game.cooldowns, [action.id]: action.cooldown };

    setGame((prev) => ({
      ...prev,
      rngState,
      stats,
      resources,
      actors: actorApplication.actors,
      actionPoints,
      cooldowns,
      message:
        actionPoints === 0
          ? `${action.title} executed. Overextension risk armed for this turn.`
          : `${action.title} executed.`,
      lastStatDelta: rolledStats.effects,
      lastResourceDelta: resourceDelta,
      lastActorLoyaltyDelta: actorApplication.loyaltyDelta,
      lastActorPressureDelta: actorApplication.pressureDelta,
    }));

    const statSummary = summarizeDelta(rolledStats.effects, STAT_META);
    setHistory((prev) => {
      const line = `Strategic action -> ${action.title}${statSummary ? ` (${statSummary})` : ""}`;
      return [line, ...prev].slice(0, 18);
    });
  };

  const resolveCrisisOption = (option: ScenarioOption) => {
    if (!canPlay) {
      return;
    }

    let rngState = game.rngState;

    const rolledOptionStats = rollUncertainStatEffects(option.statEffects, intelProfile.variance, rngState);
    rngState = rolledOptionStats.rngState;

    const pendingResolution = resolvePendingEffects(
      game.pendingEffects,
      rngState,
      intelProfile.confidence,
    );
    rngState = pendingResolution.rngState;

    const queuedDelayed = queueDelayedEffects(option, game.resources.intel, rngState);
    rngState = queuedDelayed.rngState;

    let statDelta: Delta<StatKey> = { treasury: -2, trust: -1 };
    let resourceDelta: Delta<ResourceKey> = { intel: 1, supplies: 1, capital: 1 };
    let actorEffects: ActorEffects = {};
    let coupRiskDelta = 0;

    statDelta = mergeDelta(statDelta, rolledOptionStats.effects);
    statDelta = mergeDelta(statDelta, pendingResolution.statEffects);
    resourceDelta = mergeDelta(resourceDelta, option.resourceEffects);
    resourceDelta = mergeDelta(resourceDelta, pendingResolution.resourceEffects);
    actorEffects = mergeActorEffects(actorEffects, option.actorEffects, pendingResolution.actorEffects);
    coupRiskDelta += pendingResolution.coupRisk;

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

    const coupling = computeSystemCoupling(stats, resources, actors, game.doctrine);
    stats = applyStatEffects(stats, coupling.statEffects);
    resources = applyResourceEffects(resources, coupling.resourceEffects);
    const couplingActorApply = applyActorEffects(actors, coupling.actorEffects);
    actors = couplingActorApply.actors;

    statDelta = mergeDelta(statDelta, coupling.statEffects);
    resourceDelta = mergeDelta(resourceDelta, coupling.resourceEffects);
    coupRiskDelta += coupling.coupRisk;

    const regionSimulation = simulateRegions(
      game.regions,
      scenario,
      option,
      stats.security,
      rngState,
    );
    rngState = regionSimulation.rngState;
    const regions = regionSimulation.regions;
    stats = applyStatEffects(stats, regionSimulation.statPenalty);
    statDelta = mergeDelta(statDelta, regionSimulation.statPenalty);
    coupRiskDelta += regionSimulation.coupRiskDelta;

    let coupRisk = clamp(game.coupRisk + coupRiskDelta);
    let phase: Phase = "playing";
    let collapseCount = game.collapseCount;
    let message = `${scenario.title}: ${option.title}. ${regionSimulation.summary}`;

    const collapsedStats = STAT_META.filter((entry) => stats[entry.key] === 0);
    if (collapsedStats.length > 0) {
      if (collapseCount === 0) {
        collapseCount = 1;
        for (const collapsed of collapsedStats) {
          stats[collapsed.key] = 15;
        }
        coupRisk = clamp(coupRisk + 20);
        message =
          "Emergency mode triggered. Institutions held for now, but one more collapse ends the run.";
      } else {
        phase = "lost";
        message = `Regime collapse: ${collapsedStats.map((entry) => entry.label).join(", ")} failed again.`;
      }
    }

    if (phase === "playing" && coupRisk >= 100) {
      phase = "lost";
      message = "Coup risk reached critical threshold. Command authority collapsed.";
    }

    const nextTurn = game.turn + 1;
    let scenarioId = game.scenarioId;
    if (phase === "playing") {
      if (nextTurn > game.maxTurns) {
        const averageStress =
          Object.values(regions).reduce((sum, value) => sum + value, 0) / REGION_META.length;
        if (stats.stability >= 40 && stats.trust >= 35 && coupRisk < 70 && averageStress < 70) {
          phase = "won";
          message = "Mandate survived. You contained crises without full breakdown.";
        } else {
          phase = "lost";
          message = "Term ended in systemic fragility. Earlier compromises finally broke the state.";
        }
      } else {
        const nextScenario = pickScenario(game.scenarioId, rngState);
        scenarioId = nextScenario.scenarioId;
        rngState = nextScenario.rngState;
      }
    }

    const cooldowns = reduceCooldowns(game.cooldowns);
    const pendingEffects = [...pendingResolution.remaining, ...queuedDelayed.queued];

    const loyaltyDelta = mergeDelta(actorApply.loyaltyDelta, couplingActorApply.loyaltyDelta);
    const pressureDelta = mergeDelta(actorApply.pressureDelta, couplingActorApply.pressureDelta);

    setGame((prev) => ({
      ...prev,
      rngState,
      turn: nextTurn,
      phase,
      message,
      scenarioId,
      stats,
      resources,
      actors,
      regions,
      actionPoints: prev.maxActionPoints,
      cooldowns,
      pendingEffects,
      coupRisk,
      collapseCount,
      lastStatDelta: statDelta,
      lastResourceDelta: resourceDelta,
      lastActorLoyaltyDelta: loyaltyDelta,
      lastActorPressureDelta: pressureDelta,
    }));

    const optionSummary = summarizeDelta(rolledOptionStats.effects, STAT_META);
    const pendingLogs = [...pendingResolution.logs, ...queuedDelayed.logs];
    const logLine = `${scenario.title} -> ${option.title}${optionSummary ? ` (${optionSummary})` : ""}`;
    setHistory((prev) => [logLine, ...pendingLogs, ...prev].slice(0, 18));
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
      setSeedMessage("Seed already exists.");
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
    setSeedMessage(`Saved '${seedName}'.`);
  };

  const removeCustomSeed = (seedId: string) => {
    setCustomSeeds((prev) => prev.filter((seed) => seed.id !== seedId));
    setSeedMessage("Custom seed removed.");
  };

  const clearLocalData = () => {
    window.localStorage.removeItem(RUN_STORAGE_KEY);
    window.localStorage.removeItem(CUSTOM_SEEDS_STORAGE_KEY);
    setCustomSeeds([]);
    startRunWithSeed(DEFAULT_SEED);
    setSeedMessage("Cleared local run and custom seeds.");
  };

  const warnings = [
    game.stats.stability < 30 ? "Institutional stability critical" : null,
    game.stats.trust < 30 ? "Public trust collapse risk" : null,
    game.resources.intel < 4 ? "Intel is low: forecasts are noisy" : null,
    game.coupRisk >= 70 ? "Coup risk is escalating rapidly" : null,
  ].filter((warning): warning is string => Boolean(warning));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1.55fr_1fr]">
      <MainStageCard
        game={game}
        scenario={scenario}
        intelProfile={intelProfile}
        escalationClock={escalationClock}
        hotRegions={hotRegions}
        criticalRegions={criticalRegions}
        canPlay={canPlay}
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
        allSeeds={allSeeds}
        onRemoveCustomSeed={removeCustomSeed}
        onChooseDoctrine={chooseDoctrine}
        onResolveCrisisOption={resolveCrisisOption}
      />

      <div className="space-y-6">
        <PoliciesCard game={game} canPlay={canPlay} onEnactPolicy={enactPolicy} />
        <StrategicActionsCard
          getActionDisabledReason={getActionDisabledReason}
          onTriggerStrategicAction={triggerStrategicAction}
        />
        <SystemStateCard game={game} warnings={warnings} />
        <ActorsRegionsCard game={game} />
        <SimulationLogCard history={history} />
      </div>
    </div>
  );
}
