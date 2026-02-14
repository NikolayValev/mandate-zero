"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REGION_META, STAT_META } from "./data";
import { summarizeDelta, toPressureState, toTier } from "./engine";
import type { CausalityEntry, GameState, RegionKey } from "./types";

interface RunDebriefCardProps {
  game: GameState;
  entries: CausalityEntry[];
  onRestart: () => void;
}

function topRegions(entries: CausalityEntry[]) {
  const counts = new Map<RegionKey, number>();
  for (const entry of entries) {
    for (const region of entry.regionImpacts) {
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([region]) => REGION_META.find((meta) => meta.key === region)?.label ?? region);
}

export function RunDebriefCard({ game, entries, onRestart }: RunDebriefCardProps) {
  const pressureState = toPressureState(game.pressure);
  const keyChoices = entries
    .filter((entry) => !entry.actionLabel.startsWith("Doctrine:"))
    .slice(0, 3)
    .map((entry) => entry.actionLabel);
  const triggered = [...new Set(entries.flatMap((entry) => entry.thresholdsTriggered))].slice(0, 3);
  const delayed = [...new Set(entries.flatMap((entry) => entry.delayedEnqueued))].slice(0, 3);
  const hotspots = topRegions(entries);

  return (
    <Card data-testid="run-debrief-card" className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{game.phase === "won" ? "Mandate Debrief: Survived" : "Mandate Debrief: Collapsed"}</CardTitle>
          <Badge variant={game.phase === "won" ? "default" : "destructive"}>
            {game.phase === "won" ? "Victory" : "Defeat"}
          </Badge>
        </div>
        <CardDescription>
          Turn {Math.min(game.turn - 1, game.maxTurns)} summary for seed <span className="font-mono">{game.seedText}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{game.message}</p>
        <p>
          Final pressure state: <strong>{pressureState.label}</strong>
        </p>
        <p>
          Final systems:{" "}
          {STAT_META.map((stat) => `${stat.label} ${toTier(game.stats[stat.key]).label}`).join(" | ")}
        </p>
        <p>Recent system shifts: {summarizeDelta(game.lastStatDelta, STAT_META) || "No immediate shifts recorded."}</p>
        <p>Key choices: {keyChoices.length > 0 ? keyChoices.join(" -> ") : "No major actions recorded."}</p>
        <p>Triggered outcomes: {triggered.length > 0 ? triggered.join(" | ") : "None"}</p>
        <p>Delayed effects: {delayed.length > 0 ? delayed.join(" | ") : "None"}</p>
        <p>Most affected regions: {hotspots.length > 0 ? hotspots.join(", ") : "None"}</p>
        <Button type="button" className="min-h-11 px-5" data-testid="debrief-restart" onClick={onRestart}>
          Start New Run (Same Seed)
        </Button>
      </CardContent>
    </Card>
  );
}
