import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { CompanyPlacement } from '@/lib/types';

interface BackgroundTreesProps {
  placements: CompanyPlacement[];
}

function pr(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const BG_COUNT = 300;
const SPREAD = 350;
const MIN_DIST_FROM_COMPANY = 8;

/**
 * Non-interactive decorative trees scattered throughout the world.
 * These fill the gaps between company trees so the scene reads
 * as a dense forest rather than sparse dots on a dark plane.
 * Low-poly, no interaction, single instanced draw call each for trunks and canopies.
 */
export function BackgroundTrees({ placements }: BackgroundTreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.15, 0.25, 1, 5), []);
  const canopyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 0);
    g.scale(1, 0.8, 1);
    return g;
  }, []);

  // Precompute positions avoiding company trees
  const positions = useMemo(() => {
    const companyPositions = placements.map((p) => [p.world_x, p.world_z] as [number, number]);
    const result: { x: number; z: number; height: number; canopyR: number; hue: number }[] = [];
    let attempts = 0;

    while (result.length < BG_COUNT && attempts < BG_COUNT * 5) {
      attempts++;
      const angle = pr(attempts * 0.37, attempts * 0.91) * Math.PI * 2;
      const radius = 12 + pr(attempts * 0.53, attempts * 0.17) * SPREAD;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Skip if too close to a real company tree
      const tooClose = companyPositions.some(
        ([cx, cz]) => Math.abs(x - cx) < MIN_DIST_FROM_COMPANY && Math.abs(z - cz) < MIN_DIST_FROM_COMPANY,
      );
      if (tooClose) continue;

      const height = 2 + pr(attempts * 0.71, attempts * 0.29) * 10;
      const canopyR = 0.8 + pr(attempts * 0.13, attempts * 0.67) * 2.5;
      const hue = pr(attempts * 0.83, attempts * 0.41);

      result.push({ x, z, height, canopyR, hue });
    }
    return result;
  }, [placements]);

  const count = positions.length;

  useEffect(() => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    if (!trunk || !canopy) return;

    const trunkColors = new Float32Array(count * 3);
    const canopyColors = new Float32Array(count * 3);
    const obj = new THREE.Object3D();
    const tc = new THREE.Color();

    positions.forEach((p, i) => {
      // Trunk
      obj.position.set(p.x, p.height * 0.5, p.z);
      obj.scale.set(1, p.height, 1);
      obj.rotation.set(0, p.hue * Math.PI * 2, 0);
      obj.updateMatrix();
      trunk.setMatrixAt(i, obj.matrix);

      tc.setRGB(0.22 + p.hue * 0.08, 0.16 + p.hue * 0.05, 0.10);
      trunkColors[i * 3] = tc.r;
      trunkColors[i * 3 + 1] = tc.g;
      trunkColors[i * 3 + 2] = tc.b;

      // Canopy
      const cY = p.height * 0.8 + p.canopyR * 0.5;
      obj.position.set(p.x, cY, p.z);
      obj.scale.set(p.canopyR, p.canopyR * 0.85, p.canopyR);
      obj.updateMatrix();
      canopy.setMatrixAt(i, obj.matrix);

      // Muted forest greens, visible against dark background
      const g = 0.10 + p.hue * 0.12;
      tc.setRGB(g * 0.5, g, g * 0.4);
      canopyColors[i * 3] = tc.r;
      canopyColors[i * 3 + 1] = tc.g;
      canopyColors[i * 3 + 2] = tc.b;
    });

    trunk.instanceColor = new THREE.InstancedBufferAttribute(trunkColors, 3);
    canopy.instanceColor = new THREE.InstancedBufferAttribute(canopyColors, 3);
    trunk.instanceMatrix.needsUpdate = true;
    canopy.instanceMatrix.needsUpdate = true;
    trunk.computeBoundingSphere();
    canopy.computeBoundingSphere();
  }, [positions, count]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, undefined, count]} frustumCulled>
        <meshStandardMaterial roughness={0.95} metalness={0} vertexColors />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[canopyGeo, undefined, count]} frustumCulled>
        <meshStandardMaterial
          roughness={0.82}
          metalness={0}
          vertexColors
          emissive="#0a2a0a"
          emissiveIntensity={0.12}
        />
      </instancedMesh>
    </group>
  );
}
