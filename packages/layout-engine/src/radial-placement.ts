import {
  Sector,
  type Company,
  type CompanyPlacement,
  type Grove,
} from "@venture-forest/shared-types";

/**
 * A simple seeded pseudo-random number generator (mulberry32).
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RadialPlacementOptions {
  /** Minimum spacing between tree centers in world units */
  minSpacing?: number;
  /** Maximum attempts to find a non-colliding position */
  maxAttempts?: number;
  /** Random seed for deterministic placement */
  seed?: number;
}

/**
 * Deterministic radial placement algorithm.
 *
 * Steps:
 * 1. Sort companies by total funding (descending) so that the most-funded
 *    companies are placed closest to the center of their grove.
 * 2. For each company, compute a radial distance from the grove center
 *    based on its funding rank. Higher funding = shorter distance.
 * 3. Apply sector-based angular offset within the grove to create
 *    natural clustering.
 * 4. Run collision avoidance: if a proposed position is too close to an
 *    existing placement, nudge it outward until spacing is satisfied.
 */
export function computeRadialPlacements(
  companies: Company[],
  groves: Grove[],
  options: RadialPlacementOptions = {}
): CompanyPlacement[] {
  const { minSpacing = 3, maxAttempts = 20, seed = 42 } = options;

  const rng = seededRandom(seed);

  // Build grove lookup by sector
  const groveLookup = new Map<Sector, Grove>();
  for (const grove of groves) {
    groveLookup.set(grove.sector, grove);
  }

  // Group and sort companies by sector, then by funding descending
  const bySector = new Map<Sector, Company[]>();
  for (const company of companies) {
    const list = bySector.get(company.sector) ?? [];
    list.push(company);
    bySector.set(company.sector, list);
  }

  // Sort each sector group by funding descending
  for (const [, list] of bySector) {
    list.sort((a, b) => (b.total_funding_usd ?? 0) - (a.total_funding_usd ?? 0));
  }

  const placements: CompanyPlacement[] = [];
  const occupiedPositions: Array<{ x: number; z: number; radius: number }> = [];

  for (const [sector, sectorCompanies] of bySector) {
    const grove = groveLookup.get(sector);
    if (!grove) continue;

    for (let rank = 0; rank < sectorCompanies.length; rank++) {
      const company = sectorCompanies[rank];
      const funding = company.total_funding_usd ?? 0;

      // Radial distance: rank 0 (highest funded) is closest to center
      const normalizedRank = sectorCompanies.length > 1
        ? rank / (sectorCompanies.length - 1)
        : 0;
      const radialDistance = normalizedRank * grove.radius * 0.85 + grove.radius * 0.05;

      // Angular position with jitter
      const baseAngle = (rank / sectorCompanies.length) * 2 * Math.PI;
      const angleJitter = (rng() - 0.5) * 0.4;
      const angle = baseAngle + angleJitter;

      // Tree sizing based on funding
      const fundingLog = funding > 0 ? Math.log10(funding) : 5;
      const treeHeight = Math.max(1, Math.min(20, (fundingLog - 4) * 3));
      const trunkRadius = Math.max(0.08, Math.min(1.2, treeHeight * 0.06));

      // Propose initial position
      let proposedX = grove.center_x + Math.cos(angle) * radialDistance;
      let proposedZ = grove.center_z + Math.sin(angle) * radialDistance;

      // Collision avoidance
      const treeSpacing = minSpacing + trunkRadius * 2;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let collision = false;
        for (const occ of occupiedPositions) {
          const dx = proposedX - occ.x;
          const dz = proposedZ - occ.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const requiredDist = treeSpacing + occ.radius;
          if (dist < requiredDist) {
            collision = true;
            break;
          }
        }
        if (!collision) break;

        // Nudge outward with slight angular shift
        const nudgeAngle = angle + (rng() - 0.5) * 0.6;
        const nudgeDist = radialDistance + (attempt + 1) * minSpacing * 0.5;
        proposedX = grove.center_x + Math.cos(nudgeAngle) * nudgeDist;
        proposedZ = grove.center_z + Math.sin(nudgeAngle) * nudgeDist;
      }

      occupiedPositions.push({
        x: proposedX,
        z: proposedZ,
        radius: trunkRadius,
      });

      const visualImportance = funding > 0
        ? Math.min(1, Math.log10(funding) / 10)
        : 0.1;

      const placement: CompanyPlacement = {
        company_id: company.id,
        world_x: Math.round(proposedX * 100) / 100,
        world_z: Math.round(proposedZ * 100) / 100,
        elevation: 0,
        radial_rank: rank,
        grove_id: grove.id,
        local_cluster_id: null,
        tree_height: Math.round(treeHeight * 100) / 100,
        trunk_radius: Math.round(trunkRadius * 1000) / 1000,
        species_type: sector,
        canopy_variant: (rank % 4) as 0 | 1 | 2 | 3,
        bark_variant: ((rank + 1) % 4) as 0 | 1 | 2 | 3,
        visual_importance_score: Math.round(visualImportance * 1000) / 1000,
      };

      placements.push(placement);
    }
  }

  return placements;
}
