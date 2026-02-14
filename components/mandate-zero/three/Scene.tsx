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
          highlightedRegions={highlightedRegions}
          activeCrisisRegions={activeCrisisRegions}
          queuedFalloutRegions={queuedFalloutRegions}
          onSelectRegion={onSelectRegion}
        />
      </Canvas>
    </div>
  );
}
