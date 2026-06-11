import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useForestStore, DEFAULT_CAMERA } from '@/stores/forest-store';
import * as THREE from 'three';

// Cinematic intro path: the camera starts high above the canopy, far out,
// and sweeps down into the default overview while orbiting about 60 degrees.
// Any pointer, wheel, or key input skips straight to the end. Reduced motion
// skips the intro entirely.
const INTRO_DURATION = 5.5;
const END_AZIMUTH = Math.atan2(DEFAULT_CAMERA.z, DEFAULT_CAMERA.x);
const END_RADIUS = Math.hypot(DEFAULT_CAMERA.x, DEFAULT_CAMERA.z);
const INTRO_START = {
  azimuth: END_AZIMUTH - 1.05,
  radius: 310,
  height: 170,
};
const INTRO_LOOK_START = new THREE.Vector3(0, 14, 0);
const INTRO_LOOK_END = new THREE.Vector3(0, 5, 0);

export function ForestCamera() {
  const controlsRef = useRef<any>(null);
  const cameraTarget = useForestStore((s) => s.cameraTarget);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const reducedMotion = useForestStore((s) => s.reducedMotion);
  const isLoading = useForestStore((s) => s.isLoading);
  const { camera } = useThree();

  const idleTime = useRef(0);
  const isAnimating = useRef(false);
  const animProgress = useRef(1);

  // Intro state: pending until data loads, then running, then done.
  // introRunning mirrors the ref into React state only to toggle controls.
  const introPhase = useRef<'pending' | 'running' | 'done'>('pending');
  const introT = useRef(0);
  const [introRunning, setIntroRunning] = useState(false);

  // Start and end positions for selection fly-ins
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const endLook = useRef(new THREE.Vector3());

  // Saved overview position for return
  const savedOverviewPos = useRef(new THREE.Vector3(DEFAULT_CAMERA.x, DEFAULT_CAMERA.y, DEFAULT_CAMERA.z));
  const savedOverviewLook = useRef(new THREE.Vector3(0, 5, 0));

  // Kick off the intro once loading finishes
  useEffect(() => {
    if (isLoading || introPhase.current !== 'pending') return;
    if (reducedMotion) {
      introPhase.current = 'done';
      return;
    }
    introPhase.current = 'running';
    introT.current = 0;
    setIntroRunning(true);
    camera.position.set(
      Math.cos(INTRO_START.azimuth) * INTRO_START.radius,
      INTRO_START.height,
      Math.sin(INTRO_START.azimuth) * INTRO_START.radius,
    );
  }, [isLoading, reducedMotion, camera]);

  // Any input skips the intro
  useEffect(() => {
    const skip = () => {
      if (introPhase.current === 'running') {
        introT.current = 1;
      }
    };
    window.addEventListener('pointerdown', skip);
    window.addEventListener('wheel', skip);
    window.addEventListener('keydown', skip);
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  // Camera animation on selection change
  useEffect(() => {
    if (!cameraTarget || introPhase.current === 'running') return;

    // Capture current position as animation start
    startPos.current.copy(camera.position);
    if (controlsRef.current) {
      startLook.current.copy(controlsRef.current.target);
    }

    if (selectedCompanyId) {
      // Save current overview position before zooming in
      savedOverviewPos.current.copy(camera.position);
      if (controlsRef.current) {
        savedOverviewLook.current.copy(controlsRef.current.target);
      }

      // Feature the tree: close, slightly above, offset to the side
      endPos.current.set(
        cameraTarget.x + 8,
        cameraTarget.y + 6,
        cameraTarget.z + 10,
      );
      endLook.current.set(cameraTarget.x, cameraTarget.y * 0.4, cameraTarget.z);
    } else {
      // Returning to overview: animate back to saved position
      endPos.current.copy(savedOverviewPos.current);
      endLook.current.copy(savedOverviewLook.current);
    }

    isAnimating.current = true;
    animProgress.current = 0;
  }, [cameraTarget, selectedCompanyId, camera]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // -- Cinematic intro --
    if (introPhase.current === 'running') {
      introT.current = Math.min(1, introT.current + delta / INTRO_DURATION);
      const t = easeInOutQuint(introT.current);

      const azimuth = THREE.MathUtils.lerp(INTRO_START.azimuth, END_AZIMUTH, t);
      const radius = THREE.MathUtils.lerp(INTRO_START.radius, END_RADIUS, t);
      const height = THREE.MathUtils.lerp(INTRO_START.height, DEFAULT_CAMERA.y, t);

      camera.position.set(Math.cos(azimuth) * radius, height, Math.sin(azimuth) * radius);
      controlsRef.current.target.lerpVectors(INTRO_LOOK_START, INTRO_LOOK_END, t);
      controlsRef.current.update();

      if (introT.current >= 1) {
        introPhase.current = 'done';
        setIntroRunning(false);
        camera.position.set(DEFAULT_CAMERA.x, DEFAULT_CAMERA.y, DEFAULT_CAMERA.z);
        controlsRef.current.target.copy(INTRO_LOOK_END);
        controlsRef.current.update();
      }
      return;
    }

    if (isAnimating.current && animProgress.current < 1) {
      const speed = reducedMotion ? 3.0 : 1.4;
      animProgress.current = Math.min(1, animProgress.current + delta * speed);
      const t = easeInOutCubic(animProgress.current);

      // Proper interpolation: blend from start to end
      camera.position.lerpVectors(startPos.current, endPos.current, t);
      controlsRef.current.target.lerpVectors(startLook.current, endLook.current, t);
      controlsRef.current.update();

      if (animProgress.current >= 1) {
        isAnimating.current = false;
        // Snap to exact final position
        camera.position.copy(endPos.current);
        controlsRef.current.target.copy(endLook.current);
        controlsRef.current.update();
      }
      return;
    }

    // Gentle idle breathing
    if (!reducedMotion && !isAnimating.current) {
      idleTime.current += delta * 0.12;
      camera.position.x += Math.sin(idleTime.current) * 0.006;
      camera.position.z += Math.cos(idleTime.current * 0.7) * 0.004;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!introRunning}
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

function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}
