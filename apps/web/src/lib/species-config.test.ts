import { describe, it, expect } from 'vitest';
import { SPECIES_MAP, SECTOR_ORDER, getSpecies } from './species-config';
import type { Sector } from './types';

describe('species-config', () => {
  it('covers every sector in SECTOR_ORDER', () => {
    for (const sector of SECTOR_ORDER) {
      expect(SPECIES_MAP[sector]).toBeDefined();
    }
    expect(SECTOR_ORDER).toHaveLength(Object.keys(SPECIES_MAP).length);
  });

  it('defines complete color sets for every species', () => {
    for (const sector of SECTOR_ORDER) {
      const s = SPECIES_MAP[sector];
      expect(s.canopyColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.canopyColorDark).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.canopyColorHighlight).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.barkColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.barkColorDark).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('falls back to OTHER for unknown sectors', () => {
    expect(getSpecies('NOT_A_SECTOR' as Sector)).toBe(SPECIES_MAP.OTHER);
  });
});
