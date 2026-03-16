import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ForestLighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (!sunRef.current) return;
    const t = state.clock.elapsedTime * 0.08;
    sunRef.current.intensity = 2.2 + Math.sin(t) * 0.15;
  });

  return (
    <>
      {/* Ambient: strong base so no tree is invisible */}
      <ambientLight intensity={1.1} color="#a0b8dd" />

      {/* Hemisphere: warm sky, green ground (lifts canopy underside) */}
      <hemisphereLight args={['#8877cc', '#3a5a3a', 1.2]} />

      {/* Main sun: warm golden hour, high angle for broad coverage */}
      <directionalLight
        ref={sunRef}
        position={[100, 100, -30]}
        intensity={2.5}
        color="#ffd088"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={350}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0002}
      />

      {/* Strong cool fill from opposite side */}
      <directionalLight
        position={[-80, 60, 70]}
        intensity={1.0}
        color="#7799ee"
      />

      {/* Back-rim light: separates trees from background */}
      <directionalLight
        position={[0, 50, -140]}
        intensity={0.6}
        color="#bb88ee"
      />

      {/* Overhead fill: prevents dark canopy tops */}
      <directionalLight
        position={[0, 140, 0]}
        intensity={0.6}
        color="#99bbdd"
      />

      {/* Ground-level warmth */}
      <pointLight position={[0, 6, 0]} intensity={1.0} color="#ffdd88" distance={100} decay={2} />

      {/* Grove accent lights */}
      <pointLight position={[80, 15, 0]} intensity={0.4} color="#55ff99" distance={70} decay={2} />
      <pointLight position={[-80, 15, 0]} intensity={0.4} color="#5599ff" distance={70} decay={2} />
      <pointLight position={[0, 15, 80]} intensity={0.4} color="#bb55ff" distance={70} decay={2} />
    </>
  );
}
