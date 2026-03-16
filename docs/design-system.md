# Design System

## Principles

1. **Data first** - every visual choice should encode or support the data; decoration is secondary
2. **Dark mode first** - the forest is set at twilight; the UI follows suit
3. **Restraint** - muted palettes, subtle effects, generous whitespace in overlays
4. **Legibility** - overlays must be instantly readable against the 3D scene

## Color Palette

### Scene Colors

| Role             | Hex       | Usage                                          |
|------------------|-----------|-------------------------------------------------|
| Sky gradient top | #0B1120   | Deep navy, upper sky                            |
| Sky gradient mid | #1A2744   | Transitional twilight band                      |
| Sky horizon      | #2D3A5C   | Warm horizon glow                               |
| Fog              | #111827   | Distance fog, matches sky base                  |
| Ground base      | #1C2B1A   | Dark forest floor                               |
| Ground highlight | #2A3D26   | Subtle terrain variation                        |
| Ambient light    | #4A5568   | Cool, low-intensity fill                        |
| Key light        | #F6E8C8   | Warm directional (low sun angle)                |

### UI Colors

| Role             | Hex       | Usage                                          |
|------------------|-----------|-------------------------------------------------|
| Surface          | #111827   | Panel backgrounds (90% opacity)                 |
| Surface raised   | #1F2937   | Cards, hover states                             |
| Border           | #374151   | Panel edges, dividers                           |
| Text primary     | #F3F4F6   | Headings, key values                            |
| Text secondary   | #9CA3AF   | Labels, descriptions                            |
| Text muted       | #6B7280   | Tertiary info, timestamps                       |
| Accent           | #60A5FA   | Links, selected states                          |
| Accent hover     | #3B82F6   | Interactive hover                               |
| Success          | #34D399   | Positive indicators                             |
| Warning          | #FBBF24   | Data quality warnings                           |
| Error            | #F87171   | Error states                                    |

All UI surfaces use backdrop-blur and partial transparency to stay connected to the scene beneath.

## Typography

Overlays use system font stacks for performance and clarity:

| Role        | Font                              | Size    | Weight |
|-------------|-----------------------------------|---------|--------|
| Heading 1   | Inter, system-ui, sans-serif      | 20px    | 600    |
| Heading 2   | Inter, system-ui, sans-serif      | 16px    | 600    |
| Body        | Inter, system-ui, sans-serif      | 14px    | 400    |
| Caption     | Inter, system-ui, sans-serif      | 12px    | 400    |
| Mono/data   | JetBrains Mono, monospace         | 13px    | 400    |

No text is rendered as 3D geometry. All labels are HTML overlays projected into screen space.

## Spacing

Base unit: 4px. All spacing values are multiples of 4.

| Token  | Value | Usage                          |
|--------|-------|--------------------------------|
| xs     | 4px   | Tight internal padding         |
| sm     | 8px   | Default gap between elements   |
| md     | 16px  | Section padding                |
| lg     | 24px  | Panel internal margins         |
| xl     | 32px  | Panel outer margins            |
| 2xl    | 48px  | Major section separation       |

## Component Patterns

### Detail Panel

Slides in from the right when a tree is selected. Contains: company name, sector badge, funding history, headcount, investor list, data quality indicator. Width: 360px. Animates with a spring transition.

### Search Overlay

Top-center, collapses to an icon when inactive. Expands to a full search input with typeahead results. Results show company name, sector, and funding amount.

### Toolbar

Bottom-center, horizontal row of icon buttons: zoom controls, view mode toggle (overview/explore/investor), filter panel toggle, screenshot. Semi-transparent pill shape.

### Grove Label

Floating sector label centered above each grove. Visible in overview mode, fades as the camera zooms into a single grove. Uses Heading 2 style with a subtle text shadow.

### Tooltip

Small floating card near the cursor on hover. Shows: company name, one-line summary stat. Appears after a short delay (200ms). No arrow/pointer.

## Sector-to-Species Mapping

Each sector maps to a distinct tree species archetype, chosen for visual memorability and metaphorical resonance.

| Sector           | Species Archetype     | Silhouette Character                       |
|------------------|-----------------------|--------------------------------------------|
| AI / ML          | Conifer (spruce/pine) | Tall, narrow, pointed crown                |
| Fintech          | Hardwood (oak/maple)  | Broad, sturdy, classic trunk               |
| Climate / Energy | Broad canopy (banyan) | Wide spreading crown, visible root flare    |
| Biotech / Health | Branching organic     | Complex branching, irregular silhouette     |
| Consumer         | Colorful canopy       | Round crown, vibrant leaf tones             |
| Developer Tools  | Geometric             | Clean lines, regularized branching pattern  |
| Other / General  | Generic deciduous     | Neutral silhouette, mid-tone foliage        |

Species affect: mesh geometry, canopy shader parameters, bark texture frequency, default color range.

## Lighting Model

The scene uses a three-point lighting setup, tuned for the twilight aesthetic:

1. **Key light** - warm directional light at a low angle (15-25 degrees above horizon), casting long shadows. Intensity: moderate. Simulates a setting sun.
2. **Fill light** - cool ambient hemisphere light. Intensity: low. Prevents pure-black shadows.
3. **Rim/back light** - subtle secondary directional from behind and above. Adds edge definition to tree silhouettes.

Shadows use a single cascaded shadow map from the key light. Shadow softness is moderate (PCF or similar).

## Fog and Atmosphere

- **Type:** exponential fog (not linear), starting at moderate distance
- **Color:** matches sky gradient base (#111827)
- **Purpose:** hides the far edge of the forest, reinforces depth perception, masks LOD transitions
- **Density:** tuned so trees at the edge of the visible range are roughly 80% occluded

Optional: a subtle ground-level mist layer using a transparent plane with animated noise, positioned just above the terrain. This is a polish-phase addition.

## Motion

- Camera transitions: spring-based easing (not linear), duration 600-1000ms
- Panel open/close: spring with slight overshoot, duration 300ms
- Label fade: linear opacity, duration 200ms
- Tree hover highlight: emissive intensity ramp, duration 150ms

All motion respects `prefers-reduced-motion`. When reduced motion is active, transitions are instant.
