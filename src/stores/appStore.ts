import { create } from 'zustand';

const STORAGE_KEY = 'rayda.product.v1';

interface PersistedState {
  selectedStationId: string;
  fromStationId: string;
  toStationId: string;
  favorites: string[];
  hiddenLines: string[];
  panels: Panels;
}

export interface Panels {
  departures: boolean;
  journey: boolean;
  summary: boolean;
}

interface AppState extends PersistedState {
  /** Journey option chosen in the planner; null means the first (soonest) one. */
  journeyOptionId: string | null;
  /** Map focuses on the journey: other lines dim, view fits the route. */
  journeyFocus: boolean;
  selectJourney: (optionId: string | null) => void;
  setJourneyFocus: (focus: boolean) => void;
  setSelectedStation: (stationId: string) => void;
  setFromStation: (stationId: string) => void;
  setToStation: (stationId: string) => void;
  swapStations: () => void;
  setRoute: (fromStationId: string, toStationId: string) => void;
  toggleFavorite: (stationId: string) => void;
  setHiddenLines: (lineIds: string[]) => void;
  togglePanel: (panel: keyof Panels) => void;
}

const DEFAULTS: PersistedState = {
  selectedStationId: '',
  fromStationId: '',
  toStationId: '',
  favorites: ['234', '282'],
  hiddenLines: [],
  panels: { departures: true, journey: true, summary: false },
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      selectedStationId: DEFAULTS.selectedStationId,
      fromStationId: DEFAULTS.fromStationId,
      toStationId: DEFAULTS.toStationId,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULTS.favorites,
      hiddenLines: Array.isArray(parsed.hiddenLines) ? parsed.hiddenLines : DEFAULTS.hiddenLines,
      panels: { ...DEFAULTS.panels, ...parsed.panels },
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: PersistedState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedStationId: state.selectedStationId,
        fromStationId: state.fromStationId,
        toStationId: state.toStationId,
        favorites: state.favorites,
        hiddenLines: state.hiddenLines,
        panels: state.panels,
      })
    );
  } catch {
    // Persistence is a progressive enhancement.
  }
}

export const useAppStore = create<AppState>((set, get) => {
  const initial = loadPersisted();

  const commit = (patch: Partial<PersistedState>) => {
    set(patch);
    persist({ ...get(), ...patch });
  };

  return {
    ...initial,
    journeyOptionId: null,
    journeyFocus: false,

    selectJourney: (optionId) => set({ journeyOptionId: optionId, journeyFocus: true }),
    setJourneyFocus: (focus) => set({ journeyFocus: focus }),

    setSelectedStation: (stationId) => commit({ selectedStationId: stationId }),

    setFromStation: (stationId) => {
      const { toStationId } = get();
      set({ journeyOptionId: null, journeyFocus: true });
      commit({
        fromStationId: stationId,
        toStationId: stationId === toStationId ? '' : toStationId,
      });
    },

    setToStation: (stationId) => {
      const { fromStationId } = get();
      set({ journeyOptionId: null, journeyFocus: true });
      commit({
        toStationId: stationId,
        fromStationId: stationId === fromStationId ? '' : fromStationId,
      });
    },

    setRoute: (fromStationId, toStationId) => {
      set({ journeyOptionId: null, journeyFocus: true });
      commit({ fromStationId, toStationId });
    },

    swapStations: () => {
      const { fromStationId, toStationId } = get();
      set({ journeyOptionId: null, journeyFocus: true });
      commit({ fromStationId: toStationId, toStationId: fromStationId });
    },

    toggleFavorite: (stationId) => {
      const { favorites } = get();
      commit({
        favorites: favorites.includes(stationId)
          ? favorites.filter((id) => id !== stationId)
          : [...favorites, stationId],
      });
    },

    setHiddenLines: (lineIds) => commit({ hiddenLines: lineIds }),

    togglePanel: (panel) => {
      const { panels } = get();
      commit({ panels: { ...panels, [panel]: !panels[panel] } });
    },
  };
});
