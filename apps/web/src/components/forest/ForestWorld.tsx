import { useMemo } from 'react';
import { useSnapshot } from '@/hooks/useSnapshot';
import { useForestStore } from '@/stores/forest-store';
import { Terrain } from './Terrain';
import { TreeInstances } from './TreeInstances';
// Background trees removed per user request
import { ForestLabels } from './ForestLabels';
import { GroveMarkers } from './GroveMarkers';
import { EnvironmentParticles } from './EnvironmentParticles';
import type { Company, Grove } from '@/lib/types';

// Vintage grove centers for year-based grouping
const VINTAGE_GROVES: Record<number, { cx: number; cz: number }> = {
  2020: { cx: -55, cz: -45 },
  2021: { cx: 0, cz: -55 },
  2022: { cx: 55, cz: -45 },
  2023: { cx: -55, cz: 10 },
  2024: { cx: 0, cz: 0 },
  2025: { cx: 55, cz: 10 },
  2026: { cx: 0, cz: 55 },
};

function pseudoRandom(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function ForestWorld() {
  const { data: snapshot, isLoading } = useSnapshot();
  const filters = useForestStore((s) => s.filters);
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const viewMode = useForestStore((s) => s.viewMode);
  const groupingMode = useForestStore((s) => s.groupingMode);

  // Compute placements based on grouping mode
  const effectivePlacements = useMemo(() => {
    if (!snapshot) return [];
    if (groupingMode === 'sector') return snapshot.placements;

    // Vintage mode: reposition trees into year-based groves
    return snapshot.placements.map((p) => {
      const company = snapshot.companies.find((c) => c.id === p.company_id);
      const year = company?.founded_year || 2023;
      const grove = VINTAGE_GROVES[year] || VINTAGE_GROVES[2023];

      // Deterministic scatter within vintage grove
      const hash1 = pseudoRandom(p.world_x * 1.1, p.world_z * 0.9);
      const hash2 = pseudoRandom(p.world_z * 1.3, p.world_x * 0.7);
      const angle = hash1 * Math.PI * 2;
      const radius = 5 + hash2 * 22;

      return {
        ...p,
        world_x: grove.cx + Math.cos(angle) * radius,
        world_z: grove.cz + Math.sin(angle) * radius,
      };
    });
  }, [snapshot, groupingMode]);

  // Vintage groves for GroveMarkers
  const vintageGroves = useMemo((): Grove[] => {
    if (!snapshot || groupingMode !== 'vintage') return [];
    const yearSet = new Set<number>();
    snapshot.companies.forEach((c) => {
      if (c.founded_year) yearSet.add(c.founded_year);
    });
    return Array.from(yearSet)
      .sort()
      .map((year) => {
        const grove = VINTAGE_GROVES[year] || VINTAGE_GROVES[2023];
        return {
          id: `vintage-${year}`,
          sector: 'OTHER' as const,
          center_x: grove.cx,
          center_z: grove.cz,
          radius: 30,
          label: `${year}`,
        };
      });
  }, [snapshot, groupingMode]);

  const { companyIds, companiesOrdered } = useMemo(() => {
    if (!snapshot) return { companyIds: [], companiesOrdered: [] };

    const ids: string[] = [];
    const ordered: Company[] = [];

    effectivePlacements.forEach((p) => {
      ids.push(p.company_id);
      const company = snapshot.companies.find((c) => c.id === p.company_id);
      if (company) ordered.push(company);
    });

    return { companyIds: ids, companiesOrdered: ordered };
  }, [snapshot, effectivePlacements]);

  // Filter logic
  const filteredIds = useMemo(() => {
    if (!snapshot) return undefined;

    const hasFilters =
      filters.sectors.length > 0 ||
      filters.fundingMin !== null ||
      filters.fundingMax !== null ||
      filters.headcountBuckets.length > 0 ||
      filters.foundedAfter !== null ||
      filters.foundedBefore !== null ||
      filters.statuses.length > 0 ||
      filters.countries.length > 0 ||
      filters.searchQuery.length > 0;

    if (!hasFilters) return undefined;

    const matching = new Set<string>();
    snapshot.companies.forEach((c) => {
      let pass = true;
      if (filters.sectors.length > 0 && !filters.sectors.includes(c.sector)) pass = false;
      if (filters.fundingMin !== null && c.total_funding_usd < filters.fundingMin) pass = false;
      if (filters.fundingMax !== null && c.total_funding_usd > filters.fundingMax) pass = false;
      if (filters.headcountBuckets.length > 0 && c.headcount_bucket && !filters.headcountBuckets.includes(c.headcount_bucket)) pass = false;
      if (filters.foundedAfter !== null && c.founded_year && c.founded_year < filters.foundedAfter) pass = false;
      if (filters.foundedBefore !== null && c.founded_year && c.founded_year > filters.foundedBefore) pass = false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(c.status)) pass = false;
      if (filters.countries.length > 0 && c.hq_country && !filters.countries.includes(c.hq_country)) pass = false;
      if (filters.searchQuery && !c.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) pass = false;
      if (pass) matching.add(c.id);
    });

    return matching;
  }, [snapshot, filters]);

  // Investor portfolio highlighting
  const highlightedIds = useMemo(() => {
    if (!snapshot || !selectedInvestorId || viewMode !== 'investor') return undefined;
    const portfolioIds = new Set<string>();
    snapshot.edges
      .filter((e) => e.investor_id === selectedInvestorId)
      .forEach((e) => portfolioIds.add(e.company_id));
    return portfolioIds.size > 0 ? portfolioIds : undefined;
  }, [snapshot, selectedInvestorId, viewMode]);

  if (isLoading || !snapshot) return <Terrain />;

  const groves = groupingMode === 'sector' ? snapshot.groves : vintageGroves;

  return (
    <group>
      <Terrain />
      {/* Background trees removed: only real company trees render */}
      <TreeInstances
        placements={effectivePlacements}
        companyIds={companyIds}
        filteredIds={filteredIds}
        highlightedIds={highlightedIds}
      />
      <ForestLabels
        placements={effectivePlacements}
        companies={companiesOrdered}
      />
      <GroveMarkers groves={groves} />
      <EnvironmentParticles />
    </group>
  );
}
