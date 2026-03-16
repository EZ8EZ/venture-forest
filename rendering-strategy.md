# Rendering Strategy

This document describes the 3D rendering approach for Venture Forest, covering visual style, performance techniques, and labeling.

## Visual Style: Stylized Realism

The forest uses a stylized-realism aesthetic, not photorealism. Trees are simplified, colors are intentionally saturated, and lighting is moody (perpetual twilight). The goal is to feel like a living data dashboard, not a nature simulator.

- Color palette leans toward deep teals, warm ambers, soft purples, and mossy greens.
- Subtle bloom and vignette reinforce the twilight atmosphere.
- Flat ground plane with a soft radial gradient fog to fade distant geometry gracefully.

## Instancing

Every tree in the forest is rendered via `InstancedMesh`. A single draw call handles hundreds of trees of the same species.

- Per-instance attributes: position, scale (encodes valuation), color tint (encodes funding stage), rotation (randomized for variety).
- Instance matrices are updated only when the dataset changes, never per frame.
- Leaf clusters use a second instanced mesh with a translucent leaf material.

## Level of Detail (LOD)

Three tiers per tree species:

| Tier   | Distance     | Geometry                     |
|--------|-------------|------------------------------|
| High   | 0 - 50 units | Full mesh, leaves, bark detail |
| Medium | 50 - 150     | Simplified trunk, flat leaf cards |
| Low    | 150+         | Billboard sprite              |

LOD transitions use drei's `<Detailed>` component with hysteresis to prevent popping.

## Frustum Culling

- All meshes keep the default `frustumCulled={true}`.
- Groves are grouped into spatial clusters so the engine can skip entire groups when off-screen.
- The root network (underground) is culled aggressively since it is only visible when the camera tilts down.

## Material System

- **Bark**: `MeshStandardMaterial` with a shared bark texture atlas, roughness 0.85, metalness 0.0.
- **Leaves**: `MeshStandardMaterial` with alpha-tested leaf texture, double-sided, sector-specific hue shift.
- **Ground**: custom shader material with radial gradient and subtle noise.
- **Roots**: `MeshStandardMaterial` with emissive highlights tracing investor connections.

All materials are created once at module scope and shared across instances.

## Postprocessing Stack

Three passes, in order:

1. **Bloom** (selective) - applied to emissive root highlights and glowing labels.
2. **Tone Mapping** - ACES filmic for cinematic contrast.
3. **Vignette** - subtle darkening at screen edges to draw focus inward.

On the low quality preset, all postprocessing is disabled. On medium, only tone mapping remains.

## Label Strategy

- Company names appear as HTML overlays (via drei's `<Html>`) rather than 3D text geometry.
- Labels fade in within a configurable distance threshold (default 30 units).
- Only the nearest N labels (default 15) are visible at any time to avoid clutter.
- On hover, a single detail label expands with funding info; all others dim.
- Labels use `pointer-events: none` except for the hovered label, preventing click conflicts with the 3D scene.
