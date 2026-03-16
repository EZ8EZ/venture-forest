import type { Sector } from './types';

export interface SpeciesConfig {
  sector: Sector;
  label: string;
  canopyShape: 'cone' | 'dome' | 'broad' | 'organic' | 'round' | 'angular' | 'spire' | 'weeping' | 'columnar' | 'spreading';
  canopyColor: string;
  canopyColorDark: string;
  canopyColorHighlight: string;
  barkColor: string;
  barkColorDark: string;
  description: string;
}

export const SPECIES_MAP: Record<Sector, SpeciesConfig> = {
  AI_ML: {
    sector: 'AI_ML',
    label: 'AI & Machine Learning',
    canopyShape: 'cone',
    canopyColor: '#2E8B3E',
    canopyColorDark: '#14461E',
    canopyColorHighlight: '#66D96A',
    barkColor: '#7D5A47',
    barkColorDark: '#4E3628',
    description: 'Narrow conifers with sharp, precise silhouettes',
  },
  FINTECH: {
    sector: 'FINTECH',
    label: 'Fintech',
    canopyShape: 'dome',
    canopyColor: '#3DA044',
    canopyColorDark: '#1F5C24',
    canopyColorHighlight: '#7ED87E',
    barkColor: '#8D6E55',
    barkColorDark: '#5A4234',
    description: 'Sturdy upright hardwoods with solid canopies',
  },
  CLIMATE_ENERGY: {
    sector: 'CLIMATE_ENERGY',
    label: 'Climate & Energy',
    canopyShape: 'broad',
    canopyColor: '#4A8C2A',
    canopyColorDark: '#264A14',
    canopyColorHighlight: '#A4DD5E',
    barkColor: '#907060',
    barkColorDark: '#5A4234',
    description: 'Resilient broad canopies with expansive reach',
  },
  BIOTECH: {
    sector: 'BIOTECH',
    label: 'Biotech',
    canopyShape: 'organic',
    canopyColor: '#8E3CB8',
    canopyColorDark: '#4A1A6A',
    canopyColorHighlight: '#C96EE0',
    barkColor: '#7D5A47',
    barkColorDark: '#4E3628',
    description: 'Branching organic forms with complex structure',
  },
  CONSUMER: {
    sector: 'CONSUMER',
    label: 'Consumer',
    canopyShape: 'round',
    canopyColor: '#E87820',
    canopyColorDark: '#9A4A10',
    canopyColorHighlight: '#FFB050',
    barkColor: '#A08070',
    barkColorDark: '#6A5040',
    description: 'Expressive forms with warm, colorful canopies',
  },
  DEVELOPER_TOOLS: {
    sector: 'DEVELOPER_TOOLS',
    label: 'Developer Tools',
    canopyShape: 'angular',
    canopyColor: '#2668CC',
    canopyColorDark: '#103870',
    canopyColorHighlight: '#5ABAFF',
    barkColor: '#808080',
    barkColorDark: '#555555',
    description: 'Clean geometric silhouettes with precise edges',
  },
  ENTERPRISE: {
    sector: 'ENTERPRISE',
    label: 'Enterprise',
    canopyShape: 'columnar',
    canopyColor: '#2880DD',
    canopyColorDark: '#104880',
    canopyColorHighlight: '#7CC4FF',
    barkColor: '#8D6E55',
    barkColorDark: '#4E3628',
    description: 'Tall columnar forms reflecting institutional stability',
  },
  HEALTHCARE: {
    sector: 'HEALTHCARE',
    label: 'Healthcare',
    canopyShape: 'spreading',
    canopyColor: '#1A9080',
    canopyColorDark: '#0A4840',
    canopyColorHighlight: '#60DCC8',
    barkColor: '#907060',
    barkColorDark: '#5A4234',
    description: 'Spreading protective canopies with healing tones',
  },
  EDUCATION: {
    sector: 'EDUCATION',
    label: 'Education',
    canopyShape: 'weeping',
    canopyColor: '#6640C0',
    canopyColorDark: '#301A6A',
    canopyColorHighlight: '#A07AE8',
    barkColor: '#8D6E55',
    barkColorDark: '#5A4234',
    description: 'Graceful weeping forms suggesting growth and nurture',
  },
  OTHER: {
    sector: 'OTHER',
    label: 'Other',
    canopyShape: 'round',
    canopyColor: '#506878',
    canopyColorDark: '#283840',
    canopyColorHighlight: '#90B0C0',
    barkColor: '#909090',
    barkColorDark: '#555555',
    description: 'General-purpose forms for uncategorized companies',
  },
};

export function getSpecies(sector: Sector): SpeciesConfig {
  return SPECIES_MAP[sector] || SPECIES_MAP.OTHER;
}

export const SECTOR_ORDER: Sector[] = [
  'AI_ML',
  'FINTECH',
  'CLIMATE_ENERGY',
  'BIOTECH',
  'CONSUMER',
  'DEVELOPER_TOOLS',
  'ENTERPRISE',
  'HEALTHCARE',
  'EDUCATION',
  'OTHER',
];
