import { RoundType } from "./enums.js";

export interface FundingRound {
  id: string;
  company_id: string;
  round_type: RoundType;
  announced_date: string | null;
  amount_usd: number | null;
  lead_investor_ids: string[];
  investor_ids: string[];
}
