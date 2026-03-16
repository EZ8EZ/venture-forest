# Skill: Forest UI Polish Pass

## Purpose
Refine overlay panels, animations, and interaction feedback to meet the project's design standards.

## When to Use
- After implementing a new UI panel or overlay.
- When the design feels rough, inconsistent, or unfinished.
- Before a release milestone.

## Steps
1. Review all overlay panels against the design system in `design-system.md`.
2. Check glass panel styling: backdrop blur 8-12 px, correct background alpha, rounded corners (12 px).
3. Verify typography: Inter font family, correct sizes, proper contrast ratios (WCAG AA).
4. Test animations: enter/exit transitions should use Framer Motion, 150-250 ms, ease-out curves.
5. Confirm keyboard navigation: Tab through interactive elements, verify visible focus rings.
6. Check `aria-label` attributes on icon-only buttons.
7. Test responsiveness: panels should not overflow on narrow viewports.
8. Verify that overlays do not block 3D interaction when they should not.
9. Screenshot before and after for comparison.

## Key Files
- `apps/web/src/ui/` - overlay components.
- `.claude/rules/ui-overlays.md` - overlay rules.
- `design-system.md` - palette, typography, animation specs.
