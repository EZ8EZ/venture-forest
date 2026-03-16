# Visual Design System

Venture Forest uses a cohesive twilight-forest aesthetic across 3D and UI surfaces. This document defines the palette, typography, mappings, and lighting.

## Color Mode

Dark mode only. The experience is built around a moody, twilight atmosphere; a light mode would undermine the visual identity.

## Twilight Palette

| Token            | Hex       | Usage                                  |
|------------------|-----------|----------------------------------------|
| bg-deep          | #0B0F1A   | Page background, sky gradient base.    |
| bg-surface       | #141B2D   | Overlay panel backgrounds.             |
| bg-glass         | #1E2740CC | Glass panel fill (with alpha).         |
| text-primary     | #E8ECF4   | Primary text.                          |
| text-secondary   | #8B95A8   | Secondary text, captions.             |
| accent-teal      | #2DD4BF   | Links, active states, highlights.      |
| accent-amber     | #F59E0B   | Warnings, funding amounts.            |
| accent-purple    | #A78BFA   | Investor-related highlights.           |
| accent-rose      | #FB7185   | Alerts, errors.                        |
| ground-moss      | #1A2F1A   | Forest ground plane base color.        |
| fog              | #0B0F1A80 | Distance fog, alpha-blended.           |

## Typography

- **Font Family**: Inter for UI overlays; system sans-serif as fallback.
- **Headings**: Inter SemiBold, tracking -0.02em.
- **Body**: Inter Regular, 14px / 1.5 line-height.
- **Mono**: JetBrains Mono for data values and metrics.
- **3D Labels**: rendered as HTML overlays using Inter Medium at 12px.

## Sector-to-Species Mapping

Each sector maps to a distinct tree species, providing instant visual differentiation.

| Sector   | Species         | Silhouette Traits                |
|----------|----------------|----------------------------------|
| ai       | Neural Pine     | Tall, narrow, branching crown.   |
| fintech  | Silver Birch    | Pale bark, delicate leaves.      |
| health   | Cherry Blossom  | Wide canopy, pink-tinted leaves. |
| saas     | Oak             | Broad, sturdy, dense foliage.    |
| consumer | Maple           | Spreading branches, warm tones.  |
| climate  | Redwood         | Towering, thick trunk.           |
| web3     | Willow          | Drooping, luminous strands.      |
| infra    | Cedar           | Conical, structured layers.      |
| biotech  | Baobab          | Thick trunk, sparse top canopy.  |
| other    | Generic Elm     | Neutral rounded silhouette.      |

## Lighting

- **Ambient**: low-intensity warm white (intensity 0.3, color #FFF5E6).
- **Directional (key)**: angled 45 degrees from upper-left, warm amber (#FFD199), intensity 1.0, casting soft shadows.
- **Directional (fill)**: opposite side, cool blue (#99B8FF), intensity 0.4, no shadows.
- **Hemisphere**: sky #1A1040, ground #0A1F0A, intensity 0.2.
- **Point lights**: optional accent lights at grove centers for visual emphasis.

## Shadows

- Use a single cascaded shadow map from the key light.
- Shadow map resolution: 2048x2048 on high preset, 1024x1024 on medium, disabled on low.
- Shadow bias tuned to avoid acne on bark surfaces.

## Animation Principles

- Camera transitions: 800 ms ease-in-out.
- Hover effects: 150 ms scale bump (1.0 to 1.05) with ease-out.
- Panel enter/exit: 200 ms fade + slide from the edge.
- Avoid continuous looping animations; the forest should feel calm, not busy.
