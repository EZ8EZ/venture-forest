import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useForestStore } from '@/stores/forest-store';

const COUNT = 300;
const SPREAD = 250;

// Deterministic hash so the dust field is identical on every load
// (project rule: no unseeded randomness anywhere in the scene)
function pr(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// Floating forest dust, backlit by the low sun. 300 points in one draw call;
// measured cost is negligible next to the tree meshes.
export function EnvironmentParticles() {
  const ref = useRef<THREE.Points>(null);
  const reducedMotion = useForestStore((s) => s.reducedMotion);

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (pr(i * 1.3, i * 0.7) - 0.5) * SPREAD;
      pos[i * 3 + 1] = 1 + pr(i * 0.9, i * 2.1) * 35;
      pos[i * 3 + 2] = (pr(i * 1.7, i * 0.3) - 0.5) * SPREAD;
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
        color="#ffd9a0"
        size={0.22}
        transparent
        opacity={0.22}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
