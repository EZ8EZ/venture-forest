import { useMemo } from 'react';
import * as THREE from 'three';

const SIZE = 800;
const SEGS = 200;

function pr(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c1 = new THREE.Color('#142a10');
    const c2 = new THREE.Color('#0c1e0a');
    const c3 = new THREE.Color('#1c3214');
    const tc = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Multi-octave rolling terrain
      const y =
        Math.sin(x * 0.006) * Math.cos(z * 0.006) * 4.0 +
        Math.sin(x * 0.018 + 1.5) * Math.cos(z * 0.014) * 2.0 +
        Math.sin(x * 0.045 + 0.7) * Math.cos(z * 0.038) * 0.8 +
        Math.sin(x * 0.09) * Math.cos(z * 0.09) * 0.25;

      const dist = Math.sqrt(x * x + z * z);
      const centerDip = Math.max(0, 1 - dist / 50) * -1.5;
      pos.setY(i, y + centerDip);

      // Vertex color variation for forest-floor richness
      const n = pr(x * 0.05, z * 0.05);
      tc.copy(n < 0.3 ? c2 : n < 0.7 ? c1 : c3);
      tc.lerp(new THREE.Color('#081408'), Math.min(1, dist / 350) * 0.3);
      colors[i * 3] = tc.r;
      colors[i * 3 + 1] = tc.g;
      colors[i * 3 + 2] = tc.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.95}
          metalness={0}
          emissive="#0a1606"
          emissiveIntensity={0.1}
        />
      </mesh>
      <GroundCover />
    </group>
  );
}

// Scattered patches on the forest floor for texture and grounding
function GroundCover() {
  const COUNT = 500;
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(1, 5);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const { matrices, colors } = useMemo(() => {
    const m = new Float32Array(COUNT * 16);
    const c = new Float32Array(COUNT * 3);
    const obj = new THREE.Object3D();
    const tc = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      const angle = pr(i * 0.37, i * 0.91) * Math.PI * 2;
      const radius = 8 + pr(i * 0.53, i * 0.17) * 300;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.5 + pr(i * 0.71, i * 0.29) * 3.0;

      obj.position.set(x, 0.06, z);
      obj.scale.set(scale, 1, scale);
      obj.rotation.set(0, pr(i * 0.13, i * 0.67) * Math.PI, 0);
      obj.updateMatrix();
      obj.matrix.toArray(m, i * 16);

      const b = 0.015 + pr(i * 0.83, i * 0.41) * 0.035;
      tc.setRGB(b * 0.6, b, b * 0.45);
      c[i * 3] = tc.r;
      c[i * 3 + 1] = tc.g;
      c[i * 3 + 2] = tc.b;
    }
    return { matrices: m, colors: c };
  }, []);

  return (
    <instancedMesh args={[geo, undefined, COUNT]} frustumCulled={false}>
      <instancedBufferAttribute attach="instanceMatrix" array={matrices} count={COUNT} itemSize={16} />
      <instancedBufferAttribute attach="instanceColor" array={colors} count={COUNT} itemSize={3} />
      <meshStandardMaterial
        vertexColors
        roughness={1}
        metalness={0}
        transparent
        opacity={0.3}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
