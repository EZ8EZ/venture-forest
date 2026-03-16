# Investor Visualization Rationale

This document explains the design thinking behind representing investors as underground root networks rather than visible above-ground entities.

## Core Metaphor

In a real forest, root systems are the hidden infrastructure that sustains trees. They transport nutrients, connect organisms through mycorrhizal networks, and provide stability. Venture investors serve an analogous role: they provide capital (nutrients), connect portfolio companies (network effects), and offer stability through follow-on funding.

## Why Roots, Not Trees

An early design explored giving investors their own above-ground representation (a second species of tree, a distinct structure). This was rejected for three reasons:

1. **Visual clutter**: doubling the number of above-ground objects would overwhelm the scene, especially in dense sectors.
2. **Category confusion**: users would struggle to distinguish company trees from investor trees at a glance, even with shape differences.
3. **Metaphor purity**: forests are about trees. The forest metaphor stays coherent when every above-ground element is a company.

## Why Underground

Placing investor networks underground provides a reveal mechanic. The default view is a clean forest canopy. When a user clicks a company or investor, the camera tilts to expose the root layer, creating a sense of discovery.

- The transition from surface to subsurface mirrors the experience of digging into a company's cap table.
- It separates the two primary data layers (company attributes vs. investor relationships) spatially, reducing cognitive load.

## Root Network Topology

- Each investor is an invisible anchor point beneath the forest floor.
- Roots extend from the anchor to every portfolio company's tree base.
- When two companies share an investor, their roots converge at the shared anchor, forming a visible connection.
- The topology is a bipartite graph (investors to companies) rendered as smooth spline curves.

## Visual Properties

- **Thickness**: proportional to the aggregate capital deployed along that connection.
- **Emissive glow**: brighter for more recent activity, dimmer for older rounds.
- **Color**: tinted by investor type (VC: teal, angel: amber, CVC: purple).
- **Depth**: roots sit at Y = -2 to -5 in world space, with slight vertical variation to avoid z-fighting.

## Interaction Model

1. **Default state**: roots are invisible (below the opaque ground plane).
2. **Hover on company**: the ground becomes semi-transparent in a radius around the tree, revealing its roots.
3. **Click on company**: camera smoothly tilts to a 30-degree downward angle, full root network for that company fades in.
4. **Click on root**: highlights the investor, shows all other companies connected through that investor.
5. **Click away**: camera returns to surface level, roots fade out.

## Performance Considerations

- Root geometry is generated once from the dataset and stored as a single merged mesh.
- Only roots within the camera frustum and near the selected company are rendered at full fidelity.
- Distant or unselected roots use a simplified line representation or are culled entirely.
