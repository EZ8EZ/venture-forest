# Dependency Discipline

## Before Adding a Package
- Check the bundle size impact using bundlephobia.com or `npx import-cost`.
- Confirm the package is actively maintained (updated within the last 6 months).
- Verify it has no known critical vulnerabilities via `npm audit`.

## Preferred Stack
- 3D: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing.
- UI: tailwindcss, framer-motion.
- Data: zod, drizzle-orm.
- Server: hono.
- Do not introduce alternatives (e.g., styled-components, MobX) without strong justification.

## Removal
- Audit unused dependencies quarterly with `depcheck`.
- Remove packages that are only used in commented-out or dead code.
- Pin major versions in `package.json`; use exact versions for critical rendering libraries.
