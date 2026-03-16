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
    canopyColor: '#2B6E3F',
    canopyColorDark: '#143820',
    canopyColorHighlight: '#4CA868',
    barkColor: '#7A5C42',
    barkColorDark: '#4E3828',
    description: 'Dark spruce conifers with dense, precise canopies',
  },
  FINTECH: {
    sector: 'FINTECH',
    label: 'Fintech',
    canopyShape: 'dome',
    canopyColor: '#3D8E48',
    canopyColorDark: '#1E5028',
    canopyColorHighlight: '#6BBF70',
    barkColor: '#8B6B4A',
    barkColorDark: '#5A4230',
    description: 'Sturdy oaks with solid dome canopies',
  },
  CLIMATE_ENERGY: {
    sector: 'CLIMATE_ENERGY',
    label: 'Climate & Energy',
    canopyShape: 'broad',
    canopyColor: '#4A9E40',
    canopyColorDark: '#285520',
    canopyColorHighlight: '#78CC58',
    barkColor: '#8A6848',
    barkColorDark: '#5C4230',
    description: 'Broad maples with expansive leafy canopies',
  },
  BIOTECH: {
    sector: 'BIOTECH',
    label: 'Biotech',
    canopyShape: 'organic',
    canopyColor: '#357848',
    canopyColorDark: '#1A4028',
    canopyColorHighlight: '#58A870',
    barkColor: '#6E5840',
    barkColorDark: '#443428',
    description: 'Ancient magnolias with complex organic branching',
  },
  CONSUMER: {
    sector: 'CONSUMER',
    label: 'Consumer',
    canopyShape: 'round',
    canopyColor: '#8BA040',
    canopyColorDark: '#4E5820',
    canopyColorHighlight: '#B8CC60',
    barkColor: '#C8A878',
    barkColorDark: '#907858',
    description: 'Golden birches with warm autumn-tinted canopies',
  },
  DEVELOPER_TOOLS: {
    sector: 'DEVELOPER_TOOLS',
    label: 'Developer Tools',
    canopyShape: 'spire',
    canopyColor: '#2A7868',
    canopyColorDark: '#144038',
    canopyColorHighlight: '#48A890',
    barkColor: '#786858',
    barkColorDark: '#4E4238',
    description: 'Blue spruce spires with silver-green needles',
  },
  ENTERPRISE: {
    sector: 'ENTERPRISE',
    label: 'Enterprise',
    canopyShape: 'columnar',
    canopyColor: '#1E6848',
    canopyColorDark: '#0E3828',
    canopyColorHighlight: '#3A9870',
    barkColor: '#7A6050',
    barkColorDark: '#4E3830',
    description: 'Tall cypress columns with deep evergreen foliage',
  },
  HEALTHCARE: {
    sector: 'HEALTHCARE',
    label: 'Healthcare',
    canopyShape: 'spreading',
    canopyColor: '#5A9850',
    canopyColorDark: '#305028',
    canopyColorHighlight: '#88C878',
    barkColor: '#988868',
    barkColorDark: '#685840',
    description: 'Spreading elms with broad, sheltering canopies',
  },
  EDUCATION: {
    sector: 'EDUCATION',
    label: 'Education',
    canopyShape: 'weeping',
    canopyColor: '#6A9838',
    canopyColorDark: '#385020',
    canopyColorHighlight: '#98C858',
    barkColor: '#8A7050',
    barkColorDark: '#5A4430',
    description: 'Graceful willows with cascading yellow-green foliage',
  },
  OTHER: {
    sector: 'OTHER',
    label: 'Other',
    canopyShape: 'round',
    canopyColor: '#4A7858',
    canopyColorDark: '#283E30',
    canopyColorHighlight: '#6AA878',
    barkColor: '#8A8070',
    barkColorDark: '#585048',
    description: 'Hardy junipers adapted to varied conditions',
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
