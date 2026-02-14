"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RESOURCE_META, STAT_META } from "./data";
import type { GameState } from "./types";

interface SystemStateCardProps {
  game: GameState;
  warnings: string[];
}

export function SystemStateCard({ game, warnings }: SystemStateCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System State</CardTitle>
        <CardDescription className="hidden sm:block">
          Interacting systems push back. Trends show last simulation change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {STAT_META.map((stat) => {
          const value = game.stats[stat.key];
          return (
            <div key={stat.key} className="space-y-1">
              <div className="text-sm">{stat.label}</div>
              <div className="h-4 rounded-full bg-muted">
                <div
                  className="flex h-4 items-center justify-end rounded-full bg-primary px-2 text-[10px] font-semibold text-primary-foreground transition-all"
                  style={{ width: `${value}%` }}
                >
                  {value}%
                </div>
              </div>
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
