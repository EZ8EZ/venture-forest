export interface CompanyInvestorEdge {
  company_id: string;
  investor_id: string;
  edge_strength: number;
  role: "lead" | "participant" | "unknown";
  source: string | null;
}

export interface CompanySimilarityEdge {
  company_a_id: string;
  company_b_id: string;
  similarity_score: number;
  similarity_type: string;
}
