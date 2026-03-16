import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useForestStore } from '@/stores/forest-store';

const PARTICLE_COUNT = 200;
const SPREAD = 300;

export function EnvironmentParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const reducedMotion = useForestStore((s) => s.reducedMotion);

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = Math.random() * 40 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || reducedMotion) return;
    const t = state.clock.elapsedTime;

    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;

      // Gentle floating motion
      pos.array[iy] += Math.sin(t * 0.3 + i) * 0.01;
      pos.array[ix] += Math.cos(t * 0.2 + i * 0.5) * 0.005;

      // Reset if too high or too low
      if (pos.array[iy] > 50) pos.array[iy] = 2;
      if (pos.array[iy] < 1) pos.array[iy] = 40;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffeecc"
        size={0.3}
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
