"use client";

import { ActorsRegionsCard } from "@/components/mandate-zero/actors-regions-card";
import { DemoSeedsCard } from "@/components/mandate-zero/demo-seeds-card";
import { MainStageCard } from "@/components/mandate-zero/main-stage-card";
import { OnboardingOverlay } from "@/components/mandate-zero/onboarding-overlay";
import { PoliciesCard } from "@/components/mandate-zero/policies-card";
import { RunDebriefCard } from "@/components/mandate-zero/run-debrief-card";
import { SimulationLogCard } from "@/components/mandate-zero/simulation-log-card";
import { StrategicActionsCard } from "@/components/mandate-zero/strategic-actions-card";
import { SystemStateCard } from "@/components/mandate-zero/system-state-card";
import { type AppLanguage } from "@/components/mandate-zero/i18n";
import { useMandateZeroRuntime } from "@/components/mandate-zero/use-mandate-zero-runtime";

interface MandateZeroMvpProps {
  language: AppLanguage;
}

export function MandateZeroMvp({ language }: MandateZeroMvpProps) {
  const runtime = useMandateZeroRuntime(language);

  return (
    <div className="relative">
      {runtime.showOnboarding ? (
        <OnboardingOverlay language={language} onDismiss={runtime.dismissOnboarding} />
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.5fr_1fr]">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <div className="order-2 lg:order-1">
            <PoliciesCard
              game={runtime.game}
              canPlay={runtime.canPlay}
              language={language}
              policies={runtime.localizedPolicies}
              onEnactPolicy={runtime.enactPolicy}
            />
          </div>
          <div className="order-1 lg:order-2">
            <StrategicActionsCard
              language={language}
              actions={runtime.localizedStrategicActions}
              getActionDisabledReason={runtime.getActionDisabledReason}
              getActionPointCost={runtime.getAdjustedActionCost}
              getActionOutcomeEstimate={runtime.getActionOutcomeEstimate}
              upcomingEffects={runtime.upcomingEffects}
              onTriggerStrategicAction={runtime.triggerStrategicAction}
            />
          </div>
          <div className="order-3">
            <SimulationLogCard
              entries={runtime.causalityHistory}
              selectedEntryId={runtime.selectedCausalityId}
              language={language}
              onSelectEntry={runtime.selectCausalityEntry}
            />
          </div>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          {runtime.game.phase !== "playing" ? (
            <RunDebriefCard
              game={runtime.game}
              entries={runtime.causalityHistory}
              language={language}
              onRestart={() => runtime.startRunWithSeed(runtime.game.seedText)}
            />
          ) : null}
          <MainStageCard
            game={runtime.game}
            scenario={runtime.localizedScenario}
            intelProfile={runtime.intelProfile}
            escalationClock={runtime.escalationClock}
            hotRegions={runtime.hotRegions}
            criticalRegions={runtime.criticalRegions}
            upcomingEffects={runtime.upcomingEffects}
            optionOutcomeEstimates={runtime.optionOutcomeEstimates}
            canPlay={runtime.canPlay}
            showDebugNumbers={runtime.showDebugNumbers}
            language={language}
            doctrines={runtime.localizedDoctrines}
            onChooseDoctrine={runtime.chooseDoctrine}
            onResolveCrisisOption={runtime.resolveCrisisOption}
          />
        </div>

        <div className="order-3 flex flex-col gap-6">
          <div className="order-1 lg:order-2">
            <SystemStateCard
              game={runtime.game}
              warnings={runtime.warnings}
              highlightedSystems={runtime.highlightedSystems}
              showDebugNumbers={runtime.showDebugNumbers}
              language={language}
              onToggleDebugNumbers={runtime.toggleDebugNumbers}
            />
          </div>
          <div className="order-2 lg:order-3">
            <ActorsRegionsCard
              game={runtime.game}
              language={language}
              highlightedRegions={runtime.highlightedRegions}
            />
          </div>
          <div className="order-3 lg:order-1">
            <DemoSeedsCard
              language={language}
              seedInput={runtime.seedInput}
              onSeedInputChange={runtime.setSeedInput}
              onStartRunWithSeed={runtime.startRunWithSeed}
              onClearLocalData={runtime.clearLocalData}
              newSeedName={runtime.newSeedName}
              onNewSeedNameChange={runtime.setNewSeedName}
              newSeedValue={runtime.newSeedValue}
              onNewSeedValueChange={runtime.setNewSeedValue}
              onAddCustomSeed={runtime.addCustomSeed}
              seedMessage={runtime.seedMessage}
              allSeeds={runtime.displaySeeds}
              onRemoveCustomSeed={runtime.removeCustomSeed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
