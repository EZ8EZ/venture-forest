import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TERRAIN_SIZE = 800;
const SEGMENTS = 128;

export function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Gentle rolling hills with multiple frequencies
      const y =
        Math.sin(x * 0.008) * Math.cos(z * 0.008) * 3 +
        Math.sin(x * 0.02 + 1.5) * Math.cos(z * 0.015) * 1.5 +
        Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5;

      // Depression in center for the "clearing"
      const distFromCenter = Math.sqrt(x * x + z * z);
      const centerDip = Math.max(0, 1 - distFromCenter / 60) * -2;

      positions.setY(i, y + centerDip);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Subtle wind shimmer on the ground
  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = 0.02 + Math.sin(state.clock.elapsedTime * 0.5) * 0.005;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#0d1a0a"
        roughness={0.95}
        metalness={0.05}
        emissive="#0a1a05"
        emissiveIntensity={0.02}
      />
    </mesh>
  );
}
