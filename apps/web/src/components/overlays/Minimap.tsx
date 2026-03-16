import { useMemo } from 'react';
import { useForestStore } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';
import { getSpecies } from '@/lib/species-config';

const MAP_SIZE = 140;
const WORLD_RADIUS = 300;

export function Minimap() {
  const showMinimap = useForestStore((s) => s.showMinimap);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const { data: snapshot } = useSnapshot();

  const dots = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.placements.map((p) => {
      const x = ((p.world_x / WORLD_RADIUS) * MAP_SIZE) / 2 + MAP_SIZE / 2;
      const y = ((p.world_z / WORLD_RADIUS) * MAP_SIZE) / 2 + MAP_SIZE / 2;
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
          </svg>
        </div>
      </div>
    </div>
  );
}
