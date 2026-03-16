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
    canopyColor: '#1B5E20',
    canopyColorDark: '#0D3311',
    canopyColorHighlight: '#4CAF50',
    barkColor: '#5D4037',
    barkColorDark: '#3E2723',
    description: 'Narrow conifers with sharp, precise silhouettes',
  },
  FINTECH: {
    sector: 'FINTECH',
    label: 'Fintech',
    canopyShape: 'dome',
    canopyColor: '#2E7D32',
    canopyColorDark: '#1B4D1F',
    canopyColorHighlight: '#66BB6A',
    barkColor: '#6D4C41',
    barkColorDark: '#4E342E',
    description: 'Sturdy upright hardwoods with solid canopies',
  },
  CLIMATE_ENERGY: {
    sector: 'CLIMATE_ENERGY',
    label: 'Climate & Energy',
    canopyShape: 'broad',
    canopyColor: '#33691E',
    canopyColorDark: '#1A3A0E',
    canopyColorHighlight: '#8BC34A',
    barkColor: '#795548',
    barkColorDark: '#4E342E',
    description: 'Resilient broad canopies with expansive reach',
  },
  BIOTECH: {
    sector: 'BIOTECH',
    label: 'Biotech',
    canopyShape: 'organic',
    canopyColor: '#6A1B9A',
    canopyColorDark: '#38006B',
    canopyColorHighlight: '#AB47BC',
    barkColor: '#5D4037',
    barkColorDark: '#3E2723',
    description: 'Branching organic forms with complex structure',
  },
  CONSUMER: {
    sector: 'CONSUMER',
    label: 'Consumer',
    canopyShape: 'round',
    canopyColor: '#E65100',
    canopyColorDark: '#8C3100',
    canopyColorHighlight: '#FF9800',
    barkColor: '#8D6E63',
    barkColorDark: '#5D4037',
    description: 'Expressive forms with warm, colorful canopies',
  },
  DEVELOPER_TOOLS: {
    sector: 'DEVELOPER_TOOLS',
    label: 'Developer Tools',
    canopyShape: 'angular',
    canopyColor: '#0D47A1',
    canopyColorDark: '#062561',
    canopyColorHighlight: '#42A5F5',
    barkColor: '#616161',
    barkColorDark: '#424242',
    description: 'Clean geometric silhouettes with precise edges',
  },
  ENTERPRISE: {
    sector: 'ENTERPRISE',
    label: 'Enterprise',
    canopyShape: 'columnar',
    canopyColor: '#1565C0',
    canopyColorDark: '#0A3770',
    canopyColorHighlight: '#64B5F6',
    barkColor: '#6D4C41',
    barkColorDark: '#3E2723',
    description: 'Tall columnar forms reflecting institutional stability',
  },
  HEALTHCARE: {
    sector: 'HEALTHCARE',
    label: 'Healthcare',
    canopyShape: 'spreading',
    canopyColor: '#00695C',
    canopyColorDark: '#003D33',
    canopyColorHighlight: '#4DB6AC',
    barkColor: '#795548',
    barkColorDark: '#4E342E',
    description: 'Spreading protective canopies with healing tones',
  },
  EDUCATION: {
    sector: 'EDUCATION',
    label: 'Education',
    canopyShape: 'weeping',
    canopyColor: '#4527A0',
    canopyColorDark: '#1A0F50',
    canopyColorHighlight: '#7E57C2',
    barkColor: '#6D4C41',
    barkColorDark: '#4E342E',
    description: 'Graceful weeping forms suggesting growth and nurture',
  },
  OTHER: {
    sector: 'OTHER',
    label: 'Other',
    canopyShape: 'round',
    canopyColor: '#37474F',
    canopyColorDark: '#1C2529',
    canopyColorHighlight: '#78909C',
    barkColor: '#757575',
    barkColorDark: '#424242',
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
