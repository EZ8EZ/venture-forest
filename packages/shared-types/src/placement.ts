import { Sector } from "./enums.js";

export interface CompanyPlacement {
  company_id: string;
  world_x: number;
  world_z: number;
  elevation: number;
  radial_rank: number;
  grove_id: string;
  local_cluster_id: string | null;
  tree_height: number;
  trunk_radius: number;
  species_type: Sector;
  canopy_variant: 0 | 1 | 2 | 3;
  bark_variant: 0 | 1 | 2 | 3;
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
