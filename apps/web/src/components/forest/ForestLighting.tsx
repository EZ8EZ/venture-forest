import { SUN_POSITION } from '@/lib/forest-shaders';

// Golden-hour three-point setup. One warm low-angle sun is the only shadow
// caster; a hemisphere and a faint ambient fill the shadows without
// flattening; one cool rim light separates canopies from the sky opposite
// the sun. Deliberately no point lights: fewer, stronger lights read better
// and cost less than the previous eight-light rig.
export function ForestLighting() {
  return (
    <>
      <ambientLight intensity={0.45} color="#8a9ac2" />

      {/* Warm sky above, dark forest floor below */}
      <hemisphereLight args={['#ffd0a0', '#2c3a24', 0.78]} />

      {/* The sun: low angle for long soft shadows across the forest floor */}
      <directionalLight
        position={SUN_POSITION}
        intensity={4.0}
        color="#ffb766"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={20}
        shadow-camera-far={520}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0003}
        shadow-normalBias={0.6}
      />

      {/* Cool rim from opposite the sun: separates trees from the dusk sky */}
      <directionalLight position={[-90, 45, 100]} intensity={0.35} color="#6e86c8" />
    </>
  );
}
