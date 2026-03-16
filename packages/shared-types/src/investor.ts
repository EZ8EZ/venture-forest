import { InvestorType } from "./enums.js";

export interface Investor {
  id: string;
  slug: string;
  name: string;
  type: InvestorType;
  website: string | null;
  description: string | null;
  location: string | null;
  external_source_url: string | null;
}
