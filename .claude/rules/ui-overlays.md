# Overlay UI Rules

## Philosophy
- The 3D world is the primary experience; overlays are secondary and must never dominate it.
- Overlays provide context on hover or click, then get out of the way.

## Visual Style
- Use translucent glass panels with a subtle backdrop blur (8-12 px).
- Dark backgrounds with high-contrast white or light-gray text.
- Rounded corners (border-radius 12 px), soft shadows, no hard borders.

## Technology
- Build overlays with Tailwind CSS for layout and Framer Motion for enter/exit animations.
- Animations should be fast (150-250 ms) and use ease-out curves.
- Never use CSS `transition` for complex sequences; prefer Framer Motion's `AnimatePresence`.

## Positioning
- Anchor panels to screen edges or to 3D-projected coordinates via `useThree` + CSS transforms.
- Avoid centering large modals over the viewport; prefer side panels or bottom drawers.

## Accessibility
- All overlay text must meet WCAG AA contrast (4.5:1 minimum).
- Interactive elements must be keyboard-navigable and have visible focus rings.
- Provide `aria-label` attributes on icon-only buttons.
