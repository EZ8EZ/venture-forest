import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Grove } from '@/lib/types';
import { SPECIES_MAP } from '@/lib/species-config';
import * as THREE from 'three';

interface GroveMarkersProps {
  groves: Grove[];
}

export function GroveMarkers({ groves }: GroveMarkersProps) {
  return (
    <group>
      {groves.map((grove) => {
        const species = SPECIES_MAP[grove.sector];
        return (
          <group key={grove.id}>
            {/* Subtle ground tint under each grove */}
            <GroveGround
              x={grove.center_x}
              z={grove.center_z}
              radius={grove.radius}
              color={species?.canopyColor || '#333'}
            />

            {/* Grove sector label: very subtle, far-distance only */}
            <Html
              position={[grove.center_x, 0.5, grove.center_z + grove.radius * 0.6]}
              center
              distanceFactor={300}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.25em] text-overlay-muted/25">
                {grove.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function GroveGround({ x, z, radius, color }: { x: number; z: number; radius: number; color: string }) {
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(radius, 48);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [radius]);

  return (
    <mesh geometry={geo} position={[x, 0.03, z]}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.025}
        roughness={1}
        metalness={0}
        depthWrite={false}
      />
    </mesh>
  );
}
