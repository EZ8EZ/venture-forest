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

  const idleTime = useRef(0);
  const isAnimating = useRef(false);
  const animTarget = useRef(new THREE.Vector3());
  const animLookAt = useRef(new THREE.Vector3());
  const animProgress = useRef(1);

  useEffect(() => {
    if (!cameraTarget) return;
    isAnimating.current = true;
    animTarget.current.set(
      cameraTarget.x + 12,
      cameraTarget.y + 8,
      cameraTarget.z + 12,
    );
    animLookAt.current.set(cameraTarget.x, cameraTarget.y * 0.6, cameraTarget.z);
    animProgress.current = 0;
  }, [cameraTarget]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isAnimating.current && animProgress.current < 1) {
      const speed = reducedMotion ? 4 : 2;
      animProgress.current = Math.min(1, animProgress.current + delta * speed);
      const t = easeInOutCubic(animProgress.current);

      camera.position.lerp(animTarget.current, t);
      controlsRef.current.target.lerp(animLookAt.current, t);
      controlsRef.current.update();

      if (animProgress.current >= 1) isAnimating.current = false;
      return;
    }

    // Gentle idle breathing
    if (!reducedMotion && !isAnimating.current) {
      idleTime.current += delta * 0.12;
      camera.position.x += Math.sin(idleTime.current) * 0.012;
      camera.position.z += Math.cos(idleTime.current * 0.7) * 0.008;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={5}
      maxDistance={400}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minPolarAngle={0.15}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
      target={[0, 5, 0]}
    />
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
