import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useForestStore, DEFAULT_CAMERA } from '@/stores/forest-store';
import { hasDeepLink } from '@/hooks/useDeepLink';
import { cameraTracker } from '@/lib/camera-tracker';
import * as THREE from 'three';

const tempDir = new THREE.Vector3();
const tempRight = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// How far the user can pan from the world origin
const PAN_BOUND = 200;

const PAN_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
]);

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
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const selectedGroveId = useForestStore((s) => s.selectedGroveId);
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

  // Kick off the intro once loading finishes. A deep link skips it: the
  // link's subject is the destination, not the forest reveal.
  useEffect(() => {
    if (isLoading || introPhase.current !== 'pending') return;
    if (reducedMotion || hasDeepLink()) {
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

  // Keyboard panning (WASD / arrows). drei's keyEvents prop is a silent
  // no-op with this three-stdlib version (connect() never registers
  // keydown), so this is a custom handler. Keys held in a ref set; the
  // movement itself happens in useFrame.
  const pressedKeys = useRef(new Set<string>());
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      );
    };
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (PAN_KEYS.has(e.code)) {
        pressedKeys.current.add(e.code);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => pressedKeys.current.delete(e.code);
    const clear = () => pressedKeys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);

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

      // Feature the tree with room to read the surrounding root network
      endPos.current.set(
        cameraTarget.x + 13,
        cameraTarget.y + 9,
        cameraTarget.z + 17,
      );
      endLook.current.set(cameraTarget.x, cameraTarget.y * 0.35, cameraTarget.z);
    } else if (selectedInvestorId) {
      // Investor mode: elevated wide view over the portfolio centroid so
      // the highlighted trees and the root network read together
      endPos.current.set(cameraTarget.x + 35, cameraTarget.y + 55, cameraTarget.z + 50);
      endLook.current.set(cameraTarget.x, 0, cameraTarget.z);
    } else if (selectedGroveId) {
      // Grove view: ~40 degree elevated framing scaled to the grove radius
      const r = cameraTarget.radius ?? 30;
      endPos.current.set(cameraTarget.x, r * 1.5, cameraTarget.z + r * 1.8);
      endLook.current.set(cameraTarget.x, 0, cameraTarget.z);
    } else {
      // Returning to overview: animate back to saved position
      endPos.current.copy(savedOverviewPos.current);
      endLook.current.copy(savedOverviewLook.current);
    }

    isAnimating.current = true;
    animProgress.current = 0;
  }, [cameraTarget, selectedCompanyId, selectedInvestorId, selectedGroveId, camera]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // Publish ground position and heading for the minimap (mutable
    // tracker, no React state)
    camera.getWorldDirection(tempDir);
    cameraTracker.x = camera.position.x;
    cameraTracker.z = camera.position.z;
    cameraTracker.heading = Math.atan2(tempDir.x, tempDir.z);

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

    // Keyboard panning along the camera's ground-plane axes; speed scales
    // with zoom distance like a map
    const keys = pressedKeys.current;
    if (keys.size > 0) {
      const controls = controlsRef.current;
      camera.getWorldDirection(tempDir);
      tempDir.y = 0;
      tempDir.normalize();
      tempRight.crossVectors(tempDir, UP).normalize();
      const dist = camera.position.distanceTo(controls.target);
      const speed = THREE.MathUtils.clamp(dist * 0.6, 8, 80) * delta;
      let dx = 0;
      let dz = 0;
      if (keys.has('ArrowUp') || keys.has('KeyW')) { dx += tempDir.x; dz += tempDir.z; }
      if (keys.has('ArrowDown') || keys.has('KeyS')) { dx -= tempDir.x; dz -= tempDir.z; }
      if (keys.has('ArrowRight') || keys.has('KeyD')) { dx += tempRight.x; dz += tempRight.z; }
      if (keys.has('ArrowLeft') || keys.has('KeyA')) { dx -= tempRight.x; dz -= tempRight.z; }
      if (dx !== 0 || dz !== 0) {
        controls.target.x += dx * speed;
        controls.target.z += dz * speed;
        camera.position.x += dx * speed;
        camera.position.z += dz * speed;
        controls.update();
      }
    }

    // Pan bounds: clamp the target and shift the camera by the same
    // correction (the exact inverse of a pan step), so hitting the edge
    // stops the view dead without fighting rotation damping
    {
      const t = controlsRef.current.target;
      const cx = THREE.MathUtils.clamp(t.x, -PAN_BOUND, PAN_BOUND);
      const cz = THREE.MathUtils.clamp(t.z, -PAN_BOUND, PAN_BOUND);
      if (cx !== t.x || cz !== t.z) {
        camera.position.x += cx - t.x;
        camera.position.z += cz - t.z;
        t.x = cx;
        t.z = cz;
      }
    }

    // Gentle idle breathing
    if (!reducedMotion && !isAnimating.current && pressedKeys.current.size === 0) {
      idleTime.current += delta * 0.12;
      camera.position.x += Math.sin(idleTime.current) * 0.006;
      camera.position.z += Math.cos(idleTime.current * 0.7) * 0.004;
      controlsRef.current.update();
    }
  });

  // Map-style controls: left-drag (and one-finger drag) PANS across the
  // ground plane so users slide to other trees without orbit-tilting;
  // rotate moves to right-drag / two-finger. screenSpacePanning must be
  // false or pan would move vertically in screen space.
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
      panSpeed={1}
      screenSpacePanning={false}
      mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      onStart={() => {
        // User input takes over from any in-flight camera animation
        // instead of fighting the target lerp
        isAnimating.current = false;
      }}
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
