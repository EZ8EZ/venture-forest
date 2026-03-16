import { Sector, type Company, type Grove } from "@venture-forest/shared-types";

/**
 * Sector display labels used for grove naming.
 */
const SECTOR_LABELS: Record<Sector, string> = {
  [Sector.AI_ML]: "AI & Machine Learning",
  [Sector.FINTECH]: "Fintech",
  [Sector.CLIMATE_ENERGY]: "Climate & Energy",
  [Sector.BIOTECH]: "Biotech",
  [Sector.CONSUMER]: "Consumer",
  [Sector.DEVELOPER_TOOLS]: "Developer Tools",
  [Sector.ENTERPRISE]: "Enterprise",
  [Sector.HEALTHCARE]: "Healthcare",
  [Sector.EDUCATION]: "Education",
  [Sector.OTHER]: "Other",
};

/**
 * A simple seeded pseudo-random number generator (mulberry32).
 * Ensures deterministic jitter across runs.
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

export interface GroveAllocationOptions {
  /** Distance from world origin to center of grove ring */
  ringRadius?: number;
  /** Base radius for each grove (adjusted by company count) */
  baseGroveRadius?: number;
  /** Random seed for deterministic jitter */
  seed?: number;
}

/**
 * Allocate angular sectors for each Sector enum value and produce
 * Grove definitions with organic jitter applied to positions.
 *
 * Each sector gets an equal angular slice of the circle. The grove
 * center is placed at the midpoint of that slice, with small random
 * offsets to break visual regularity.
 */
export function allocateGroves(
  companies: Company[],
  options: GroveAllocationOptions = {}
): Grove[] {
  const {
    ringRadius = 80,
    baseGroveRadius = 25,
    seed = 42,
  } = options;

  const rng = seededRandom(seed);

  // Count companies per sector to determine which sectors have groves
  const sectorCounts = new Map<Sector, number>();
  for (const company of companies) {
    sectorCounts.set(
      company.sector,
      (sectorCounts.get(company.sector) ?? 0) + 1
    );
  }

  // Only create groves for sectors that have companies
  const activeSectors = Object.values(Sector).filter(
    (s) => (sectorCounts.get(s) ?? 0) > 0
  );

  if (activeSectors.length === 0) {
    return [];
  }

  const sliceAngle = (2 * Math.PI) / activeSectors.length;
  const groves: Grove[] = [];

  for (let i = 0; i < activeSectors.length; i++) {
    const sector = activeSectors[i];
    const count = sectorCounts.get(sector) ?? 0;

    // Angular center of this sector's slice
    const baseAngle = i * sliceAngle + sliceAngle / 2;

    // Organic jitter: small offsets to angle and radius
    const angleJitter = (rng() - 0.5) * sliceAngle * 0.15;
    const radiusJitter = (rng() - 0.5) * ringRadius * 0.1;

    const angle = baseAngle + angleJitter;
    const distance = ringRadius + radiusJitter;

    const center_x = Math.cos(angle) * distance;
    const center_z = Math.sin(angle) * distance;

    // Scale grove radius based on company count
    const scaleFactor = Math.sqrt(count / 5);
    const radius = Math.max(baseGroveRadius * 0.5, baseGroveRadius * scaleFactor);

    groves.push({
      id: `grove-${sector.toLowerCase()}`,
      sector,
      center_x: Math.round(center_x * 100) / 100,
      center_z: Math.round(center_z * 100) / 100,
      radius: Math.round(radius * 100) / 100,
      label: SECTOR_LABELS[sector],
    });
  }

  return groves;
}
