"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DOCTRINES } from "./data";
import { describeEstimatedImpact, riskVariant } from "./engine";
import type {
  DoctrineId,
  GameState,
  IntelProfile,
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
  canPlay: boolean;
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
  canPlay,
  onChooseDoctrine,
  onResolveCrisisOption,
}: MainStageCardProps) {
  return (
    <Card>
      <CardHeader>
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
                {option.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground sm:hidden">
                {describeEstimatedImpact(option, intelProfile)}
              </p>
              <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
                Estimated impact: {describeEstimatedImpact(option, intelProfile)}
              </p>
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
