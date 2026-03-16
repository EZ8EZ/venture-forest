import type { ForestSnapshot } from './types';

let cachedSnapshot: ForestSnapshot | null = null;

export async function loadSnapshot(): Promise<ForestSnapshot> {
  if (cachedSnapshot) return cachedSnapshot;

  const response = await fetch('/data/demo-snapshot.json');
  if (!response.ok) {
    throw new Error(`Failed to load snapshot: ${response.status}`);
  }

  const data: ForestSnapshot = await response.json();
  cachedSnapshot = data;
  return data;
}

export function getCompanyById(snapshot: ForestSnapshot, id: string) {
  return snapshot.companies.find((c) => c.id === id);
}

export function getPlacementByCompanyId(snapshot: ForestSnapshot, id: string) {
  return snapshot.placements.find((p) => p.company_id === id);
}

export function getInvestorById(snapshot: ForestSnapshot, id: string) {
  return snapshot.investors.find((i) => i.id === id);
}

export function getCompanyInvestors(snapshot: ForestSnapshot, companyId: string) {
  const edges = snapshot.edges.filter((e) => e.company_id === companyId);
  return edges
    .map((e) => ({
      investor: snapshot.investors.find((i) => i.id === e.investor_id),
      edge: e,
    }))
    .filter((r) => r.investor != null);
}

export function getInvestorPortfolio(snapshot: ForestSnapshot, investorId: string) {
  const edges = snapshot.edges.filter((e) => e.investor_id === investorId);
  return edges
    .map((e) => ({
      company: snapshot.companies.find((c) => c.id === e.company_id),
      edge: e,
    }))
    .filter((r) => r.company != null);
}

export function getGroveById(snapshot: ForestSnapshot, groveId: string) {
  return snapshot.groves.find((g) => g.id === groveId);
}
