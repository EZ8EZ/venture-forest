# Testing Rules

## Unit Tests (Vitest)
- Use Vitest for all non-visual logic: data normalization, layout algorithms, utility functions.
- Co-locate test files next to source files using the `.test.ts` suffix.
- Mock external services (API calls, database) at the boundary; never mock internal modules.

## End-to-End Tests (Playwright)
- Use Playwright for critical user flows: page load, camera navigation, company detail panel.
- Run e2e tests against the Vite dev server or a preview build.
- Keep e2e tests focused; each test should verify one flow, not the entire app.

## What to Test
- Data pipeline: normalization functions, schema validation, conflict resolution.
- Layout engine: grid placement, grove clustering, edge cases (zero companies, one company).
- UI overlays: panel open/close, content rendering, keyboard navigation.

## What Not to Test
- Do not unit-test React Three Fiber render output; rely on visual regression instead.
- Do not test third-party library internals.

## Visual Regression
- Capture screenshots of key camera angles on each PR using Playwright.
- Store baseline images in the repo; review diffs in CI.
- Accept minor anti-aliasing differences across platforms.
