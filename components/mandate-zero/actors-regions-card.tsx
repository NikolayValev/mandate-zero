"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACTOR_META, REGION_META } from "./data";
import { regionClass } from "./engine";
import type { GameState } from "./types";

interface ActorsRegionsCardProps {
  game: GameState;
}

export function ActorsRegionsCard({ game }: ActorsRegionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actors and Regions</CardTitle>
        <CardDescription>Loyalty and pressure determine second-order outcomes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {ACTOR_META.map((actor) => {
            const state = game.actors[actor.key];
            const pressureDelta = game.lastActorPressureDelta[actor.key] ?? 0;
            return (
              <div key={actor.key} className="rounded-md border p-2">
                <div className="flex justify-between text-xs">
                  <span>{actor.label}</span>
                  <span>
                    Loyalty {state.loyalty} | Pressure {state.pressure}
                    {pressureDelta !== 0 ? ` (${pressureDelta > 0 ? "+" : ""}${pressureDelta})` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {REGION_META.map((region) => (
            <div
              key={region.key}
              className={`rounded-md border p-2 text-xs ${regionClass(game.regions[region.key])}`}
            >
              <div className="flex justify-between">
                <span>{region.label}</span>
                <span>{game.regions[region.key]}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
