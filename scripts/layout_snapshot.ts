// Layout step for the dataset pipeline. Reads a companies JSON from argv,
// runs the tested @venture-forest/layout-engine (groves + deterministic
// radial placement), and writes {groves, placements} JSON to stdout file.
//
// Run with: pnpm --filter @venture-forest/api exec tsx ../../scripts/layout_snapshot.ts <in> <out>
// (tsx is an api devDependency; both packages export TS source directly)
import { readFileSync, writeFileSync } from 'node:fs';
import {
  allocateGroves,
  computeRadialPlacements,
} from '../packages/layout-engine/src/index.js';
import type { Company } from '../packages/shared-types/src/index.js';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('usage: tsx layout_snapshot.ts <companies.json> <out.json>');
  process.exit(1);
}

const companies: Company[] = JSON.parse(readFileSync(inPath, 'utf8'));

// Ring sized for ~280 trees in 10 groves. A tighter ring with slightly
// larger groves keeps the forest reading as one continuous band with mild
// neighbor overlap instead of a donut with a barren center; world extent
// lands around 175 units
const groves = allocateGroves(companies, {
  ringRadius: 118,
  baseGroveRadius: 22,
  seed: 42,
});

const placements = computeRadialPlacements(companies, groves, {
  minSpacing: 3,
  seed: 42,
});

writeFileSync(outPath, JSON.stringify({ groves, placements }));
console.error(
  `layout: ${companies.length} companies, ${groves.length} groves, ${placements.length} placements`,
);
