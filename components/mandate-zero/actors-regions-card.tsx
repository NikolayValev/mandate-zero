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
import { getActorLabel, getRegionLabel, type AppLanguage } from "./i18n";
import { RegionTheaterMap } from "./region-theater-map";
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
  language: AppLanguage;
}

function stressBand(stress: number, language: AppLanguage) {
  if (stress >= 85) {
    return language === "bg" ? "Критичен" : "Critical";
  }
  if (stress >= 70) {
    return language === "bg" ? "Висок" : "High";
  }
  if (stress >= 45) {
    return language === "bg" ? "Повишен" : "Elevated";
  }
  return language === "bg" ? "Овладян" : "Contained";
}

function actorBand(value: number) {
  if (value >= 70) {
    return "High";
  }
  if (value >= 45) {
    return "Elevated";
  }
  return "Low";
}

export function ActorsRegionsCard({
  game,
  highlightedRegions,
  highlightedActors,
  language,
}: ActorsRegionsCardProps) {
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
        <CardTitle>{language === "bg" ? "Актьори и региони" : "Actors and Regions"}</CardTitle>
        <CardDescription className="hidden sm:block">
          {language === "bg"
            ? "Състоянието на актьорите оформя регионалната тежест. Пространственият натиск се визуализира в 3D."
            : "Actor conditions shape region severity. Spatial stress now renders in a 3D theater."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegionTheaterMap
          game={game}
          language={language}
          highlightedRegions={highlightedRegions}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
        />

        <div className="rounded-md border p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {language === "bg"
                ? "Допълнителен 3D слой. Натисни блок, за да избереш регион в същия панел."
                : "Optional 3D state layer. Tap a block to select region in the same panel."}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 px-4"
              onClick={() => setShowThreeLayer((prev) => !prev)}
            >
              {showThreeLayer
                ? language === "bg"
                  ? "Скрий 3D слой"
                  : "Hide 3D Layer"
                : language === "bg"
                  ? "Покажи 3D слой"
                  : "Show 3D Layer"}
            </Button>
          </div>
          {showThreeLayer ? (
            <div className="mt-2">
              <StateMeshScene
                game={game}
                language={language}
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
                  <span className="font-medium">{getActorLabel(actor.key, language)}</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {language === "bg" ? "Лоялност" : "Loyalty"}
                    </p>
                    <div className="h-4 rounded-full bg-muted/70">
                      <div
                        className="flex h-4 items-center justify-end rounded-full bg-emerald-500 px-2 text-[10px] font-semibold text-emerald-50 transition-all"
                        style={{ width: `${state.loyalty}%` }}
                      >
                        <span className="hidden sm:inline">{state.loyalty}%</span>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:hidden">
                      {actorBand(state.loyalty)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {language === "bg" ? "Натиск" : "Pressure"}
                    </p>
                    <div className="h-4 rounded-full bg-muted/70">
                      <div
                        className="flex h-4 items-center justify-end rounded-full bg-rose-500 px-2 text-[10px] font-semibold text-rose-50 transition-all"
                        style={{ width: `${state.pressure}%` }}
                      >
                        <span className="hidden sm:inline">{state.pressure}%</span>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:hidden">
                      {actorBand(state.pressure)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REGION_META.map((region) => {
            const stress = game.regions[region.key];
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
                  <span>{getRegionLabel(region.key, language)}</span>
                  <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                    {stress}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {language === "bg" ? "Ниво на натиск:" : "Stress band:"} {stressBand(stress, language)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
