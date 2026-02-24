"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { REGION_META } from "../data";
import { getRegionLabel, type AppLanguage } from "../i18n";
import type { GameState, RegionKey } from "../types";
import { REGION_ACTOR_FOCUS } from "../region-theater-map";
import { Regions } from "./Regions";

function stressBand(stress: number, language: AppLanguage) {
  if (stress >= 85) return language === "bg" ? "Критичен" : "Critical";
  if (stress >= 70) return language === "bg" ? "Висок" : "High";
  if (stress >= 45) return language === "bg" ? "Повишен" : "Elevated";
  return language === "bg" ? "Овладян" : "Contained";
}

function actorBand(value: number) {
  if (value >= 70) return "High";
  if (value >= 45) return "Elevated";
  return "Low";
}

function labelColor(stress: number) {
  if (stress >= 85) return "bg-rose-500/90 text-white border-rose-400";
  if (stress >= 70) return "bg-orange-500/90 text-white border-orange-400";
  if (stress >= 45) return "bg-amber-500/90 text-white border-amber-400";
  return "bg-emerald-500/80 text-white border-emerald-400";
}

interface StateMeshSceneProps {
  game: GameState;
  language: AppLanguage;
  selectedRegion: RegionKey;
  highlightedRegions: RegionKey[];
  activeCrisisRegions: RegionKey[];
  queuedFalloutRegions: RegionKey[];
  onSelectRegion: (region: RegionKey) => void;
}

export function StateMeshScene({
  game,
  language,
  selectedRegion,
  highlightedRegions,
  activeCrisisRegions,
  queuedFalloutRegions,
  onSelectRegion,
}: StateMeshSceneProps) {
  const [hoveredRegion, setHoveredRegion] = useState<RegionKey | null>(null);
  const labelLayout = useMemo(
    () =>
      ({
        north: { left: "34%", top: "25%" },
        south: { left: "37%", top: "76%" },
        capital: { left: "52%", top: "48%" },
        industry: { left: "68%", top: "64%" },
        border: { left: "79%", top: "28%" },
        coast: { left: "20%", top: "58%" },
      }) as Record<RegionKey, { left: string; top: string }>,
    [],
  );

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border bg-slate-950 shadow-inner">
      <Canvas
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "low-power" }}
        camera={{ position: [5.2, 4.6, 5.8], fov: 44, near: 0.1, far: 40 }}
      >
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 10, 26]} />
        <ambientLight intensity={0.42} />
        <hemisphereLight args={["#dbeafe", "#0f172a", 0.45]} />
        <directionalLight position={[5, 8, 4]} intensity={0.75} />
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7, 6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.92} metalness={0.05} />
        </mesh>
        <Regions
          game={game}
          selectedRegion={selectedRegion}
          hoveredRegion={hoveredRegion}
          highlightedRegions={highlightedRegions}
          activeCrisisRegions={activeCrisisRegions}
          queuedFalloutRegions={queuedFalloutRegions}
          onHoverRegion={setHoveredRegion}
          onSelectRegion={onSelectRegion}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0">
        {REGION_META.map((region) => {
          const isSelected = selectedRegion === region.key;
          const isHovered = hoveredRegion === region.key;
          const isHighlighted = highlightedRegions.includes(region.key);
          const layout = labelLayout[region.key];
          const stress = game.regions[region.key];
          const actorFocus = REGION_ACTOR_FOCUS[region.key];
          const actor = game.actors[actorFocus];

          return (
            <div
              key={region.key}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-1 flex flex-col items-center justify-center transition-all duration-300 drop-shadow-md backdrop-blur-sm ${isSelected || isHovered || isHighlighted
                ? `${labelColor(stress)} scale-110 z-20`
                : "bg-slate-900/60 text-slate-300 border-white/10 z-10"
                }`}
              style={{ left: layout.left, top: layout.top }}
            >
              <div className="text-xs font-bold uppercase tracking-wider drop-shadow">
                {getRegionLabel(region.key, language)}
              </div>
              <div className="text-[10px] font-medium opacity-90">
                {stressBand(stress, language)}
              </div>

              {(isSelected || isHovered || isHighlighted) && (
                <div className="mt-1 border-t border-white/20 pt-1 text-center text-[9px] w-full">
                  <div className="font-semibold">{actorFocus.toUpperCase()}</div>
                  <div className="flex justify-between gap-2 mt-0.5 opacity-80">
                    <span>L: {actorBand(actor.loyalty)}</span>
                    <span>P: {actorBand(actor.pressure)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1">
        <p className="rounded bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-slate-100 backdrop-blur-sm">
          {language === "bg" ? "Пространствен преглед" : "Spatial Overview"}
        </p>
        <p className="rounded bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300 backdrop-blur-sm">
          {language === "bg" ? "Височина = Дестабилизация" : "Height = Destabilization"}
        </p>
      </div>
    </div>
  );
}
