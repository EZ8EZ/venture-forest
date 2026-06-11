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
  const hoveredCompanyId = useForestStore((s) => s.hoveredCompanyId);

  const visibleLabels = useMemo(() => {
    if (!showLabels) return [];

    const items = placements
      .map((p, i) => ({ placement: p, company: companies[i] }))
      .filter((item) => item.company && item.placement);

    // Always show selected and hovered
    const result: typeof items = [];
    const shown = new Set<string>();

    // Selected company
    if (selectedCompanyId) {
      const sel = items.find((t) => t.company.id === selectedCompanyId);
      if (sel) { result.push(sel); shown.add(sel.company.id); }
    }

    // Hovered company
    if (hoveredCompanyId && !shown.has(hoveredCompanyId)) {
      const hov = items.find((t) => t.company.id === hoveredCompanyId);
      if (hov) { result.push(hov); shown.add(hov.company.id); }
    }

    // Top 6 landmark companies by visual importance
    const sorted = [...items].sort(
      (a, b) => b.placement.visual_importance_score - a.placement.visual_importance_score,
    );
    for (const item of sorted) {
      if (result.length >= 8) break;
      if (!shown.has(item.company.id)) {
        result.push(item);
        shown.add(item.company.id);
      }
    }

    return result;
  }, [placements, companies, showLabels, selectedCompanyId, hoveredCompanyId]);

  if (!showLabels || visibleLabels.length === 0) return null;

  return (
    <group>
      {visibleLabels.map(({ placement: p, company: c }) => {
        const isSelected = c.id === selectedCompanyId;
        const isHovered = c.id === hoveredCompanyId;
        const isLandmark = p.visual_importance_score > 0.6;

        return (
          <Html
            key={c.id}
            position={[
              p.world_x,
              p.elevation + p.tree_height + p.trunk_radius * 2.5 + 3,
              p.world_z,
            ]}
            center
            distanceFactor={isSelected ? 55 : isHovered ? 60 : 80}
            occlude={false}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div
              className={`
                whitespace-nowrap rounded transition-all duration-200
                ${isSelected
                  ? 'px-2.5 py-1 text-xs font-semibold bg-overlay-accent/20 text-overlay-accent border border-overlay-accent/40 shadow-lg shadow-overlay-accent/10'
                  : isHovered
                    ? 'px-2 py-0.5 text-[11px] font-medium bg-overlay-bg/70 text-overlay-text/90 border border-overlay-border'
                    : isLandmark
                      ? 'px-1.5 py-0.5 text-[10px] font-medium bg-overlay-bg/40 text-overlay-text/50 border border-transparent'
                      : 'px-1.5 py-0.5 text-[10px] bg-overlay-bg/25 text-overlay-text/35 border border-transparent'}
              `}
            >
              {c.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
