import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useForestStore } from '@/stores/forest-store';

const COUNT = 300;
const SPREAD = 250;

export function EnvironmentParticles() {
  const ref = useRef<THREE.Points>(null);
  const reducedMotion = useForestStore((s) => s.reducedMotion);

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = 1 + Math.random() * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      pos.array[iy] += Math.sin(t * 0.25 + i) * 0.008;
      pos.array[ix] += Math.cos(t * 0.15 + i * 0.5) * 0.004;
      if (pos.array[iy] > 40) pos.array[iy] = 1;
      if (pos.array[iy] < 0.5) pos.array[iy] = 35;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#eeddaa"
        size={0.25}
        transparent
        opacity={0.2}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
