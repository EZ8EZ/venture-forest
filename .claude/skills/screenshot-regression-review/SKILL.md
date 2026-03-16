# Skill: Screenshot Regression Review

## Purpose
Capture and compare screenshots of key camera angles to detect unintended visual changes.

## When to Use
- On every pull request that touches rendering, layout, or styling code.
- After upgrading Three.js, drei, or postprocessing packages.

## Steps
1. Run the Playwright screenshot suite: `pnpm test:screenshots`.
2. Compare new screenshots against baselines stored in `tests/screenshots/baseline/`.
3. Review diffs; accept minor anti-aliasing differences across platforms.
4. If a diff is intentional, update the baseline with `pnpm test:screenshots --update`.
5. If a diff is unintended, investigate the causing commit and fix before merging.

## Key Files
- `tests/screenshots/` - baseline images and test scripts.
- `playwright.config.ts` - screenshot test configuration.
- `.claude/rules/testing.md` - visual regression guidelines.
