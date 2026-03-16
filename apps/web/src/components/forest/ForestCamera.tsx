import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useForestStore } from '@/stores/forest-store';
import * as THREE from 'three';

export function ForestCamera() {
  const controlsRef = useRef<any>(null);
  const cameraTarget = useForestStore((s) => s.cameraTarget);
  const reducedMotion = useForestStore((s) => s.reducedMotion);
  const { camera } = useThree();

  // Idle breathing animation
  const idleTime = useRef(0);
  const isAnimating = useRef(false);
  const animTarget = useRef(new THREE.Vector3());
  const animLookAt = useRef(new THREE.Vector3());
  const animProgress = useRef(1);

  useEffect(() => {
    if (!cameraTarget) return;
    isAnimating.current = true;
    animTarget.current.set(
      cameraTarget.x + 15,
      cameraTarget.y + 12,
      cameraTarget.z + 15,
    );
    animLookAt.current.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    animProgress.current = 0;
  }, [cameraTarget]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // Fly-to animation
    if (isAnimating.current && animProgress.current < 1) {
      const speed = reducedMotion ? 4 : 2;
      animProgress.current = Math.min(1, animProgress.current + delta * speed);
      const t = easeInOutCubic(animProgress.current);

      camera.position.lerp(animTarget.current, t);
      controlsRef.current.target.lerp(animLookAt.current, t);
      controlsRef.current.update();

      if (animProgress.current >= 1) {
        isAnimating.current = false;
      }
      return;
    }

    // Subtle idle drift when not interacting
    if (!reducedMotion && !isAnimating.current) {
      idleTime.current += delta * 0.15;
      const drift = Math.sin(idleTime.current) * 0.02;
      camera.position.x += drift;
      camera.position.z += Math.cos(idleTime.current * 0.7) * 0.01;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={500}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minPolarAngle={0.1}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
    />
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
