"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { type AppLanguage } from "../i18n";
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

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border bg-slate-950 shadow-inner">
      <Canvas
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "low-power" }}
        camera={{ position: [5.2, 4.6, 5.8], fov: 44, near: 0.1, far: 40 }}
      >
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 6, 22]} />
        <ambientLight intensity={0.2} />
        <hemisphereLight args={["#bae6fd", "#020617", 0.4]} />
        <directionalLight position={[5, 10, 4]} intensity={0.9} color="#e0f2fe" castShadow />

        <Environment preset="city" environmentIntensity={0.2} />

        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 15]} />
          <meshStandardMaterial color="#0b1120" roughness={0.8} metalness={0.2} />
        </mesh>

        <ContactShadows resolution={1024} scale={15} blur={2.5} opacity={0.65} far={4} color="#000000" />
        <OrbitControls enablePan={true} enableZoom={true} minDistance={3} maxDistance={12} maxPolarAngle={Math.PI / 2.1} />
        <Regions
          game={game}
          selectedRegion={selectedRegion}
          hoveredRegion={hoveredRegion}
          highlightedRegions={highlightedRegions}
          activeCrisisRegions={activeCrisisRegions}
          queuedFalloutRegions={queuedFalloutRegions}
          language={language}
          onHoverRegion={setHoveredRegion}
          onSelectRegion={onSelectRegion}
        />

        <EffectComposer>
          <Bloom luminanceThreshold={0.4} mipmapBlur intensity={0.8} />
          <Noise opacity={0.07} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
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
