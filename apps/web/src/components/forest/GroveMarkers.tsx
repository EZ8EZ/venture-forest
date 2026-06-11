import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Grove } from '@/lib/types';
import { SPECIES_MAP } from '@/lib/species-config';
import { useForestStore } from '@/stores/forest-store';
import * as THREE from 'three';

interface GroveMarkersProps {
  groves: Grove[];
}

export function GroveMarkers({ groves }: GroveMarkersProps) {
  const selectGrove = useForestStore((s) => s.selectGrove);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);

  return (
    <group>
      {groves.map((grove) => {
        const species = SPECIES_MAP[grove.sector];
        // Vintage groupings are synthetic groves; only real sector groves
        // open the analytics panel
        const clickable = !grove.id.startsWith('vintage-');
        return (
          <group key={grove.id}>
            {/* Subtle ground tint under each grove */}
            <GroveGround
              x={grove.center_x}
              z={grove.center_z}
              radius={grove.radius}
              color={species?.canopyColor || '#333'}
            />

            {/* Grove sector label; clickable to open sector analytics */}
            <Html
              position={[grove.center_x, 0.5, grove.center_z + grove.radius * 0.6]}
              center
              distanceFactor={300}
              style={{ pointerEvents: clickable ? 'auto' : 'none', userSelect: 'none' }}
            >
              {clickable ? (
                <button
                  onClick={() => {
                    selectGrove(grove.id);
                    setCameraTarget({
                      x: grove.center_x,
                      y: 0,
                      z: grove.center_z,
                      radius: grove.radius,
                    });
                  }}
                  aria-label={`View ${grove.label} sector`}
                  className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.25em] text-overlay-muted/25 hover:text-overlay-accent/80 transition-colors cursor-pointer bg-transparent"
                >
                  {grove.label}
                </button>
              ) : (
                <div className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.25em] text-overlay-muted/25">
                  {grove.label}
                </div>
              )}
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
