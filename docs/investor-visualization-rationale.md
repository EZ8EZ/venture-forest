# Investor Visualization Rationale

## Core Concept

Investor relationships are visualized as root networks beneath the forest floor. Roots are hidden by default, revealed selectively through user interaction, and rendered as organic, subterranean structures connecting trees that share investors.

## Why Hidden by Default

Showing all investor connections at once would overwhelm the scene. In a dataset of 500 companies with an average of 3 investors each, there could be thousands of edges. Displaying them all simultaneously would:

- Obscure the trees themselves (the primary visualization)
- Create a tangled mess that communicates nothing
- Tank rendering performance
- Undermine the clean, atmospheric aesthetic

Hiding roots by default keeps the forest readable. Investor data becomes a discoverable layer, not visual noise.

## Reveal Modes

### Local Reveal (single tree selection)

When the user selects a tree, its investor roots emerge from beneath the terrain:

- Roots grow outward from the selected tree's base
- Each root connects to other trees that share at least one investor
- Root thickness indicates the strength of the relationship (number of shared rounds, investment size)
- Only first-degree connections are shown to keep the view focused
- Animation: roots "grow" outward over 400-600ms, reinforcing the organic metaphor

This mode answers the question: "Who invested in this company, and what else did they invest in?"

### Investor Mode (portfolio view)

A dedicated view mode activated from the toolbar. The user selects an investor (via search or panel), and the scene reveals:

- All trees in that investor's portfolio, highlighted with a subtle glow
- Root connections between all portfolio companies
- Non-portfolio trees dim slightly to reduce visual competition
- The camera may adjust to frame the portfolio spread

This mode answers the question: "What does this investor's portfolio look like across the forest?"

### Grove-Level Reveal (future consideration)

A potential future mode showing aggregate investor activity within a sector grove, without resolving individual edges. This would use density-based rendering (e.g., a heat map beneath the grove) rather than discrete root lines.

## Visual Style

### Organic Mycelium Aesthetic

Roots are rendered to evoke fungal mycelium networks or tree root systems, not circuit diagrams.

- **Geometry:** tapered tubes that branch and curve, not straight lines
- **Color:** warm amber/ochre glow against the dark underground, desaturated enough to stay subtle
- **Emission:** faint self-illumination so roots are visible beneath the semi-transparent ground plane
- **Branching:** roots fork as they travel between trees, suggesting organic growth
- **Underground context:** a slightly transparent ground layer reveals roots just below the surface; roots are not floating in empty space

### Subterranean Glow

When roots are revealed, the terrain in the affected area becomes slightly translucent, with a soft glow emanating from below. This creates the effect of peering into the ground rather than removing it. The glow fades with distance from the selected tree.

## Performance Considerations

Root geometry could easily become the most expensive part of the scene if not managed carefully.

### Selective Rendering

- Roots are only generated and submitted to the GPU when a reveal is active
- When the user deselects, root geometry is removed from the scene graph (not just hidden)
- In investor mode, only the selected investor's portfolio roots are rendered

### Geometry Budget

- Each root connection is a low-poly tube (8-12 segments along the length, 4-6 radial segments)
- For a single tree with 5-10 connections, this is roughly 500-1000 triangles, which is negligible
- For investor mode with 20-50 portfolio companies, the budget is higher but still manageable (10k-50k triangles)
- If the portfolio is very large (100+ companies), roots are simplified to flat ribbons or dashed lines

### Instancing

Where multiple roots share similar geometry (common branching patterns), instanced rendering can be used. However, since root paths are unique to each company pair, instancing is less effective here than for trees. The primary optimization is simply not rendering roots when they are not needed.

## Alternatives Rejected

### Network Graph Overlay

A traditional force-directed network graph drawn on top of the forest scene.

**Why rejected:**
- Completely breaks the forest metaphor
- Force-directed layouts fight with the spatial layout already established by the grove system
- Edges cross trees and obscure the scene
- Feels like a different product bolted on top

### Spaghetti Lines Above Ground

Simple lines drawn between tree tops or trunks to show shared investors.

**Why rejected:**
- Even a modest number of connections produces visual chaos
- Lines crossing in 3D space are very difficult to trace
- No natural way to convey connection strength
- Unappealing aesthetically

### Force-Directed Investor Nodes

Adding investor nodes as floating objects (spheres, icons) connected to their portfolio trees.

**Why rejected:**
- Adds a new class of objects that are not trees, complicating the visual language
- Floating objects have no natural "home" in the scene
- Occludes the forest
- Interaction model becomes ambiguous (clicking a tree vs. clicking an investor node)

### Color-Coded Investor Highlighting

Coloring trees by their lead investor using a categorical color palette.

**Why rejected:**
- Color is already used (indirectly) for sector via species
- There are far more investors than sectors, making color discrimination impossible
- Does not show shared investors or multi-investor relationships
- Loses all structural/network information

### Constellation View

Drawing investor connections as lines in the sky above the forest, like star constellations.

**Why rejected:**
- Creative but spatially disconnected from the trees below
- Requires the user to mentally map sky positions to ground positions
- Obscures the sky/atmosphere that contributes to the mood
- Hard to implement clearly without becoming another spaghetti diagram

## Design Principles Summary

1. **Hidden by default, revealed on demand** - keep the base visualization clean
2. **Organic, not diagrammatic** - roots and mycelium, not edges and nodes
3. **Subterranean, not aerial** - the underground metaphor is both visually distinct and conceptually accurate
4. **Performance through selectivity** - never render what is not being viewed
5. **Progressive disclosure** - single-tree roots are simple; investor mode is comprehensive; each serves a different question
