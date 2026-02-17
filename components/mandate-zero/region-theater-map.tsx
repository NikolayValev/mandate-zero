"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { clamp } from "./engine";
import { getActorLabel, getRegionLabel, type AppLanguage } from "./i18n";
import type { ActorKey, GameState, RegionKey } from "./types";

const REGION_LAYOUT: Record<
  RegionKey,
  { left: string; top: string; actorFocus: ActorKey }
> = {
  north: { left: "32%", top: "24%", actorFocus: "public" },
  south: { left: "40%", top: "76%", actorFocus: "public" },
  capital: { left: "54%", top: "44%", actorFocus: "media" },
  industry: { left: "72%", top: "62%", actorFocus: "banks" },
  border: { left: "81%", top: "32%", actorFocus: "military" },
  coast: { left: "18%", top: "56%", actorFocus: "banks" },
};

function severityTone(value: number) {
  if (value >= 85) {
    return "from-red-600/90 to-red-400/70 border-red-200/80";
  }
  if (value >= 70) {
    return "from-orange-500/90 to-orange-300/70 border-orange-100/80";
  }
  if (value >= 45) {
    return "from-yellow-500/90 to-yellow-300/70 border-yellow-100/80";
  }
  return "from-emerald-500/90 to-emerald-300/70 border-emerald-100/80";
}

function severityLabel(value: number, language: AppLanguage) {
  if (value >= 85) {
    return language === "bg" ? "Критично" : "Critical";
  }
  if (value >= 70) {
    return language === "bg" ? "Високо" : "High";
  }
  if (value >= 45) {
    return language === "bg" ? "Повишено" : "Elevated";
  }
  return language === "bg" ? "Овладяно" : "Contained";
}

function crisisAltitude(stress: number, pressure: number, loyalty: number) {
  const destabilization = stress * 0.55 + pressure * 0.35 + (100 - loyalty) * 0.1;
  return Math.round(clamp(destabilization, 0, 100) / 3);
}

export const REGION_ACTOR_FOCUS: Record<RegionKey, ActorKey> = {
  north: "public",
  south: "public",
  capital: "media",
  industry: "banks",
  border: "military",
  coast: "banks",
};

interface RegionTheaterMapProps {
  game: GameState;
  language: AppLanguage;
  highlightedRegions?: RegionKey[];
  selectedRegion?: RegionKey;
  onSelectRegion?: (region: RegionKey) => void;
}

export function RegionTheaterMap({
  game,
  language,
  highlightedRegions = [],
  selectedRegion,
  onSelectRegion,
}: RegionTheaterMapProps) {
  const regionKeys = useMemo(() => Object.keys(REGION_LAYOUT) as RegionKey[], []);
  const [internalSelectedRegion, setInternalSelectedRegion] = useState<RegionKey>("capital");
  const [isResolving, setIsResolving] = useState(false);
  const previousStressRef = useRef(game.regions);
  const activeRegion = selectedRegion ?? internalSelectedRegion;

  const handleSelectRegion = useCallback(
    (region: RegionKey) => {
      if (onSelectRegion) {
        onSelectRegion(region);
        return;
      }
      setInternalSelectedRegion(region);
    },
    [onSelectRegion],
  );

  useEffect(() => {
    if (highlightedRegions.length > 0) {
      handleSelectRegion(highlightedRegions[0]);
    }
  }, [highlightedRegions, handleSelectRegion]);

  useEffect(() => {
    let cancelled = false;
    setIsResolving(false);

    const startId = window.setTimeout(() => {
      if (!cancelled) {
        setIsResolving(true);
      }
    }, 40);

    const settleId = window.setTimeout(() => {
      if (!cancelled) {
        setIsResolving(false);
        previousStressRef.current = game.regions;
      }
    }, 760);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      window.clearTimeout(settleId);
    };
  }, [game.turn, game.regions]);

  const focusedActorKey = REGION_ACTOR_FOCUS[activeRegion];
  const focusedActor = game.actors[focusedActorKey];
  const focusedStress = game.regions[activeRegion];
  const focusedStressDelta = focusedStress - previousStressRef.current[activeRegion];
  const focusedAltitude = crisisAltitude(
    focusedStress,
    focusedActor.pressure,
    focusedActor.loyalty,
  );

  return (
    <div className="space-y-3">
      <div className="relative h-[340px] w-full overflow-hidden rounded-xl border bg-gradient-to-b from-slate-900/90 via-slate-800/80 to-slate-900/90 p-3 text-white [perspective:1200px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(14,165,233,0.28),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.2),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/20 bg-slate-900/70 [transform:rotateX(62deg)_rotateZ(-8deg)_translateY(42px)] shadow-[0_30px_80px_rgba(2,6,23,0.8)]" />
        <div
          className={`pointer-events-none absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-cyan-300/30 to-transparent blur-sm transition-all duration-700 ${
            isResolving ? "translate-y-[290px] opacity-80" : "-translate-y-24 opacity-0"
          }`}
        />

        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {regionKeys.map((regionKey) => {
            const layout = REGION_LAYOUT[regionKey];
            const stress = game.regions[regionKey];
            const previousStress = previousStressRef.current[regionKey];
            const stressDelta = stress - previousStress;
            const actor = game.actors[layout.actorFocus];
            const pressure = actor.pressure;
            const loyalty = actor.loyalty;
            const altitude = crisisAltitude(stress, pressure, loyalty);
            const isSelected = activeRegion === regionKey;
            const isHighlighted = highlightedRegions.includes(regionKey);
            const pulseClass =
              stress >= 85
                ? "animate-pulse ring-2 ring-red-100/80"
                : stress >= 70
                  ? "animate-pulse"
                  : "";

            return (
              <button
                key={regionKey}
                type="button"
                onClick={() => handleSelectRegion(regionKey)}
                className={`absolute w-[108px] -translate-x-1/2 -translate-y-1/2 text-left [transform-style:preserve-3d] transition-all duration-500 ${
                  isSelected ? "z-30" : "z-10"
                }`}
                style={{
                  left: layout.left,
                  top: layout.top,
                  transform: `translate3d(-50%, -50%, ${altitude + (isSelected ? 8 : 0) + (isResolving ? 2 : 0)}px) scale(${isSelected ? 1.06 : 1})`,
                }}
              >
                <div
                  className={`rounded-lg border bg-gradient-to-b px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.45)] ${severityTone(stress)} ${pulseClass} ${
                    isHighlighted ? "ring-2 ring-cyan-200" : ""
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide">
                    {getRegionLabel(regionKey, language)}
                  </p>
                  <p className="text-xs sm:hidden">{severityLabel(stress, language)}</p>
                  <p className="hidden text-xs sm:block">
                    Stress {stress}
                  </p>
                  <p className="hidden text-[10px] text-white/90 sm:block">
                    Pressure {pressure}% | Loyalty {loyalty}%
                  </p>
                  {stressDelta !== 0 ? (
                    <p className="mt-1 hidden text-[10px] text-white/90 sm:block">
                      {language === "bg" ? "Промяна за хода" : "Turn delta"}{" "}
                      {stressDelta > 0 ? `+${stressDelta}` : stressDelta}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="border-white/20 bg-black/30 text-white" variant="outline">
            {language === "bg" ? "3D кризисен театър" : "3D Crisis Theater"}
          </Badge>
          <Badge className="hidden border-white/20 bg-black/30 text-white sm:inline-flex" variant="outline">
            {language === "bg" ? "Височина = Дестабилизация" : "Height = Destabilization"}
          </Badge>
        </div>

        <p className="absolute bottom-2 left-3 text-[10px] text-white/70">
          {language === "bg"
            ? "Избери регионална плочка, за да прегледаш местната динамика."
            : "Click a region tile to inspect local dynamics."}
        </p>
      </div>

      <div className="rounded-lg border bg-slate-900/95 p-3 text-white">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide">
            {language === "bg" ? "Фокус върху регион" : "Region Focus"}
          </p>
          <Badge variant="outline" className="border-white/30 text-white">
            {severityLabel(focusedStress, language)}
          </Badge>
        </div>

        <p className="text-sm font-medium">{getRegionLabel(activeRegion, language)}</p>
        <p className="text-[11px] text-white/80">
          {language === "bg" ? "Натиск" : "Stress"} {focusedStress}
          {focusedStressDelta !== 0 ? ` (${focusedStressDelta > 0 ? "+" : ""}${focusedStressDelta})` : ""}
          {" | "}
          {language === "bg" ? "Височина на дестабилизация" : "Destabilization Height"} {focusedAltitude}
        </p>
        <p className="mt-1 text-[11px] text-white/80">
          {language === "bg" ? "Леща на актьора" : "Actor lens"}:{" "}
          {getActorLabel(focusedActorKey, language)} | {focusedActor.pressure}% / {focusedActor.loyalty}%
        </p>

        <div className="mt-2 space-y-2">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-white/70">
              {language === "bg" ? "Натиск" : "Pressure"}
            </p>
            <div className="h-4 rounded-full bg-white/20">
              <div
                className="flex h-4 items-center justify-end rounded-full bg-rose-400 px-2 text-[10px] font-semibold text-rose-950 transition-all"
                style={{ width: `${focusedActor.pressure}%` }}
              >
                {focusedActor.pressure}%
              </div>
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-white/70">
              {language === "bg" ? "Лоялност" : "Loyalty"}
            </p>
            <div className="h-4 rounded-full bg-white/20">
              <div
                className="flex h-4 items-center justify-end rounded-full bg-emerald-400 px-2 text-[10px] font-semibold text-emerald-950 transition-all"
                style={{ width: `${focusedActor.loyalty}%` }}
              >
                {focusedActor.loyalty}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
