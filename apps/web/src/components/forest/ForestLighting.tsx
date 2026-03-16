import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ForestLighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (!sunRef.current) return;
    const t = state.clock.elapsedTime * 0.08;
    sunRef.current.intensity = 1.8 + Math.sin(t) * 0.12;
  });

  return (
    <>
      {/* Ambient: bright enough to read tree forms in shadow */}
      <ambientLight intensity={0.7} color="#8090b0" />

      {/* Hemisphere: warm sky, green-tinted ground (lifts canopy underside) */}
      <hemisphereLight args={['#6644aa', '#1a3a1a', 0.9]} />

      {/* Main sun: warm golden hour, elevated for broad coverage */}
      <directionalLight
        ref={sunRef}
        position={[100, 80, -40]}
        intensity={1.8}
        color="#ffc87a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={350}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0002}
      />

      {/* Strong cool fill from the opposite side for readable silhouettes */}
      <directionalLight
        position={[-80, 50, 70]}
        intensity={0.65}
        color="#6688dd"
      />

      {/* Back-rim light: separates trees from background */}
      <directionalLight
        position={[0, 40, -140]}
        intensity={0.4}
        color="#aa66dd"
      />

      {/* Overhead fill: prevents pure-black canopy tops */}
      <directionalLight
        position={[0, 120, 0]}
        intensity={0.3}
        color="#88aacc"
      />

      {/* Ground-level warmth in the clearing */}
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffdd88" distance={80} decay={2} />

      {/* Scattered grove accent lights - brighter */}
      <pointLight position={[80, 12, 0]} intensity={0.3} color="#44ff88" distance={60} decay={2} />
      <pointLight position={[-80, 12, 0]} intensity={0.3} color="#4488ff" distance={60} decay={2} />
      <pointLight position={[0, 12, 80]} intensity={0.3} color="#aa44ff" distance={60} decay={2} />
    </>
  );
}
