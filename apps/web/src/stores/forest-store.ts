import { create } from 'zustand';

export type ViewMode = 'explore' | 'investor' | 'compare';
export type QualityPreset = 'low' | 'medium' | 'high';
export type GroupingMode = 'sector' | 'vintage';

export interface CameraTarget {
  x: number;
  y: number;
  z: number;
  lookAt?: { x: number; y: number; z: number };
}

export const DEFAULT_CAMERA = { x: 96, y: 66, z: 152 };

interface ForestState {
  // Loading
  isLoading: boolean;
  loadProgress: number;
  setLoading: (loading: boolean) => void;
  setLoadProgress: (progress: number) => void;

  // Selection
  selectedCompanyId: string | null;
  hoveredCompanyId: string | null;
  selectCompany: (id: string | null) => void;
  hoverCompany: (id: string | null) => void;

  // Compare
  compareIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Investor mode
  selectedInvestorId: string | null;
  selectInvestor: (id: string | null) => void;

  // Camera
  cameraTarget: CameraTarget | null;
  setCameraTarget: (target: CameraTarget | null) => void;
  resetCamera: () => void;

  // Grouping
  groupingMode: GroupingMode;
  setGroupingMode: (mode: GroupingMode) => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;

  // UI panels
  showSearch: boolean;
  showFilters: boolean;
  showLegend: boolean;
  showMinimap: boolean;
  showSettings: boolean;
  toggleSearch: () => void;
  toggleFilters: () => void;
  toggleLegend: () => void;
  toggleMinimap: () => void;
  toggleSettings: () => void;

  // Settings
  quality: QualityPreset;
  reducedMotion: boolean;
  showLabels: boolean;
  setQuality: (q: QualityPreset) => void;
  setReducedMotion: (v: boolean) => void;
  setShowLabels: (v: boolean) => void;
}

export interface FilterState {
  sectors: string[];
  fundingMin: number | null;
  fundingMax: number | null;
  headcountBuckets: string[];
  foundedAfter: number | null;
  foundedBefore: number | null;
  statuses: string[];
  countries: string[];
  roundTypes: string[];
  searchQuery: string;
}

const defaultFilters: FilterState = {
  sectors: [],
  fundingMin: null,
  fundingMax: null,
  headcountBuckets: [],
  foundedAfter: null,
  foundedBefore: null,
  statuses: [],
  countries: [],
  roundTypes: [],
  searchQuery: '',
};

export const useForestStore = create<ForestState>((set) => ({
  // Loading
  isLoading: true,
  loadProgress: 0,
  setLoading: (isLoading) => set({ isLoading }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),

  // Selection
  selectedCompanyId: null,
  hoveredCompanyId: null,
  selectCompany: (id) =>
    set(() => ({
      selectedCompanyId: id,
      // When deselecting, also clear investor mode
      ...(id === null
        ? { selectedInvestorId: null, viewMode: 'explore' as ViewMode }
        : {}),
    })),
  hoverCompany: (id) => set({ hoveredCompanyId: id }),

  // Compare
  compareIds: [],
  addToCompare: (id) =>
    set((s) => ({
      compareIds: s.compareIds.includes(id)
        ? s.compareIds
        : s.compareIds.length < 4
          ? [...s.compareIds, id]
          : s.compareIds,
    })),
  removeFromCompare: (id) =>
    set((s) => ({ compareIds: s.compareIds.filter((c) => c !== id) })),
  clearCompare: () => set({ compareIds: [] }),

  // View mode
  viewMode: 'explore',
  setViewMode: (viewMode) => set({ viewMode }),

  // Investor
  selectedInvestorId: null,
  selectInvestor: (id) =>
    set({
      selectedInvestorId: id,
      viewMode: id ? 'investor' : 'explore',
      selectedCompanyId: null,
    }),

  // Camera
  cameraTarget: null,
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),
  resetCamera: () =>
    set({
      cameraTarget: { x: DEFAULT_CAMERA.x, y: DEFAULT_CAMERA.y, z: DEFAULT_CAMERA.z },
      selectedCompanyId: null,
      selectedInvestorId: null,
      viewMode: 'explore',
    }),

  // Grouping
  groupingMode: 'sector',
  setGroupingMode: (groupingMode) => set({ groupingMode }),

  // Filters
  filters: defaultFilters,
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  clearFilters: () => set({ filters: defaultFilters }),

  // UI panels
  showSearch: false,
  showFilters: false,
  showLegend: false,
  showMinimap: true,
  showSettings: false,
  toggleSearch: () => set((s) => ({ showSearch: !s.showSearch })),
  toggleFilters: () => set((s) => ({ showFilters: !s.showFilters })),
  toggleLegend: () => set((s) => ({ showLegend: !s.showLegend })),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),

  // Settings
  quality: 'high',
  reducedMotion: false,
  showLabels: true,
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setShowLabels: (showLabels) => set({ showLabels }),
}));
