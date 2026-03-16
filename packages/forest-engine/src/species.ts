import { Sector } from "@venture-forest/shared-types";

export type CanopyShape =
  | "cone"
  | "dome"
  | "broad"
  | "organic"
  | "round"
  | "angular"
  | "columnar"
  | "weeping"
  | "fan"
  | "irregular";

export interface SpeciesDefinition {
  sector: Sector;
  label: string;
  canopyShape: CanopyShape;
  canopyColors: [string, string, string, string];
  barkColor: string;
  barkRoughness: number;
  trunkTaper: number;
  canopyDensity: number;
}

/**
 * Visual species definitions mapped to each sector.
 * Each sector produces a distinct tree silhouette and color palette
 * so that groves are visually distinguishable at a glance.
 */
export const SPECIES: Record<Sector, SpeciesDefinition> = {
  [Sector.AI_ML]: {
    sector: Sector.AI_ML,
    label: "Neural Pine",
    canopyShape: "cone",
    canopyColors: ["#1a7a4c", "#23995f", "#0f6b3a", "#2aad6e"],
    barkColor: "#4a3728",
    barkRoughness: 0.7,
    trunkTaper: 0.85,
    canopyDensity: 0.9,
  },
  [Sector.FINTECH]: {
    sector: Sector.FINTECH,
    label: "Ledger Oak",
    canopyShape: "dome",
    canopyColors: ["#2d6a4f", "#40916c", "#1b4332", "#52b788"],
    barkColor: "#5c4033",
    barkRoughness: 0.85,
    trunkTaper: 0.7,
    canopyDensity: 0.95,
  },
  [Sector.CLIMATE_ENERGY]: {
    sector: Sector.CLIMATE_ENERGY,
    label: "Solaris Elm",
    canopyShape: "broad",
    canopyColors: ["#3a8f3f", "#5cb85c", "#2d7a2d", "#7dce82"],
    barkColor: "#6b5b4f",
    barkRoughness: 0.6,
    trunkTaper: 0.75,
    canopyDensity: 0.85,
  },
  [Sector.BIOTECH]: {
    sector: Sector.BIOTECH,
    label: "Helix Willow",
    canopyShape: "organic",
    canopyColors: ["#4a9e6e", "#6dbf8b", "#357a52", "#8fd4a8"],
    barkColor: "#8b7d6b",
    barkRoughness: 0.5,
    trunkTaper: 0.9,
    canopyDensity: 0.75,
  },
  [Sector.CONSUMER]: {
    sector: Sector.CONSUMER,
    label: "Bloom Maple",
    canopyShape: "round",
    canopyColors: ["#d4763a", "#e8943d", "#c25e2a", "#f0b060"],
    barkColor: "#5e4a3a",
    barkRoughness: 0.65,
    trunkTaper: 0.72,
    canopyDensity: 0.88,
  },
  [Sector.DEVELOPER_TOOLS]: {
    sector: Sector.DEVELOPER_TOOLS,
    label: "Stack Cypress",
    canopyShape: "angular",
    canopyColors: ["#2874a6", "#3498db", "#1a5276", "#5dade2"],
    barkColor: "#3d3d3d",
    barkRoughness: 0.8,
    trunkTaper: 0.92,
    canopyDensity: 0.82,
  },
  [Sector.ENTERPRISE]: {
    sector: Sector.ENTERPRISE,
    label: "Sequoia Tower",
    canopyShape: "columnar",
    canopyColors: ["#1e5631", "#2e7d32", "#114520", "#43a047"],
    barkColor: "#6d4c41",
    barkRoughness: 0.9,
    trunkTaper: 0.65,
    canopyDensity: 0.92,
  },
  [Sector.HEALTHCARE]: {
    sector: Sector.HEALTHCARE,
    label: "Vita Birch",
    canopyShape: "weeping",
    canopyColors: ["#66bb6a", "#81c784", "#4caf50", "#a5d6a7"],
    barkColor: "#d7ccc8",
    barkRoughness: 0.35,
    trunkTaper: 0.88,
    canopyDensity: 0.7,
  },
  [Sector.EDUCATION]: {
    sector: Sector.EDUCATION,
    label: "Scholar Palm",
    canopyShape: "fan",
    canopyColors: ["#f9a825", "#fbc02d", "#f57f17", "#fdd835"],
    barkColor: "#795548",
    barkRoughness: 0.45,
    trunkTaper: 0.95,
    canopyDensity: 0.6,
  },
  [Sector.OTHER]: {
    sector: Sector.OTHER,
    label: "Wild Ash",
    canopyShape: "irregular",
    canopyColors: ["#607d3b", "#7a9a4f", "#4e6b30", "#8fb35a"],
    barkColor: "#5d4e37",
    barkRoughness: 0.55,
    trunkTaper: 0.78,
    canopyDensity: 0.8,
  },
};

/**
 * Get the species definition for a given sector.
 */
export function getSpecies(sector: Sector): SpeciesDefinition {
  return SPECIES[sector];
}
