import { useMemo } from 'react';
import { useSnapshot } from '@/hooks/useSnapshot';
import { useForestStore } from '@/stores/forest-store';
import { Terrain } from './Terrain';
import { TreeInstances } from './TreeInstances';
import { InvestorRoots } from './InvestorRoots';
import { ForestLabels } from './ForestLabels';
import { GroveMarkers } from './GroveMarkers';
import { EnvironmentParticles } from './EnvironmentParticles';
import type { Company, Grove, Investor } from '@/lib/types';

// Vintage grove centers for year-based grouping, spread for ~280 trees.
// Pre-2020 vintages share the 'older' clearing.
const VINTAGE_GROVES: Record<number, { cx: number; cz: number }> = {
  2019: { cx: -95, cz: -80 },
  2020: { cx: 0, cz: -100 },
  2021: { cx: 95, cz: -80 },
  2022: { cx: -110, cz: 15 },
  2023: { cx: 0, cz: 0 },
  2024: { cx: 110, cz: 15 },
  2025: { cx: -60, cz: 95 },
  2026: { cx: 60, cz: 95 },
};
const VINTAGE_FALLBACK_YEAR = 2019;

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

    // Vintage mode: reposition trees into year-based groves. Years before
    // the first clearing collapse into it ("older" vintage).
    return snapshot.placements.map((p) => {
      const company = snapshot.companies.find((c) => c.id === p.company_id);
      const rawYear = company?.founded_year || 2023;
      const year = Math.max(VINTAGE_FALLBACK_YEAR, rawYear);
      const grove = VINTAGE_GROVES[year] || VINTAGE_GROVES[VINTAGE_FALLBACK_YEAR];

      // Deterministic scatter within vintage grove
      const hash1 = pseudoRandom(p.world_x * 1.1, p.world_z * 0.9);
      const hash2 = pseudoRandom(p.world_z * 1.3, p.world_x * 0.7);
      const angle = hash1 * Math.PI * 2;
      const radius = 8 + hash2 * 34;

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
    // Clamp founding years into the defined clearings so pre-2019
    // companies share one "older" vintage instead of stacking labels
    const yearSet = new Set<number>();
    snapshot.companies.forEach((c) => {
      if (c.founded_year) yearSet.add(Math.max(VINTAGE_FALLBACK_YEAR, c.founded_year));
    });
    return Array.from(yearSet)
      .sort()
      .map((year) => {
        const grove = VINTAGE_GROVES[year] || VINTAGE_GROVES[VINTAGE_FALLBACK_YEAR];
        return {
          id: `vintage-${year}`,
          sector: 'OTHER' as const,
          center_x: grove.cx,
          center_z: grove.cz,
          radius: 42,
          label: year === VINTAGE_FALLBACK_YEAR ? `${year} & earlier` : `${year}`,
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

  // Companies that raised within the last 6 months get a gentle canopy
  // pulse ("what's hot"). 12 months would cover over half the forest and
  // dilute the signal.
  const recentIds = useMemo(() => {
    if (!snapshot) return new Set<string>();
    const cutoff = Date.now() - 183 * 24 * 3600 * 1000;
    return new Set(
      snapshot.companies
        .filter((c) => c.latest_round_date && Date.parse(c.latest_round_date) > cutoff)
        .map((c) => c.id),
    );
  }, [snapshot]);

  // Lookup maps for the root network
  const placementIndex = useMemo(() => {
    const m = new Map<string, number>();
    effectivePlacements.forEach((p, i) => m.set(p.company_id, i));
    return m;
  }, [effectivePlacements]);

  const investorsById = useMemo(() => {
    const m = new Map<string, Investor>();
    snapshot?.investors.forEach((inv) => m.set(inv.id, inv));
    return m;
  }, [snapshot]);

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
      {/* Placements feed the terrain so soil darkens under trunks */}
      <Terrain placements={effectivePlacements} />
      <TreeInstances
        placements={effectivePlacements}
        companyIds={companyIds}
        filteredIds={filteredIds}
        highlightedIds={highlightedIds}
        recentIds={recentIds}
      />
      {/* Underground investor network, revealed on selection */}
      <InvestorRoots
        edges={snapshot.edges}
        placements={effectivePlacements}
        placementIndex={placementIndex}
        investorsById={investorsById}
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
