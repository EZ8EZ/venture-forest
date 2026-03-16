import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { CompanyPlacement, Company } from '@/lib/types';
import { useForestStore } from '@/stores/forest-store';

interface ForestLabelsProps {
  placements: CompanyPlacement[];
  companies: Company[];
}

export function ForestLabels({ placements, companies }: ForestLabelsProps) {
  const showLabels = useForestStore((s) => s.showLabels);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);

  // Only show labels for top companies by visual importance, plus selected
  const visibleLabels = useMemo(() => {
    if (!showLabels) return [];

    const sorted = placements
      .map((p, i) => ({ placement: p, company: companies[i] }))
      .filter((item) => item.company && item.placement)
      .sort((a, b) => b.placement.visual_importance_score - a.placement.visual_importance_score);

    // Show top 20 most important + selected
    const top = sorted.slice(0, 20);
    if (selectedCompanyId && !top.find((t) => t.company.id === selectedCompanyId)) {
      const selected = sorted.find((t) => t.company.id === selectedCompanyId);
      if (selected) top.push(selected);
    }

    return top;
  }, [placements, companies, showLabels, selectedCompanyId]);

  if (!showLabels || visibleLabels.length === 0) return null;

  return (
    <group>
      {visibleLabels.map(({ placement, company }) => (
        <Html
          key={company.id}
          position={[
            placement.world_x,
            placement.elevation + placement.tree_height + placement.trunk_radius * 3 + 4,
            placement.world_z,
          ]}
          center
          distanceFactor={80}
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            className={`
              whitespace-nowrap px-2 py-0.5 rounded text-xs font-medium
              transition-opacity duration-300
              ${company.id === selectedCompanyId
                ? 'bg-overlay-accent/20 text-overlay-accent border border-overlay-accent/30'
                : 'bg-overlay-bg/60 text-overlay-text/80 border border-overlay-border'}
            `}
          >
            {company.name}
          </div>
        </Html>
      ))}
    </group>
  );
}
