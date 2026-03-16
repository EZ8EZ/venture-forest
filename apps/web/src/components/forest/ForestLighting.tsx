import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ForestLighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (!sunRef.current) return;
    const t = state.clock.elapsedTime * 0.08;
    sunRef.current.intensity = 1.2 + Math.sin(t) * 0.08;
  });

  return (
    <>
      {/* Ambient: enough to see tree forms in shadow */}
      <ambientLight intensity={0.35} color="#1a2040" />

      {/* Hemisphere: warm sky, cool ground */}
      <hemisphereLight args={['#3d2266', '#0a1a0a', 0.6]} />

      {/* Main sun: warm dusk, low angle for long shadows */}
      <directionalLight
        ref={sunRef}
        position={[120, 50, -60]}
        intensity={1.2}
        color="#ffaa66"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={350}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0002}
      />

      {/* Cool fill from the opposite side */}
      <directionalLight
        position={[-80, 35, 70]}
        intensity={0.35}
        color="#4466cc"
      />

      {/* Warm backlight for silhouette separation */}
      <directionalLight
        position={[0, 25, -140]}
        intensity={0.2}
        color="#8844aa"
      />

      {/* Ground-level warmth in the clearing */}
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffcc66" distance={60} decay={2} />

      {/* Scattered grove accent lights */}
      <pointLight position={[80, 8, 0]} intensity={0.15} color="#44ff88" distance={50} decay={2} />
      <pointLight position={[-80, 8, 0]} intensity={0.15} color="#4488ff" distance={50} decay={2} />
      <pointLight position={[0, 8, 80]} intensity={0.15} color="#aa44ff" distance={50} decay={2} />
    </>
  );
}
