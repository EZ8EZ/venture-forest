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
      shadows={quality === 'high'}
      style={{ position: 'absolute', inset: 0 }}
      camera={{ fov: 55, near: 0.5, far: 1500, position: [0, 80, 120] }}
    >
      <color attach="background" args={['#0a0c10']} />
      <fog attach="fog" args={['#0a0c10', 100, 600]} />

      <Suspense fallback={null}>
        <ForestCamera />
        <ForestLighting />
        <ForestWorld />
        {quality !== 'low' && <ForestPostProcessing />}
      </Suspense>
    </Canvas>
  );
}
