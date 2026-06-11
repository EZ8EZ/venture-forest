import type { Company, ForestSnapshot, Sector } from './types';
import { getSpecies } from './species-config';
import { formatFunding } from './format';

// Per-sector aggregates, built once per snapshot identity (WeakMap cache,
// no invalidation logic needed) with O(1) lookups after. Feeds the rank
// lines in the tooltip and detail panel, and the sector grove panel.

export interface SectorStats {
  sector: Sector;
  count: number;
  totalFunding: number;
  medianFunding: number;
  totalHeadcountMid: number;
  topByFunding: Company[];
  rankById: Map<string, number>;
}

const cache = new WeakMap<ForestSnapshot, Map<Sector, SectorStats>>();

function headcountMid(company: Company): number {
  const { headcount_min: lo, headcount_max: hi } = company;
  if (lo != null && hi != null) return (lo + hi) / 2;
  return lo ?? hi ?? 0;
}

function buildAll(snapshot: ForestSnapshot): Map<Sector, SectorStats> {
  const bySector = new Map<Sector, Company[]>();
  for (const company of snapshot.companies) {
    const list = bySector.get(company.sector) ?? [];
    list.push(company);
    bySector.set(company.sector, list);
  }

  const stats = new Map<Sector, SectorStats>();
  for (const [sector, companies] of bySector) {
    const sorted = [...companies].sort(
      (a, b) => (b.total_funding_usd || 0) - (a.total_funding_usd || 0),
    );
    const fundings = sorted.map((c) => c.total_funding_usd || 0);
    const rankById = new Map<string, number>();
    sorted.forEach((c, i) => rankById.set(c.id, i + 1));
    stats.set(sector, {
      sector,
      count: sorted.length,
      totalFunding: fundings.reduce((s, f) => s + f, 0),
      medianFunding: fundings[Math.floor(fundings.length / 2)] ?? 0,
      totalHeadcountMid: sorted.reduce((s, c) => s + headcountMid(c), 0),
      topByFunding: sorted,
      rankById,
    });
  }
  return stats;
}

export function getSectorStats(snapshot: ForestSnapshot, sector: Sector): SectorStats | null {
  let all = cache.get(snapshot);
  if (!all) {
    all = buildAll(snapshot);
    cache.set(snapshot, all);
  }
  return all.get(sector) ?? null;
}

// "#3 of 41 in AI & Machine Learning | 2.4x sector median"
export function getCompanyRankLine(snapshot: ForestSnapshot, company: Company): string | null {
  const stats = getSectorStats(snapshot, company.sector);
  if (!stats) return null;
  const rank = stats.rankById.get(company.id);
  if (!rank) return null;
  let line = `#${rank} of ${stats.count} in ${getSpecies(company.sector).label}`;
  if (stats.medianFunding > 0 && company.total_funding_usd > 0) {
    const multiple = company.total_funding_usd / stats.medianFunding;
    line += ` | ${multiple >= 10 ? multiple.toFixed(0) : multiple.toFixed(1)}x sector median`;
  }
  return line;
}

export function formatSectorTotal(stats: SectorStats): string {
  return formatFunding(stats.totalFunding);
}
