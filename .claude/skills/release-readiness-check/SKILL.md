# Skill: Release Readiness Check

## Purpose
Verify that the project meets all quality gates before a release or public demo.

## When to Use
- Before deploying to production.
- Before sharing the project publicly or presenting a demo.

## Steps
1. Run the full test suite: `pnpm test` (unit) and `pnpm test:e2e` (end-to-end).
2. Run the screenshot regression suite and review any diffs.
3. Confirm performance: load the scene on mid-range hardware, verify 60 fps with stats panel.
4. Audit bundle size: run `pnpm build` and check output size; flag anything over 2 MB gzipped.
5. Check for console errors and warnings in both development and production builds.
6. Verify all environment variables are documented and no secrets are hardcoded.
7. Review the README for accuracy and completeness.
8. Confirm the deploy preview works end-to-end (load, navigate, interact, search).
9. Run `npm audit` to check for known vulnerabilities in dependencies.
10. Tag the release with a conventional version number.

## Key Files
- `package.json` - scripts and dependencies.
- `.claude/rules/repo-hygiene.md` - commit and branch conventions.
- `.claude/rules/performance.md` - performance budgets.
