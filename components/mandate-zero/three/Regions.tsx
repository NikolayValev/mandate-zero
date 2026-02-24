"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Html } from "@react-three/drei";
import { REGION_ACTOR_FOCUS } from "../region-theater-map";
import { getRegionLabel, type AppLanguage } from "../i18n";
import type { GameState, RegionKey } from "../types";

const REGION_POSITIONS: Record<RegionKey, [number, number]> = {
  north: [-1.2, -1.2],
  south: [-0.9, 1.2],
  capital: [0.2, 0],
  industry: [1.3, 0.8],
  border: [1.7, -0.9],
  coast: [-1.7, 0.7],
};

function regionColor(loyalty: number, pressure: number) {
  const tension = clamp((pressure - loyalty + 100) / 200, 0, 1);
  const red = Math.round(70 + tension * 170);
  const green = Math.round(80 + (1 - tension) * 120);
  const blue = Math.round(90 + (1 - tension) * 100);
  return `rgb(${red}, ${green}, ${blue})`;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

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

interface RegionBlockProps {
  region: RegionKey;
  game: GameState;
  selectedRegion: RegionKey;
  hoveredRegion: RegionKey | null;
  highlightedRegions: RegionKey[];
  activeCrisisRegions: RegionKey[];
  queuedFalloutRegions: RegionKey[];
  language: AppLanguage;
  onHoverRegion: (region: RegionKey | null) => void;
  onSelectRegion: (region: RegionKey) => void;
}

function RegionBlock({
  region,
  game,
  selectedRegion,
  hoveredRegion,
  highlightedRegions,
  activeCrisisRegions,
  queuedFalloutRegions,
  language,
  onHoverRegion,
  onSelectRegion,
}: RegionBlockProps) {
  const groupRef = useRef<Group>(null);
  const stress = game.regions[region];
  const actor = game.actors[REGION_ACTOR_FOCUS[region]];
  const baseHeight = 0.3 + stress / 95;
  const isSelected = selectedRegion === region;
  const isHovered = hoveredRegion === region;
  const isHighlighted = highlightedRegions.includes(region);
  const isPulsing = activeCrisisRegions.includes(region) || queuedFalloutRegions.includes(region);
  const color = regionColor(actor.loyalty, actor.pressure);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    const pulse = isPulsing ? Math.sin(clock.elapsedTime * 4.4) * 0.05 : 0;
    const nextScale = baseHeight + pulse + (isSelected ? 0.12 : 0);
    groupRef.current.scale.y = nextScale;
    // Keep block bases anchored to the floor as height changes.
    groupRef.current.position.y = nextScale / 2;
  });

  const anchorHeight = 0.5 + Math.max(0, (baseHeight - 1) / 2); // Roughly on top of the box

  return (
    <group
      ref={groupRef}
      position={[REGION_POSITIONS[region][0], baseHeight / 2, REGION_POSITIONS[region][1]]}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHoverRegion(region);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onHoverRegion(null);
      }}
      onPointerDown={() => onSelectRegion(region)}
    >
      <mesh>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial
          color={color}
          emissive={isHighlighted ? "#ffffff" : isPulsing ? "#7dd3fc" : "#000000"}
          emissiveIntensity={isHighlighted ? 0.22 : isPulsing ? 0.12 : 0}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      <mesh scale={[1.04, 1.02, 1.04]}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshBasicMaterial
          color={isSelected ? "#22d3ee" : isHovered ? "#f8fafc" : "#334155"}
          wireframe
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.45}
        />
      </mesh>

      <Html
        position={[0, anchorHeight, 0]}
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
      >
        <div
          data-testid={`region-card-${region}`}
          data-highlighted={isHighlighted ? "true" : "false"}
          className={`rounded-md border px-2 py-1 flex flex-col items-center justify-center transition-all duration-300 drop-shadow-md backdrop-blur-sm ${isSelected || isHovered || isHighlighted
            ? `${labelColor(stress)} scale-110 z-20`
            : "bg-slate-900/60 text-slate-300 border-white/10 z-10"
            }`}
          style={{ pointerEvents: "none", minWidth: "120px" }}
        >
          <div className="text-xs font-bold uppercase tracking-wider drop-shadow">
            {getRegionLabel(region, language)}
          </div>
          <div className="text-[10px] font-medium opacity-90">
            {stressBand(stress, language)}
          </div>

          {(isSelected || isHovered || isHighlighted) && (
            <div className="mt-1 border-t border-white/20 pt-1 text-center text-[9px] w-full">
              <div className="font-semibold">{REGION_ACTOR_FOCUS[region].toUpperCase()}</div>
              <div className="flex justify-between gap-2 mt-0.5 opacity-80">
                <span>L: {actorBand(actor.loyalty)}</span>
                <span>P: {actorBand(actor.pressure)}</span>
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

interface RegionsProps {
  game: GameState;
  selectedRegion: RegionKey;
  hoveredRegion: RegionKey | null;
  highlightedRegions: RegionKey[];
  activeCrisisRegions: RegionKey[];
  queuedFalloutRegions: RegionKey[];
  language: AppLanguage;
  onHoverRegion: (region: RegionKey | null) => void;
  onSelectRegion: (region: RegionKey) => void;
}

export function Regions({
  game,
  selectedRegion,
  hoveredRegion,
  highlightedRegions,
  activeCrisisRegions,
  queuedFalloutRegions,
  language,
  onHoverRegion,
  onSelectRegion,
}: RegionsProps) {
  const regions = useMemo(() => Object.keys(REGION_POSITIONS) as RegionKey[], []);
  return (
    <group>
      {regions.map((region) => (
        <RegionBlock
          key={region}
          region={region}
          game={game}
          selectedRegion={selectedRegion}
          hoveredRegion={hoveredRegion}
          highlightedRegions={highlightedRegions}
          activeCrisisRegions={activeCrisisRegions}
          queuedFalloutRegions={queuedFalloutRegions}
          language={language}
          onHoverRegion={onHoverRegion}
          onSelectRegion={onSelectRegion}
        />
      ))}
    </group>
  );
}
