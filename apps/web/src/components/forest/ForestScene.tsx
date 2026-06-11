import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense } from 'react';
import { Sky, Stats } from '@react-three/drei';
import { ForestWorld } from './ForestWorld';
import { ForestCamera } from './ForestCamera';
import { ForestLighting } from './ForestLighting';
import { ForestPostProcessing } from './ForestPostProcessing';
import { useForestStore } from '@/stores/forest-store';
import { sharedUniforms, SUN_POSITION } from '@/lib/forest-shaders';

// Hidden stats panel per .claude/rules/performance.md, toggled via ?stats
const SHOW_STATS =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stats');

// Advances the single clock that drives wind sway in every tree material.
// Mutates a shared uniform; never touches React state from the render loop.
function SceneClock() {
  const reducedMotion = useForestStore((s) => s.reducedMotion);
  useFrame((state) => {
    if (!reducedMotion) {
      sharedUniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  return null;
}

export function ForestScene() {
  const quality = useForestStore((s) => s.quality);

  const dpr: [number, number] =
    quality === 'low' ? [0.75, 1] : quality === 'medium' ? [1, 1.5] : [1, 2];

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: quality !== 'low',
        powerPreference: 'high-performance',
        alpha: false,
      }}
      shadows={quality !== 'low'}
      style={{ position: 'absolute', inset: 0 }}
      camera={{ fov: 50, near: 0.5, far: 1400, position: [40, 25, 60] }}
    >
      {/* Fallback color behind the sky dome, matched to the dusk horizon */}
      <color attach="background" args={['#7d8298']} />
      {/* Fog tinted toward the hazy horizon so distant trees dissolve into sky */}
      <fog attach="fog" args={['#8a8fa4', 130, 580]} />

      <Suspense fallback={null}>
        {/* Procedural scattering sky lit from the same sun as the scene */}
        <Sky
          distance={1200}
          sunPosition={SUN_POSITION}
          turbidity={8.5}
          rayleigh={3.2}
          mieCoefficient={0.006}
          mieDirectionalG={0.88}
        />
        <SceneClock />
        <ForestCamera />
        <ForestLighting />
        <ForestWorld />
        {quality !== 'low' && <ForestPostProcessing />}
      </Suspense>
      {SHOW_STATS && <Stats />}
    </Canvas>
  );
}
