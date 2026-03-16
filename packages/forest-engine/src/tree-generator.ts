import type { CompanyPlacement } from "@venture-forest/shared-types";
import { getSpecies, type CanopyShape, type SpeciesDefinition } from "./species.js";

export interface CanopyParams {
  shape: CanopyShape;
  radius: number;
  height: number;
  color: string;
  density: number;
  variant: number;
}

export interface BarkParams {
  color: string;
  roughness: number;
  taper: number;
  variant: number;
}

export interface TreeGeometryParams {
  height: number;
  trunkRadius: number;
  canopy: CanopyParams;
  bark: BarkParams;
  species: SpeciesDefinition;
}

/**
 * Compute the visual tree height from a CompanyPlacement.
 * The raw tree_height value (typically 1-20) maps to world units.
 * A minimum height is enforced so that even tiny startups remain visible.
 */
export function getTreeHeight(placement: CompanyPlacement): number {
  const minHeight = 0.5;
  const maxHeight = 25;
  return Math.max(minHeight, Math.min(maxHeight, placement.tree_height));
}

/**
 * Compute trunk radius from placement data.
 * Trunk radius scales with tree height but is also influenced
 * by the species trunk taper factor.
 */
export function getTrunkRadius(placement: CompanyPlacement): number {
  const species = getSpecies(placement.species_type);
  const baseRadius = placement.trunk_radius;
  const minRadius = 0.05;
  const maxRadius = 1.5;
  const tapered = baseRadius * species.trunkTaper;
  return Math.max(minRadius, Math.min(maxRadius, tapered));
}

/**
 * Derive canopy rendering parameters from placement and species data.
 * The canopy_variant selects which color from the species palette to use
 * as the dominant canopy color.
 */
export function getCanopyParams(placement: CompanyPlacement): CanopyParams {
  const species = getSpecies(placement.species_type);
  const height = getTreeHeight(placement);

  const canopyRadius = height * 0.4 + placement.trunk_radius * 2;
  const canopyHeight = height * 0.55;
  const variant = placement.canopy_variant;
  const color = species.canopyColors[variant] ?? species.canopyColors[0];

  return {
    shape: species.canopyShape,
    radius: canopyRadius,
    height: canopyHeight,
    color,
    density: species.canopyDensity,
    variant,
  };
}

/**
 * Derive bark rendering parameters from placement and species data.
 */
export function getBarkParams(placement: CompanyPlacement): BarkParams {
  const species = getSpecies(placement.species_type);

  return {
    color: species.barkColor,
    roughness: species.barkRoughness,
    taper: species.trunkTaper,
    variant: placement.bark_variant,
  };
}

/**
 * Generate full tree geometry parameters for a given placement.
 * This is the primary entry point used by the 3D renderer.
 */
export function generateTreeParams(placement: CompanyPlacement): TreeGeometryParams {
  const species = getSpecies(placement.species_type);

  return {
    height: getTreeHeight(placement),
    trunkRadius: getTrunkRadius(placement),
    canopy: getCanopyParams(placement),
    bark: getBarkParams(placement),
    species,
  };
}
