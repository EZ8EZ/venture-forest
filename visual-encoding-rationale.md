# Visual Encoding Rationale

This document explains why each data dimension maps to a specific visual property in the forest.

## Tree Height and Scale: Valuation

A company's valuation determines its tree scale. Taller, larger trees represent higher-valued companies.

- **Why**: height is the most immediately perceptible spatial dimension. Visitors can scan the skyline and instantly identify the most valuable companies.
- **Encoding**: logarithmic scale. A 10x increase in valuation roughly doubles the tree height. Linear mapping would make seed-stage companies invisible next to unicorns.

## Tree Species: Sector

Each sector maps to a distinct tree species with a unique silhouette (see `design-system.md`).

- **Why**: shape is preattentive; humans distinguish silhouettes faster than color alone. Species provide redundant encoding alongside grove placement, reinforcing sector identity without relying on labels.
- **Alternative considered**: color-only encoding. Rejected because color alone is insufficient for colorblind users and does not scale well beyond six or seven categories.

## Grove Clustering: Sector Grouping

Trees of the same sector are planted in the same grove (spatial cluster).

- **Why**: spatial proximity is the strongest grouping cue. Clustering by sector lets users navigate to an industry and explore it as a neighborhood.
- **Alternative considered**: clustering by geography or stage. Rejected because sector is the primary lens for most VC analysis.

## Leaf Density and Color: Funding Stage

Earlier-stage companies have sparser, lighter-colored canopies. Later-stage companies have denser, deeper-hued foliage.

- **Why**: this mirrors biological growth. It feels intuitive that a "mature" company has a fuller canopy.
- **Encoding**: stage enum maps to a density multiplier (0.3 for seed, 1.0 for late) and a hue shift.

## Underground Roots: Investor Connections

Shared investors between companies are visualized as root systems connecting trees beneath the surface.

- **Why**: roots are hidden infrastructure, a fitting metaphor for the financial relationships that connect companies. Revealing them on interaction creates a moment of discovery.
- **Alternative considered**: above-ground edges (arcs, lines). Rejected because they clutter the visual space and compete with the forest canopy.

## Root Thickness: Investment Size

Thicker roots indicate larger aggregate investment between connected entities.

- **Why**: thickness is an intuitive encoding for volume or magnitude. Users can trace the thickest roots to find the most significant financial relationships.

## Emissive Root Glow: Recency

More recently active investment connections glow brighter.

- **Why**: glow draws attention to current activity without requiring the user to read dates. It highlights where capital is flowing now.

## Label Visibility: Proximity

Labels appear only when the camera is near a tree, limiting clutter.

- **Why**: showing all labels at once would create an unreadable overlay. Progressive disclosure rewards exploration and keeps the scene clean from a distance.
