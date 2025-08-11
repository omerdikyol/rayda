import { create } from 'zustand';
import { useTrainStore } from './trainStore';
import { stations } from '../data/stations';
import { 
  calculateStationArrivals, 
  type ArrivalPrediction 
} from '../utils/timetableCalculations';

interface TimetableStore {
  // State
  timetables: Map<string, ArrivalPrediction[]>;
  selectedStationId: string | null;
  lastUpdateTime: Date;
  isCalculating: boolean;

  // Actions
  selectStation: (stationId: string | null) => void;
  calculateArrivals: (stationId: string) => ArrivalPrediction[];
  updateTimetables: () => void;
  getTimetableForStation: (stationId: string) => ArrivalPrediction[];
  clearTimetables: () => void;
}

export const useTimetableStore = create<TimetableStore>((set, get) => {
  // Set up automatic updates when train positions change
  let updateInterval: number | null = null;
  
  const startAutoUpdates = () => {
    if (updateInterval) return;
    
    updateInterval = setInterval(() => {
      const { selectedStationId } = get();
      if (selectedStationId) {
        get().updateTimetables();
      }
    }, 15000); // Update every 15 seconds for more real-time feel
  };
  
  const stopAutoUpdates = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };

  return {
    // Initial state
    timetables: new Map(),
    selectedStationId: null,
    lastUpdateTime: new Date(),
    isCalculating: false,

    // Select a station for timetable display
    selectStation: (stationId: string | null) => {
      set({ selectedStationId: stationId });
      
      // If selecting a station, calculate its arrivals and start auto-updates
      if (stationId) {
        get().calculateArrivals(stationId);
        startAutoUpdates();
      } else {
        stopAutoUpdates();
      }
    },

  // Calculate arrival predictions for a specific station
  calculateArrivals: (stationId: string) => {
    set({ isCalculating: true });
    
    try {
      const trainPositions = useTrainStore.getState().trainPositions;
      const station = stations.find(s => s.id === stationId);
      
      if (!station) {
        set({ isCalculating: false });
        return [];
      }

      const arrivals = calculateStationArrivals(stationId, trainPositions, 4);
      
      // Update the timetables map
      const newTimetables = new Map(get().timetables);
      newTimetables.set(stationId, arrivals);
      
      set({ 
        timetables: newTimetables,
        lastUpdateTime: new Date(),
        isCalculating: false
      });
      
      return arrivals;
    } catch (error) {
      console.error('Error calculating arrivals for station', stationId, error);
      set({ isCalculating: false });
      return [];
    }
  },

  // Update timetables for all relevant stations
  updateTimetables: () => {
    const { selectedStationId } = get();
    
    // Only update if we have a selected station
    if (selectedStationId) {
      get().calculateArrivals(selectedStationId);
    }
  },

  // Get timetable for a station (from cache or calculate)
  getTimetableForStation: (stationId: string) => {
    const cached = get().timetables.get(stationId);
    
    // Return cached if recent (less than 30 seconds old)
    if (cached && cached.length > 0) {
      const now = new Date();
      const oldestArrival = Math.min(...cached.map(a => a.arrivalTime.getTime()));
      if (now.getTime() < oldestArrival + 30000) { // 30 seconds buffer
        return cached;
      }
    }
    
    // Calculate fresh arrivals
    return get().calculateArrivals(stationId);
  },

    // Clear all cached timetables
    clearTimetables: () => {
      stopAutoUpdates();
      set({ 
        timetables: new Map(),
        selectedStationId: null,
        lastUpdateTime: new Date()
      });
    }
  };
});

