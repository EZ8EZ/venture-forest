import { useMemo } from 'react';
import { useSnapshot } from '@/hooks/useSnapshot';
import { useForestStore } from '@/stores/forest-store';
import { Terrain } from './Terrain';
import { TreeInstances } from './TreeInstances';
import { ForestLabels } from './ForestLabels';
import { GroveMarkers } from './GroveMarkers';
import { InvestorRoots } from './InvestorRoots';
import { EnvironmentParticles } from './EnvironmentParticles';
import type { Company } from '@/lib/types';

export function ForestWorld() {
  const { data: snapshot, isLoading } = useSnapshot();
  const filters = useForestStore((s) => s.filters);

  // Build company lookup and placement index
  const { companyIds, placementIndex, companiesOrdered } = useMemo(() => {
    if (!snapshot) return { companyIds: [], placementIndex: new Map(), companiesOrdered: [] };

    const index = new Map<string, number>();
    const ids: string[] = [];
    const ordered: Company[] = [];

    snapshot.placements.forEach((p, i) => {
      index.set(p.company_id, i);
      ids.push(p.company_id);
      const company = snapshot.companies.find((c) => c.id === p.company_id);
      if (company) ordered.push(company);
    });

    return { companyIds: ids, placementIndex: index, companiesOrdered: ordered };
  }, [snapshot]);

  // Compute filtered set
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

  if (isLoading || !snapshot) return <Terrain />;

  return (
    <group>
      <Terrain />
      <TreeInstances
        placements={snapshot.placements}
        companyIds={companyIds}
        filteredIds={filteredIds}
      />
      <ForestLabels
        placements={snapshot.placements}
        companies={companiesOrdered}
      />
      <GroveMarkers groves={snapshot.groves} />
      <InvestorRoots
        edges={snapshot.edges}
        placements={snapshot.placements}
        placementIndex={placementIndex}
      />
      <EnvironmentParticles />
    </group>
  );
}
