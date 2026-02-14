"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DOCTRINES, STAT_META } from "./data";
import { computeTrend, riskVariant, toPressureState } from "./engine";
import type {
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

function phaseLabel(phase: GameState["phase"]) {
  if (phase === "playing") {
    return "In Session";
  }
  return phase === "won" ? "Victory" : "Defeat";
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
  onChooseDoctrine,
  onResolveCrisisOption,
}: MainStageCardProps) {
  const pressureState = toPressureState(game.pressure);
  const pressureTrend = computeTrend(game.systemHistory.map((snapshot) => snapshot.pressure));
  const pressureTone =
    pressureState.label === "Breaking"
      ? "bg-red-500"
      : pressureState.label === "Hot"
        ? "bg-orange-500"
        : pressureState.label === "Tense"
          ? "bg-yellow-500"
          : "bg-emerald-500";
  const pressureArrow =
    pressureTrend.direction === "up" ? "↑" : pressureTrend.direction === "down" ? "↓" : "→";

  return (
    <Card data-testid="main-stage-card">
      <CardHeader>
        <div className="rounded-md border p-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Turn {Math.min(game.turn, game.maxTurns)}</span>
            <span>Stage {game.turnStage}</span>
            <span data-testid="pressure-label">
              Pressure {pressureState.label} {pressureArrow}
              {showDebugNumbers ? ` (${game.pressure})` : ""}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div className={`h-2 rounded-full transition-all ${pressureTone}`} style={{ width: `${game.pressure}%` }} />
          </div>
          {pressureTrend.momentum ? (
            <p className="mt-1 text-[10px] text-muted-foreground">Pressure {pressureTrend.momentum}</p>
          ) : null}
          <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
            <span>Crisis</span>
            <span>Decision</span>
            <span>Resolution</span>
            <span>Fallout</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Mandate Zero Simulation</CardTitle>
            <CardDescription>
              Turn {Math.min(game.turn, game.maxTurns)} of {game.maxTurns} | AP {" "}
              {game.actionPoints}/{game.maxActionPoints}
            </CardDescription>
            <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
              Seed: {game.seedText} | Confidence: {intelProfile.confidence}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={phaseVariant(game.phase)}>{phaseLabel(game.phase)}</Badge>
            <Badge variant={game.coupRisk >= 70 ? "destructive" : "outline"}>
              Coup Risk {game.coupRisk}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Active Crisis
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={scenario.severity >= 4 ? "destructive" : "secondary"}>
                Severity {scenario.severity}/5
              </Badge>
              <Badge variant="outline">Escalation in {escalationClock}</Badge>
            </div>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{scenario.title}</h3>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            {scenario.description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Spread preview: {hotRegions} hot regions, {criticalRegions} critical.
          </p>
        </div>

        {!game.doctrine ? (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Choose Doctrine (irreversible)
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {DOCTRINES.map((option) => (
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
                <Badge variant={riskVariant(option.risk)}>Risk {option.risk}</Badge>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {intelProfile.confidence} confidence
                  </Badge>
                </div>
              </div>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                Situation: {option.description}
              </p>
              {option.riskHint ? (
                <p className="mt-1 text-xs text-muted-foreground">Tension: {option.riskHint}</p>
              ) : null}
              <div className="mt-2 grid gap-1">
                {(optionOutcomeEstimates[option.id] ?? []).slice(0, 4).map((estimate) => {
                  const statLabel = STAT_META.find((entry) => entry.key === estimate.system)?.label ?? estimate.system;
                  const minLabel = estimate.min > 0 ? `+${estimate.min}` : `${estimate.min}`;
                  const maxLabel = estimate.max > 0 ? `+${estimate.max}` : `${estimate.max}`;
                  return (
                    <p key={`${option.id}-${estimate.system}`} className="text-xs text-muted-foreground">
                      {statLabel}: {minLabel} to {maxLabel} ({estimate.confidence})
                    </p>
                  );
                })}
              </div>
              {(optionOutcomeEstimates[option.id] ?? []).length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">Estimated impact: neutral</p>
              ) : null}
              {option.delayed && option.delayed.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Possible delayed fallout: {option.delayed.map((item) => item.label).join(", ")}
                </p>
              ) : null}
              {upcomingEffects.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Queued fallout:{" "}
                  {upcomingEffects
                    .slice(0, 2)
                    .map((effect) => `${effect.source} (T${effect.turnToApply})`)
                    .join(" | ")}
                </p>
              ) : null}
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                Faction reaction: {option.factionReaction}
              </p>
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground sm:text-sm">{game.message}</p>
      </CardContent>
    </Card>
  );
}
