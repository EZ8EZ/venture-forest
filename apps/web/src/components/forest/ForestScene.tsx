import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { ForestWorld } from './ForestWorld';
import { ForestCamera } from './ForestCamera';
import { ForestLighting } from './ForestLighting';
import { ForestPostProcessing } from './ForestPostProcessing';
import { useForestStore } from '@/stores/forest-store';

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
      camera={{ fov: 50, near: 0.5, far: 1200, position: [40, 25, 60] }}
    >
      {/* Deep forest twilight background */}
      <color attach="background" args={['#060c14']} />
      <fog attach="fog" args={['#060c14', 60, 450]} />

      <Suspense fallback={null}>
        <ForestCamera />
        <ForestLighting />
        <ForestWorld />
        {quality !== 'low' && <ForestPostProcessing />}
      </Suspense>
    </Canvas>
  );
}
