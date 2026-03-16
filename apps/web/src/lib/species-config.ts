import type { Sector } from './types';

export interface SpeciesConfig {
  sector: Sector;
  label: string;
  canopyShape: 'cone' | 'dome' | 'broad' | 'organic' | 'round' | 'spire' | 'weeping' | 'columnar' | 'spreading' | 'angular';
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
    canopyColor: '#3AA04A',
    canopyColorDark: '#1A5028',
    canopyColorHighlight: '#70E878',
    barkColor: '#8D6A50',
    barkColorDark: '#5A4030',
    description: 'Narrow conifers with sharp, precise silhouettes',
  },
  FINTECH: {
    sector: 'FINTECH',
    label: 'Fintech',
    canopyShape: 'dome',
    canopyColor: '#48B050',
    canopyColorDark: '#246830',
    canopyColorHighlight: '#88E888',
    barkColor: '#9A7A60',
    barkColorDark: '#6A4E38',
    description: 'Sturdy hardwoods with solid dome canopies',
  },
  CLIMATE_ENERGY: {
    sector: 'CLIMATE_ENERGY',
    label: 'Climate & Energy',
    canopyShape: 'broad',
    canopyColor: '#58A038',
    canopyColorDark: '#305820',
    canopyColorHighlight: '#B0E868',
    barkColor: '#9A7860',
    barkColorDark: '#6A4E38',
    description: 'Broad spreading canopies with expansive reach',
  },
  BIOTECH: {
    sector: 'BIOTECH',
    label: 'Biotech',
    canopyShape: 'organic',
    canopyColor: '#A050CC',
    canopyColorDark: '#582080',
    canopyColorHighlight: '#D888F0',
    barkColor: '#8D6A50',
    barkColorDark: '#5A4030',
    description: 'Branching organic forms with complex structure',
  },
  CONSUMER: {
    sector: 'CONSUMER',
    label: 'Consumer',
    canopyShape: 'round',
    canopyColor: '#F09030',
    canopyColorDark: '#A85818',
    canopyColorHighlight: '#FFC060',
    barkColor: '#A88878',
    barkColorDark: '#786050',
    description: 'Full rounded canopies with warm tones',
  },
  DEVELOPER_TOOLS: {
    sector: 'DEVELOPER_TOOLS',
    label: 'Developer Tools',
    canopyShape: 'spire',
    canopyColor: '#3880DD',
    canopyColorDark: '#184880',
    canopyColorHighlight: '#68C0FF',
    barkColor: '#909090',
    barkColorDark: '#606060',
    description: 'Tall pointed spires with precise edges',
  },
  ENTERPRISE: {
    sector: 'ENTERPRISE',
    label: 'Enterprise',
    canopyShape: 'columnar',
    canopyColor: '#3898EE',
    canopyColorDark: '#185090',
    canopyColorHighlight: '#88D0FF',
    barkColor: '#9A7A60',
    barkColorDark: '#5A4030',
    description: 'Tall columnar forms reflecting institutional stability',
  },
  HEALTHCARE: {
    sector: 'HEALTHCARE',
    label: 'Healthcare',
    canopyShape: 'spreading',
    canopyColor: '#28A898',
    canopyColorDark: '#105850',
    canopyColorHighlight: '#70EED8',
    barkColor: '#9A7860',
    barkColorDark: '#6A4E38',
    description: 'Spreading protective canopies with healing tones',
  },
  EDUCATION: {
    sector: 'EDUCATION',
    label: 'Education',
    canopyShape: 'weeping',
    canopyColor: '#7850D0',
    canopyColorDark: '#3A2080',
    canopyColorHighlight: '#B088F0',
    barkColor: '#9A7A60',
    barkColorDark: '#6A4E38',
    description: 'Graceful weeping forms suggesting growth and nurture',
  },
  OTHER: {
    sector: 'OTHER',
    label: 'Other',
    canopyShape: 'round',
    canopyColor: '#608898',
    canopyColorDark: '#304850',
    canopyColorHighlight: '#A0C8D8',
    barkColor: '#A0A0A0',
    barkColorDark: '#686868',
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
