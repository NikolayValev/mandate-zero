"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RESOURCE_META, STAT_META } from "./data";
import { computeTrend, toTier } from "./engine";
import type { CoreSystemKey, GameState } from "./types";

interface SystemStateCardProps {
  game: GameState;
  warnings: string[];
  highlightedSystems: CoreSystemKey[];
  showDebugNumbers: boolean;
  onToggleDebugNumbers: () => void;
}

function trendArrow(direction: "up" | "down" | "flat") {
  if (direction === "up") {
    return "↑";
  }
  if (direction === "down") {
    return "↓";
  }
  return "→";
}

export function SystemStateCard({
  game,
  warnings,
  highlightedSystems,
  showDebugNumbers,
  onToggleDebugNumbers,
}: SystemStateCardProps) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>System State</CardTitle>
          {isDev ? (
            <Button type="button" variant="outline" size="sm" className="min-h-10 px-3 text-xs" onClick={onToggleDebugNumbers}>
              {showDebugNumbers ? "Hide Numbers" : "Show Numbers"}
            </Button>
          ) : null}
        </div>
        <CardDescription className="hidden sm:block">
          Core systems are qualitative. Arrows show direction and repeated movement shows momentum.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {STAT_META.map((stat) => {
          const value = game.stats[stat.key];
          const tier = toTier(value);
          const trend = computeTrend(game.systemHistory.map((snapshot) => snapshot[stat.key]));
          const severityWidth = (5 - tier.severity) * 20;
          const highlighted = highlightedSystems.includes(stat.key);
          return (
            <div
              key={stat.key}
              className={`space-y-1 rounded-md border p-2 transition-colors ${
                highlighted ? "border-primary/60 bg-primary/5 animate-pulse" : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">{stat.label}</div>
                <Badge variant={tier.severity >= 3 ? "destructive" : tier.severity >= 2 ? "secondary" : "outline"}>
                  {tier.label} {trendArrow(trend.direction)}
                </Badge>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-primary/70 transition-all"
                  style={{ width: `${severityWidth}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Trend {trendArrow(trend.direction)}
                {trend.momentum ? `, ${trend.momentum}` : ""}
                {showDebugNumbers ? ` | ${value}` : ""}
              </p>
            </div>
          );
        })}

        <div className="pt-2">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Resources</p>
          <div className="flex flex-wrap gap-2">
            {RESOURCE_META.map((resource) => {
              const delta = game.lastResourceDelta[resource.key] ?? 0;
              return (
                <Badge key={resource.key} variant="outline">
                  {resource.label}: {game.resources[resource.key]}
                  {delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}
                </Badge>
              );
            })}
          </div>
        </div>

        {warnings.length > 0 ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
