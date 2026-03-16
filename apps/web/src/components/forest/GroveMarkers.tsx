import { Html } from '@react-three/drei';
import type { Grove } from '@/lib/types';
import { SPECIES_MAP } from '@/lib/species-config';

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
            {/* Subtle ground circle to hint at grove boundary */}
            <mesh
              position={[grove.center_x, 0.05, grove.center_z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[grove.radius * 0.8, grove.radius, 64]} />
              <meshBasicMaterial
                color={species?.canopyColor || '#333'}
                transparent
                opacity={0.04}
              />
            </mesh>

            {/* Grove label */}
            <Html
              position={[grove.center_x, 1, grove.center_z + grove.radius * 0.7]}
              center
              distanceFactor={200}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div className="whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-overlay-muted/40">
                {grove.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
