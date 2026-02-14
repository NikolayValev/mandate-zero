"use client";

import { Canvas } from "@react-three/fiber";
import type { GameState, RegionKey } from "../types";
import { Regions } from "./Regions";

interface StateMeshSceneProps {
  game: GameState;
  selectedRegion: RegionKey;
  highlightedRegions: RegionKey[];
  activeCrisisRegions: RegionKey[];
  queuedFalloutRegions: RegionKey[];
  onSelectRegion: (region: RegionKey) => void;
}

export function StateMeshScene({
  game,
  selectedRegion,
  highlightedRegions,
  activeCrisisRegions,
  queuedFalloutRegions,
  onSelectRegion,
}: StateMeshSceneProps) {
  return (
    <div className="h-[220px] w-full overflow-hidden rounded-lg border bg-slate-950">
      <Canvas
        orthographic
        frameloop="always"
        dpr={[1, 1.25]}
        gl={{ antialias: false, powerPreference: "low-power" }}
        camera={{ position: [0, 5.8, 0], zoom: 95, near: 0.1, far: 30 }}
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 7, 3]} intensity={0.45} />
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.95} metalness={0.05} />
        </mesh>
        <Regions
          game={game}
          selectedRegion={selectedRegion}
          highlightedRegions={highlightedRegions}
          activeCrisisRegions={activeCrisisRegions}
          queuedFalloutRegions={queuedFalloutRegions}
          onSelectRegion={onSelectRegion}
        />
      </Canvas>
    </div>
  );
}
