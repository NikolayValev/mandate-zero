"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { computeTrend, riskVariant, toPressureState } from "./engine";
import {
  getConfidenceLabel,
  getPressureLabel,
  getRiskLabel,
  getStatLabel,
  getTurnStageLabel,
  type AppLanguage,
} from "./i18n";
import { buildScenarioBrief, buildSituationExplanation } from "./situation-copy";
import type {
  Doctrine,
  DoctrineId,
  GameState,
  IntelProfile,
  OutcomeEstimate,
  QueuedEffect,
  Scenario,
  ScenarioOption,
} from "./types";

interface MainStageCardProps {
  game: GameState;
  scenario: Scenario;
  intelProfile: IntelProfile;
  escalationClock: number;
  hotRegions: number;
  criticalRegions: number;
  upcomingEffects: QueuedEffect[];
  optionOutcomeEstimates: Record<string, OutcomeEstimate[]>;
  canPlay: boolean;
  showDebugNumbers: boolean;
  language: AppLanguage;
  doctrines: Doctrine[];
  onChooseDoctrine: (doctrineId: DoctrineId) => void;
  onResolveCrisisOption: (option: ScenarioOption) => void;
}

function phaseVariant(phase: GameState["phase"]): "default" | "destructive" | "secondary" {
  if (phase === "won") {
    return "default";
  }
  if (phase === "lost") {
    return "destructive";
  }
  return "secondary";
}

function phaseLabel(phase: GameState["phase"], language: AppLanguage) {
  if (phase === "playing") {
    return language === "bg" ? "В ход" : "In Session";
  }
  if (phase === "won") {
    return language === "bg" ? "Победа" : "Victory";
  }
  return language === "bg" ? "Поражение" : "Defeat";
}

function severityText(severity: number) {
  if (severity >= 5) {
    return "Critical";
  }
  if (severity >= 4) {
    return "High";
  }
  if (severity >= 3) {
    return "Elevated";
  }
  return "Contained";
}

export function MainStageCard({
  game,
  scenario,
  intelProfile,
  escalationClock,
  hotRegions,
  criticalRegions,
  upcomingEffects,
  optionOutcomeEstimates,
  canPlay,
  showDebugNumbers,
  language,
  doctrines,
  onChooseDoctrine,
  onResolveCrisisOption,
}: MainStageCardProps) {
  const pressureState = toPressureState(game.pressure);
  const pressureTrend = computeTrend(game.systemHistory.map((snapshot) => snapshot.pressure));
  const pressureTone =
    getPressureLabel(pressureState.label, "en") === "Breaking"
      ? "bg-red-500"
      : getPressureLabel(pressureState.label, "en") === "Hot"
        ? "bg-orange-500"
        : getPressureLabel(pressureState.label, "en") === "Tense"
          ? "bg-yellow-500"
          : "bg-emerald-500";
  const pressureArrow =
    pressureTrend.direction === "up"
      ? "UP"
      : pressureTrend.direction === "down"
        ? "DOWN"
        : "FLAT";

  return (
    <Card data-testid="main-stage-card">
      <CardHeader>
        <div className="rounded-md border p-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>{language === "bg" ? "Ход" : "Turn"} {Math.min(game.turn, game.maxTurns)}</span>
            <span>
              {language === "bg" ? "Етап" : "Stage"} {getTurnStageLabel(game.turnStage, language)}
            </span>
            <span data-testid="pressure-label">
              {language === "bg" ? "Натиск" : "Pressure"} {getPressureLabel(pressureState.label, language)} {pressureArrow}
              {showDebugNumbers ? ` (${game.pressure})` : ""}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div className={`h-2 rounded-full transition-all ${pressureTone}`} style={{ width: `${game.pressure}%` }} />
          </div>
          {pressureTrend.momentum ? (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {language === "bg" ? "Натиск" : "Pressure"}{" "}
              {language === "bg" ? "ускорява се" : pressureTrend.momentum}
            </p>
          ) : null}
          <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
            <span>{language === "bg" ? "Криза" : "Crisis"}</span>
            <span>{language === "bg" ? "Решение" : "Decision"}</span>
            <span>{language === "bg" ? "Развръзка" : "Resolution"}</span>
            <span>{language === "bg" ? "Последствия" : "Fallout"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{language === "bg" ? "Симулация Mandate Zero" : "Mandate Zero Simulation"}</CardTitle>
            <CardDescription className="hidden sm:block">
              {language === "bg" ? "Ход" : "Turn"} {Math.min(game.turn, game.maxTurns)}{" "}
              {language === "bg" ? "от" : "of"} {game.maxTurns} | AP{" "}
              {game.actionPoints}/{game.maxActionPoints}
            </CardDescription>
            <p className="mt-1 text-xs text-muted-foreground sm:hidden">
              Read the situation and choose one response.
            </p>
            <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
              {language === "bg" ? "Сийд" : "Seed"}: {game.seedText} |{" "}
              {language === "bg" ? "Увереност" : "Confidence"}: {getConfidenceLabel(intelProfile.confidence, language)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={phaseVariant(game.phase)}>{phaseLabel(game.phase, language)}</Badge>
            <Badge
              variant={game.coupRisk >= 70 ? "destructive" : "outline"}
              className="hidden sm:inline-flex"
            >
              {language === "bg" ? "Риск от преврат" : "Coup Risk"} {game.coupRisk}
            </Badge>
            <Badge variant={game.coupRisk >= 70 ? "destructive" : "outline"} className="sm:hidden">
              Coup Risk
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${game.turn}-${scenario.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {language === "bg" ? "Активна криза" : "Active Crisis"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={scenario.severity >= 4 ? "destructive" : "secondary"} className="hidden sm:inline-flex">
                    {language === "bg" ? "Тежест" : "Severity"} {scenario.severity}/5
                  </Badge>
                  <Badge variant={scenario.severity >= 4 ? "destructive" : "secondary"} className="sm:hidden">
                    {severityText(scenario.severity)}
                  </Badge>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {language === "bg" ? "Ескалация след" : "Escalation in"} {escalationClock}
                  </Badge>
                  <Badge variant="outline" className="sm:hidden">
                    Escalation
                  </Badge>
                </div>
              </div>
              <h3 className="mt-2 text-lg font-semibold">{scenario.title}</h3>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {language === "bg" ? "Кратка обстановка" : "Situation Brief"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{buildScenarioBrief(scenario, language)}</p>
              <p className="mt-2 text-xs text-muted-foreground sm:hidden">
                {hotRegions + criticalRegions > 2
                  ? "Escalation pressure is spreading."
                  : "Regional pressure is still contained."}
              </p>
              <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
                {language === "bg"
                  ? `Преглед на разпространението: ${hotRegions} горещи региона, ${criticalRegions} критични.`
                  : `Spread preview: ${hotRegions} hot regions, ${criticalRegions} critical.`}
              </p>
            </div>

            {!game.doctrine ? (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {language === "bg" ? "Избери доктрина (необратимо)" : "Choose Doctrine (irreversible)"}
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {doctrines.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      data-testid={`doctrine-${option.id}`}
                      className="rounded-lg border p-3 text-left transition hover:bg-accent"
                      onClick={() => onChooseDoctrine(option.id)}
                    >
                      <p className="font-medium">{option.title}</p>
                      <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground sm:hidden">
                Read each option and follow the text cues for risk and stakeholder pulse.
              </p>
              {scenario.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-testid={`crisis-option-${option.id}`}
                  disabled={!canPlay}
                  onClick={() => onResolveCrisisOption(option)}
                  className="w-full rounded-lg border p-4 text-left transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{option.title}</p>
                    <div className="flex gap-2">
                      <Badge variant={riskVariant(option.risk)}>
                        {language === "bg" ? "Риск" : "Risk"} {getRiskLabel(option.risk, language)}
                      </Badge>
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        {getConfidenceLabel(intelProfile.confidence, language)}{" "}
                        {language === "bg" ? "увереност" : "confidence"}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {language === "bg" ? "Ситуация" : "Situation"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {buildSituationExplanation(scenario, option, language)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 sm:grid sm:grid-cols-2">
                    {(optionOutcomeEstimates[option.id] ?? []).slice(0, 4).map((estimate) => {
                      const statLabel = getStatLabel(estimate.system, language);
                      const isPositive = estimate.max > 0;
                      return (
                        <div key={`${option.id}-${estimate.system}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={isPositive ? "text-emerald-500/90" : "text-rose-500/90"}>
                            {isPositive ? "▲" : "▼"}
                          </span>
                          <span>{statLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                  {(optionOutcomeEstimates[option.id] ?? []).length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {language === "bg" ? "Прогнозен ефект: неутрален" : "Estimated impact: neutral"}
                    </p>
                  ) : null}
                  {option.delayed && option.delayed.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {language === "bg" ? "Възможни отложени последствия:" : "Possible delayed fallout:"}{" "}
                      {option.delayed.map((item) => item.label).join(", ")}
                    </p>
                  ) : null}
                  {upcomingEffects.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {language === "bg" ? "Планирани последствия:" : "Queued fallout:"}{" "}
                      <span className="sm:hidden">
                        {upcomingEffects
                          .slice(0, 2)
                          .map((effect) => effect.source)
                          .join(" | ")}
                      </span>
                      <span className="hidden sm:inline">
                        {upcomingEffects
                          .slice(0, 2)
                          .map((effect) => `${effect.source} (T${effect.turnToApply})`)
                          .join(" | ")}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {language === "bg" ? "Реакция на групите:" : "Stakeholder pulse:"} {option.factionReaction}
                  </p>
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground sm:text-sm">{game.message}</p>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

