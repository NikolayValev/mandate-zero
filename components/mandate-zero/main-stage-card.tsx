"use client";

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
import { DEFAULT_SEED, DOCTRINES } from "./data";
import { describeEstimatedImpact, riskVariant } from "./engine";
import type {
  DemoSeed,
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
  seedInput: string;
  onSeedInputChange: (value: string) => void;
  onStartRunWithSeed: (seedValue: string) => void;
  onClearLocalData: () => void;
  newSeedName: string;
  onNewSeedNameChange: (value: string) => void;
  newSeedValue: string;
  onNewSeedValueChange: (value: string) => void;
  onAddCustomSeed: () => void;
  seedMessage: string | null;
  allSeeds: DemoSeed[];
  onRemoveCustomSeed: (seedId: string) => void;
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
  seedInput,
  onSeedInputChange,
  onStartRunWithSeed,
  onClearLocalData,
  newSeedName,
  onNewSeedNameChange,
  newSeedValue,
  onNewSeedValueChange,
  onAddCustomSeed,
  seedMessage,
  allSeeds,
  onRemoveCustomSeed,
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
            <p className="mt-1 text-xs text-muted-foreground">
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
          <p className="mt-1 text-sm text-muted-foreground">{scenario.description}</p>
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
                  <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
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
                  <Badge variant="outline">{intelProfile.confidence} confidence</Badge>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated impact: {describeEstimatedImpact(option, intelProfile)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Faction reaction: {option.factionReaction}
              </p>
            </button>
          ))}
        </div>

        <details className="group rounded-lg border p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Demo Seeds</p>
              <p className="text-xs text-muted-foreground">{allSeeds.length} scenarios</p>
            </div>
            <span className="text-xs text-muted-foreground group-open:hidden">Expand</span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              Collapse
            </span>
          </summary>

          <div className="mt-4 space-y-4">
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div>
                <Label htmlFor="seed-input">Current Seed</Label>
                <Input
                  id="seed-input"
                  value={seedInput}
                  onChange={(event) => onSeedInputChange(event.target.value)}
                  placeholder={DEFAULT_SEED}
                />
              </div>
              <Button onClick={() => onStartRunWithSeed(seedInput)} variant="outline">
                Restart Seed
              </Button>
              <Button onClick={onClearLocalData} variant="destructive">
                Clear Local Data
              </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div>
                <Label htmlFor="new-seed-name">Seed Name</Label>
                <Input
                  id="new-seed-name"
                  value={newSeedName}
                  onChange={(event) => onNewSeedNameChange(event.target.value)}
                  placeholder="Investor Panic Demo"
                />
              </div>
              <div>
                <Label htmlFor="new-seed-value">Seed Value</Label>
                <Input
                  id="new-seed-value"
                  value={newSeedValue}
                  onChange={(event) => onNewSeedValueChange(event.target.value)}
                  placeholder={seedInput}
                />
              </div>
              <Button onClick={onAddCustomSeed}>Add</Button>
            </div>

            {seedMessage ? <p className="text-xs text-muted-foreground">{seedMessage}</p> : null}

            <div className="space-y-2">
              {allSeeds.map((seed) => (
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
                      onClick={() => onStartRunWithSeed(seed.value)}
                    >
                      Load
                    </Button>
                    {seed.custom ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemoveCustomSeed(seed.id)}
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
      </CardContent>
    </Card>
  );
}
