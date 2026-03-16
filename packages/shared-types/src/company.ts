import { Sector, HeadcountBucket, CompanyStatus } from "./enums.js";

export interface Company {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  description: string | null;
  founded_year: number | null;
  age_years: number | null;
  hq_city: string | null;
  hq_country: string | null;
  sector: Sector;
  subsector: string | null;
  tags: string[];
  total_funding_usd: number | null;
  latest_round_type: string | null;
  latest_round_date: string | null;
  headcount_min: number | null;
  headcount_max: number | null;
  headcount_display: string | null;
  headcount_bucket: HeadcountBucket | null;
  status: CompanyStatus;
  logo_url: string | null;
  external_source_url: string | null;
  source_ids: string[];
  completeness_score: number;
  confidence_flags: Record<string, string>;
}
