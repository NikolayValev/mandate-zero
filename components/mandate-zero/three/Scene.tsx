"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { REGION_META } from "../data";
import { getRegionLabel, type AppLanguage } from "../i18n";
import type { GameState, RegionKey } from "../types";
import { Regions } from "./Regions";

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
  const activeRegion = hoveredRegion ?? selectedRegion;
  const labelLayout = useMemo(
    () =>
      ({
        north: { left: "34%", top: "30%" },
        south: { left: "37%", top: "76%" },
        capital: { left: "52%", top: "48%" },
        industry: { left: "68%", top: "64%" },
        border: { left: "79%", top: "33%" },
        coast: { left: "20%", top: "58%" },
      }) as Record<RegionKey, { left: string; top: string }>,
    [],
  );

  return (
    <div className="relative h-[220px] w-full overflow-hidden rounded-lg border bg-slate-950">
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
          return (
            <div
              key={region.key}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                isSelected
                  ? "bg-cyan-500/85 text-cyan-950"
                  : isHovered
                    ? "bg-slate-100/85 text-slate-900"
                    : isHighlighted
                      ? "bg-amber-300/85 text-amber-950"
                      : "bg-slate-900/70 text-slate-200"
              }`}
              style={{ left: layout.left, top: layout.top }}
            >
              {getRegionLabel(region.key, language)}
            </div>
          );
        })}
      </div>
      <p className="pointer-events-none absolute bottom-1 left-2 rounded bg-slate-900/75 px-2 py-0.5 text-[10px] text-slate-200">
        {language === "bg" ? "Фокус:" : "Focus:"} {getRegionLabel(activeRegion, language)}
      </p>
    </div>
  );
}
