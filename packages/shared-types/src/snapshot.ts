import { Company } from "./company.js";
import { Investor } from "./investor.js";
import { FundingRound } from "./funding-round.js";
import { CompanyInvestorEdge } from "./edges.js";
import { CompanyPlacement, Grove } from "./placement.js";

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
