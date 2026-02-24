"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getScenario } from "./engine";
import { type AppLanguage } from "./i18n";
import type { GameState, RegionKey } from "./types";

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
  language: AppLanguage;
}

export function ActorsRegionsCard({
  game,
  highlightedRegions,
  language,
}: ActorsRegionsCardProps) {
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
        <CardTitle>{language === "bg" ? "Световен театър" : "World Theater"}</CardTitle>
        <CardDescription className="hidden sm:block">
          {language === "bg"
            ? "Пространствената дестабилизация се визуализира в реално време. Издърпайте, за да завъртите и приближите."
            : "Spatial destabilization is rendered in real time. Drag to rotate or zoom."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StateMeshScene
          game={game}
          language={language}
          selectedRegion={selectedRegion}
          highlightedRegions={highlightedRegions}
          activeCrisisRegions={activeScenarioTargets}
          queuedFalloutRegions={queuedFalloutRegions}
          onSelectRegion={setSelectedRegion}
        />
      </CardContent>
    </Card>
  );
}
