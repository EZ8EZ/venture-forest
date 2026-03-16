import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ForestLighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  // Subtle light animation for living atmosphere
  useFrame((state) => {
    if (!sunRef.current) return;
    const t = state.clock.elapsedTime * 0.1;
    sunRef.current.intensity = 0.8 + Math.sin(t) * 0.05;
  });

  return (
    <>
      {/* Ambient base: deep twilight */}
      <ambientLight intensity={0.15} color="#1a1a2e" />

      {/* Hemisphere: sky and ground */}
      <hemisphereLight
        args={['#2d1b4e', '#0a1628', 0.4]}
      />

      {/* Main sun: low angle, warm dusk */}
      <directionalLight
        ref={sunRef}
        position={[100, 60, -80]}
        intensity={0.8}
        color="#ff9966"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
      />

      {/* Fill light: cool, opposite side */}
      <directionalLight
        position={[-60, 40, 80]}
        intensity={0.2}
        color="#4466aa"
      />

      {/* Rim light from behind for depth separation */}
      <directionalLight
        position={[0, 30, -120]}
        intensity={0.15}
        color="#6633aa"
      />

      {/* Ground-level point lights for atmosphere */}
      <pointLight position={[0, 2, 0]} intensity={0.3} color="#ffaa44" distance={80} decay={2} />
    </>
  );
}
