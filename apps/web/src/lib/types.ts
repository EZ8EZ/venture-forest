// Local type definitions matching the snapshot format.
// These mirror @venture-forest/shared-types but are kept self-contained
// so the web app can run without building the shared-types package first.

export type Sector =
  | 'AI_ML'
  | 'FINTECH'
  | 'CLIMATE_ENERGY'
  | 'BIOTECH'
  | 'CONSUMER'
  | 'DEVELOPER_TOOLS'
  | 'ENTERPRISE'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'OTHER';

export type HeadcountBucket =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5001+';

export type CompanyStatus = 'active' | 'acquired' | 'public' | 'closed';
export type InvestorType = 'vc' | 'angel' | 'corporate' | 'accelerator' | 'government';
export type RoundType =
  | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c'
  | 'series_d' | 'series_e' | 'series_f' | 'series_g' | 'series_h'
  | 'growth' | 'debt' | 'grant' | 'ipo' | 'acquired' | 'unknown';

export interface Company {
  id: string;
  slug: string;
  name: string;
  website?: string;
  description?: string;
  founded_year?: number;
  age_years?: number;
  hq_city?: string;
  hq_country?: string;
  sector: Sector;
  subsector?: string;
  tags?: string[];
  total_funding_usd: number;
  latest_round_type?: RoundType;
  latest_round_date?: string;
  headcount_min?: number;
  headcount_max?: number;
  headcount_display?: string;
  headcount_bucket?: HeadcountBucket;
  status: CompanyStatus;
  logo_url?: string;
  external_source_url?: string;
  source_ids?: string[];
  founders?: string[];
  completeness_score: number;
  confidence_flags?: Record<string, string>;
}

export interface Investor {
  id: string;
  slug: string;
  name: string;
  type: InvestorType;
  website?: string;
  description?: string;
  location?: string;
  external_source_url?: string;
}

export interface FundingRound {
  id: string;
  company_id: string;
  round_type: RoundType;
  announced_date?: string;
  amount_usd?: number;
  lead_investor_ids?: string[];
  investor_ids: string[];
}

export interface CompanyInvestorEdge {
  company_id: string;
  investor_id: string;
  edge_strength: number;
  role: 'lead' | 'participant' | 'unknown';
  source?: string;
}

export interface CompanyPlacement {
  company_id: string;
  world_x: number;
  world_z: number;
  elevation: number;
  radial_rank: number;
  grove_id: string;
  local_cluster_id?: string;
  tree_height: number;
  trunk_radius: number;
  species_type: Sector;
  canopy_variant: number;
  bark_variant: number;
  visual_importance_score: number;
}

export interface Grove {
  id: string;
  sector: Sector;
  center_x: number;
  center_z: number;
  radius: number;
  label: string;
}

export interface ForestSnapshot {
  version: string;
  generated_at: string;
  company_count: number;
  companies: Company[];
  investors: Investor[];
  funding_rounds: FundingRound[];
  edges: CompanyInvestorEdge[];
  placements: CompanyPlacement[];
  groves: Grove[];
}
