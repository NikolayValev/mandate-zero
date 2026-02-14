"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { REGION_ACTOR_FOCUS } from "../region-theater-map";
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

interface RegionBlockProps {
  region: RegionKey;
  game: GameState;
  selectedRegion: RegionKey;
  hoveredRegion: RegionKey | null;
  highlightedRegions: RegionKey[];
  activeCrisisRegions: RegionKey[];
  queuedFalloutRegions: RegionKey[];
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
          onHoverRegion={onHoverRegion}
          onSelectRegion={onSelectRegion}
        />
      ))}
    </group>
  );
}
