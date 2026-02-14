"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACTOR_META, REGION_META } from "./data";
import { regionClass } from "./engine";
import { REGION_ACTOR_FOCUS, RegionTheaterMap } from "./region-theater-map";
import type { GameState } from "./types";

interface ActorsRegionsCardProps {
  game: GameState;
}

export function ActorsRegionsCard({ game }: ActorsRegionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actors and Regions</CardTitle>
        <CardDescription className="hidden sm:block">
          Loyalty and pressure shape region severity. Spatial stress now renders in a 3D theater.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegionTheaterMap game={game} />

        <div className="grid gap-2 lg:grid-cols-2">
          {ACTOR_META.map((actor) => {
            const state = game.actors[actor.key];
            const pressureDelta = game.lastActorPressureDelta[actor.key] ?? 0;
            const loyaltyDelta = game.lastActorLoyaltyDelta[actor.key] ?? 0;
            return (
              <div
                key={actor.key}
                className="rounded-md border bg-gradient-to-b from-background to-muted/30 p-3"
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium">{actor.label}</span>
                  <span>
                    Loyalty {state.loyalty} | Pressure {state.pressure}
                    {pressureDelta !== 0 ? ` (${pressureDelta > 0 ? "+" : ""}${pressureDelta})` : ""}
                    {loyaltyDelta !== 0 ? ` / ${loyaltyDelta > 0 ? "+" : ""}${loyaltyDelta}` : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Loyalty
                    </p>
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
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Pressure
                    </p>
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
                className={`rounded-md border p-2 text-xs ${regionClass(stress)}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span>{region.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {stress}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {actorKey} influence: pressure {actor.pressure}, loyalty {actor.loyalty}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
