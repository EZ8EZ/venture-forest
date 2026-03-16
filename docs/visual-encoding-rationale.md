# Visual Encoding Rationale

## Overview

Each data dimension maps to a specific visual property of the tree. These mappings were chosen for intuitiveness, perceptual effectiveness, and compatibility with the forest metaphor. This document explains the reasoning behind each choice and notes alternatives that were considered.

## Height = Total Funding

**Mapping:** A tree's height is proportional to the company's cumulative funding (log-scaled).

**Why this works:**
- Vertical scale is the most immediately perceptible dimension in a 3D scene
- "Bigger funding = taller tree" is intuitive without explanation
- Height is visible from a distance, making it effective for overview scanning
- Log scaling prevents a few mega-rounds from dwarfing everything else

**Scale:** logarithmic. A $1M company and a $10B company should both be visible; linear scale would make the smaller one invisible. Log base is tuned so seed-stage companies are short but present, and late-stage companies are tall but not absurdly so.

**Alternatives considered:**
- *Canopy volume for funding:* harder to perceive accurately; volume estimation is weak in human spatial cognition
- *Color intensity for funding:* would conflict with sector-based color mapping and is harder to rank visually across many objects
- *Particle effects for funding:* too noisy, distracting at scale

## Trunk Thickness = Headcount

**Mapping:** Trunk radius scales with employee count (square-root scaled).

**Why this works:**
- Thickness conveys mass, substance, and organizational presence
- A thick trunk next to a thin one clearly communicates "this company is larger in people"
- Square-root scaling keeps the range manageable (a 10,000-person company is noticeably wider than a 5-person one, but not 2000x wider)
- Thickness is perceptible at medium distances, even when height differences are subtle

**Why square-root, not linear:**
- Trunk radius maps to cross-sectional area, and area scales with the square of radius
- Using sqrt(headcount) for radius means the visual area scales linearly with headcount, which is perceptually fairer

**Alternatives considered:**
- *Canopy density for headcount:* subtle, hard to distinguish across trees
- *Branch count for headcount:* computationally expensive and visually noisy at high counts
- *Separate bar chart or ring:* breaks the forest metaphor

## Species = Sector

**Mapping:** Each sector maps to a distinct tree species with a unique silhouette (see design-system.md for the full mapping).

**Why this works:**
- Categorical data needs a categorical visual channel; shape/species is ideal
- Different silhouettes are distinguishable at a glance, even at distance
- Species grouping into groves creates natural spatial clusters, making sector distribution legible
- The mapping is memorable: once you learn "conifers = AI," it sticks

**Why not color alone for sector:**
- Color discrimination degrades with many categories (> 7 is unreliable)
- Color is harder to perceive at distance in a foggy scene
- Species differences provide redundant encoding (shape + color + texture), which improves accessibility

**Alternatives considered:**
- *Color-only for sector:* insufficient differentiation, accessibility issues for color vision deficiency
- *Icons/symbols on trees:* breaks immersion, adds visual clutter
- *Spatial position only:* works for groves but loses meaning when zoomed into a single cluster

## Bark Maturity = Company Age

**Mapping:** Bark texture becomes rougher, more cracked, and darker as the company age increases.

**Why this works:**
- Aging bark is a naturalistic, intuitive metaphor: old trees look different from young ones
- It is a secondary encoding, visible on close inspection but not dominant from afar
- Avoids consuming a primary visual channel (color, height, shape) for a dimension that is interesting but not primary

**Implementation:** procedural bark shader with noise parameters controlled by age. Young companies have smooth, light bark. Old companies have deep grooves and darker tones.

**Alternatives considered:**
- *Ring count (like real tree rings):* invisible without cutting the tree open, which breaks the metaphor
- *Leaf color (seasonal) for age:* confusing, since seasonal change implies cyclical time, not cumulative age
- *Moss/lichen growth for age:* visually interesting but hard to control precisely and may look like rendering artifacts

## Roots = Investors

**Mapping:** Investor relationships are visualized as root networks beneath the tree, normally hidden below the terrain surface.

**Why this works:**
- Roots are the hidden support system of a tree, just as investors are the hidden support system of a startup
- Shared roots between trees naturally express shared investors
- Hiding roots by default keeps the scene clean; revealing them on demand adds a layer of discovery
- The underground metaphor avoids the visual chaos of above-ground network graphs

**Visual encoding of root properties:**
- Root thickness reflects investment size or number of rounds
- Root length corresponds to the spatial distance between connected trees
- Root color is muted and organic, not diagrammatic

**Alternatives considered:**
- *Above-ground network lines:* quickly becomes spaghetti with more than a few connections; obscures the trees themselves
- *Force-directed graph overlay:* standard but unrelated to the forest metaphor; feels like a different product
- *Color-coded halos around trees:* cannot show shared relationships between trees
- *Constellation lines in the sky:* creative but spatially disconnected from the trees, making it hard to trace

## Trade-offs and Limitations

**Information density vs. clarity:** five data dimensions on a single object is near the upper limit of what can be perceived simultaneously. The design relies on progressive disclosure: height and species are visible at overview zoom; thickness and bark are visible at medium zoom; roots are revealed on interaction.

**Quantitative precision:** a forest is not a bar chart. Users cannot read exact funding amounts from tree height. The detail panel exists for precise values; the forest is for pattern recognition, comparison, and exploration.

**Missing data:** when a dimension is unknown, the tree uses a neutral default rather than disappearing. This means some trees may look more similar than they should. The completeness_score and data quality indicators help the user understand when this is happening.

**Colorblind accessibility:** species differentiation relies on silhouette shape as the primary channel, with color as reinforcement. This makes the sector encoding robust for most forms of color vision deficiency.
