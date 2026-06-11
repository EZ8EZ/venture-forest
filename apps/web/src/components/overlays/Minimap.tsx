import { useMemo, useEffect, useRef } from 'react';
import { useForestStore } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';
import { getSpecies } from '@/lib/species-config';
import { cameraTracker } from '@/lib/camera-tracker';

const MAP_SIZE = 140;
const WORLD_RADIUS = 300;

function toMap(world: number): number {
  return ((world / WORLD_RADIUS) * MAP_SIZE) / 2 + MAP_SIZE / 2;
}

// Camera position and heading marker, updated by mutating the SVG group's
// transform on a rAF loop; reading cameraTracker keeps this fully outside
// the React render cycle
function CameraMarker() {
  const groupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const g = groupRef.current;
      if (g) {
        const x = toMap(Math.max(-WORLD_RADIUS, Math.min(WORLD_RADIUS, cameraTracker.x)));
        const y = toMap(Math.max(-WORLD_RADIUS, Math.min(WORLD_RADIUS, cameraTracker.z)));
        const deg = (cameraTracker.heading * 180) / Math.PI;
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <g ref={groupRef} pointerEvents="none">
      {/* View cone pointing along the camera heading */}
      <path d="M 0 0 L -5 12 A 13 13 0 0 0 5 12 Z" fill="#6EE7B7" opacity={0.25} />
      <circle r={2.5} fill="#6EE7B7" stroke="#0a0c10" strokeWidth={1} />
    </g>
  );
}

export function Minimap() {
  const showMinimap = useForestStore((s) => s.showMinimap);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const { data: snapshot } = useSnapshot();

  const dots = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.placements.map((p) => {
      const x = toMap(p.world_x);
      const y = toMap(p.world_z);
      const species = getSpecies(p.species_type);
      return {
        id: p.company_id,
        x,
        y,
        color: species.canopyColor,
        size: Math.max(2, p.visual_importance_score * 4),
        worldX: p.world_x,
        worldY: p.elevation + p.tree_height,
        worldZ: p.world_z,
      };
    });
  }, [snapshot]);

  if (!showMinimap || !snapshot) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="glass-panel p-2" style={{ width: MAP_SIZE + 16, height: MAP_SIZE + 16 }}>
        <div className="relative" style={{ width: MAP_SIZE, height: MAP_SIZE }}>
          {/* Background */}
          <div className="absolute inset-0 rounded-md bg-[rgba(5,8,5,0.6)]" />

          {/* Company dots */}
          <svg width={MAP_SIZE} height={MAP_SIZE} className="absolute inset-0">
            {dots.map((dot) => (
              <circle
                key={dot.id}
                cx={dot.x}
                cy={dot.y}
                r={dot.size}
                fill={dot.id === selectedCompanyId ? '#6EE7B7' : dot.color}
                opacity={dot.id === selectedCompanyId ? 1 : 0.5}
                className="cursor-pointer transition-opacity hover:opacity-100"
                onClick={() => {
                  selectCompany(dot.id);
                  setCameraTarget({ x: dot.worldX, y: dot.worldY, z: dot.worldZ });
                }}
              />
            ))}
            <CameraMarker />
          </svg>
        </div>
      </div>
    </div>
  );
}
