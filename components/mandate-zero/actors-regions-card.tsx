"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACTOR_META, REGION_META } from "./data";
import { getScenario, regionClass } from "./engine";
import { REGION_ACTOR_FOCUS, RegionTheaterMap } from "./region-theater-map";
import type { ActorKey, GameState, RegionKey } from "./types";

const StateMeshScene = dynamic(
  () => import("./three/Scene").then((mod) => mod.StateMeshScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] w-full animate-pulse rounded-lg border bg-muted/30" />
    ),
  },
);

interface ActorsRegionsCardProps {
  game: GameState;
  highlightedRegions: RegionKey[];
  highlightedActors: ActorKey[];
}

export function ActorsRegionsCard({ game, highlightedRegions, highlightedActors }: ActorsRegionsCardProps) {
  const [showThreeLayer, setShowThreeLayer] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("capital");
  const activeScenarioTargets = useMemo(
    () => getScenario(game.scenarioId).regionTargets,
    [game.scenarioId],
  );
  const queuedFalloutRegions = useMemo(() => {
    const regions = new Set<RegionKey>();
    for (const queued of game.effectsQueue) {
      if (queued.turnToApply > game.turn + 1) {
        continue;
      }
      if (queued.scope !== "global" && queued.scope.regions) {
        for (const region of queued.scope.regions) {
          regions.add(region);
        }
      }
    }
    return [...regions];
  }, [game.effectsQueue, game.turn]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actors and Regions</CardTitle>
        <CardDescription className="hidden sm:block">
          Actor conditions shape region severity. Spatial stress now renders in a 3D theater.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegionTheaterMap
          game={game}
          highlightedRegions={highlightedRegions}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
        />

        <div className="rounded-md border p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Optional 3D state layer. Tap a block to select region in the same panel.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 px-4"
              onClick={() => setShowThreeLayer((prev) => !prev)}
            >
              {showThreeLayer ? "Hide 3D Layer" : "Show 3D Layer"}
            </Button>
          </div>
          {showThreeLayer ? (
            <div className="mt-2">
              <StateMeshScene
                game={game}
                selectedRegion={selectedRegion}
                highlightedRegions={highlightedRegions}
                activeCrisisRegions={activeScenarioTargets}
                queuedFalloutRegions={queuedFalloutRegions}
                onSelectRegion={setSelectedRegion}
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          {ACTOR_META.map((actor) => {
            const state = game.actors[actor.key];
            return (
              <div
                key={actor.key}
                data-testid={`actor-card-${actor.key}`}
                data-highlighted={highlightedActors.includes(actor.key) ? "true" : "false"}
                className={`rounded-md border bg-gradient-to-b from-background to-muted/30 p-3 transition-colors ${
                  highlightedActors.includes(actor.key) ? "border-primary/60 bg-primary/5 animate-pulse" : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium">{actor.label}</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="h-4 rounded-full bg-muted/70">
                      <div
                        className="flex h-4 items-center justify-end rounded-full bg-emerald-500 px-2 text-[10px] font-semibold text-emerald-50 transition-all"
                        style={{ width: `${state.loyalty}%` }}
                      >
                        {state.loyalty}%
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="h-4 rounded-full bg-muted/70">
                      <div
                        className="flex h-4 items-center justify-end rounded-full bg-rose-500 px-2 text-[10px] font-semibold text-rose-50 transition-all"
                        style={{ width: `${state.pressure}%` }}
                      >
                        {state.pressure}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {REGION_META.map((region) => {
            const stress = game.regions[region.key];
            const actorKey = REGION_ACTOR_FOCUS[region.key];
            const actor = game.actors[actorKey];
            return (
              <div
                key={region.key}
                data-testid={`region-card-${region.key}`}
                data-highlighted={highlightedRegions.includes(region.key) ? "true" : "false"}
                className={`rounded-md border p-2 text-xs ${regionClass(stress)} ${
                  highlightedRegions.includes(region.key) ? "ring-2 ring-primary/60" : ""
                } ${selectedRegion === region.key ? "ring-2 ring-cyan-500/70" : ""}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span>{region.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {stress}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {actorKey} influence: {actor.pressure}% / {actor.loyalty}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
