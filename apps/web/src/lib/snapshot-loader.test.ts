import { describe, it, expect } from 'vitest';
import {
  getCompanyById,
  getCompanyInvestors,
  getInvestorPortfolio,
  getPlacementByCompanyId,
} from './snapshot-loader';
import type { ForestSnapshot } from './types';

const snapshot: ForestSnapshot = {
  version: '1.0.0',
  generated_at: '2026-01-01T00:00:00Z',
  company_count: 2,
  companies: [
    {
      id: 'c-1',
      slug: 'alpha',
      name: 'Alpha',
      sector: 'AI_ML',
      total_funding_usd: 1_000_000,
      status: 'active',
      completeness_score: 1,
    },
    {
      id: 'c-2',
      slug: 'beta',
      name: 'Beta',
      sector: 'FINTECH',
      total_funding_usd: 2_000_000,
      status: 'active',
      completeness_score: 0.5,
    },
  ],
  investors: [
    { id: 'i-1', slug: 'fund-one', name: 'Fund One', type: 'vc' },
  ],
  funding_rounds: [],
  edges: [
    { company_id: 'c-1', investor_id: 'i-1', edge_strength: 1, role: 'lead' },
    { company_id: 'c-2', investor_id: 'i-missing', edge_strength: 1, role: 'participant' },
  ],
  placements: [
    {
      company_id: 'c-1',
      world_x: 0,
      world_z: 0,
      elevation: 0,
      radial_rank: 0,
      grove_id: 'g-1',
      tree_height: 5,
      trunk_radius: 0.3,
      species_type: 'AI_ML',
      canopy_variant: 0,
      bark_variant: 0,
      visual_importance_score: 0.5,
    },
  ],
  groves: [],
};

describe('snapshot-loader helpers', () => {
  it('finds companies and placements by id', () => {
    expect(getCompanyById(snapshot, 'c-1')?.name).toBe('Alpha');
    expect(getCompanyById(snapshot, 'nope')).toBeUndefined();
    expect(getPlacementByCompanyId(snapshot, 'c-1')?.tree_height).toBe(5);
    expect(getPlacementByCompanyId(snapshot, 'c-2')).toBeUndefined();
  });

  it('resolves company investors and drops edges to unknown investors', () => {
    const alpha = getCompanyInvestors(snapshot, 'c-1');
    expect(alpha).toHaveLength(1);
    expect(alpha[0].investor?.name).toBe('Fund One');

    // c-2 has an edge to an investor that is not in the snapshot;
    // missing data must degrade gracefully, never crash
    const beta = getCompanyInvestors(snapshot, 'c-2');
    expect(beta).toHaveLength(0);
  });

  it('resolves investor portfolios', () => {
    const portfolio = getInvestorPortfolio(snapshot, 'i-1');
    expect(portfolio).toHaveLength(1);
    expect(portfolio[0].company?.id).toBe('c-1');
  });
});
