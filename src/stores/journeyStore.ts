import { create } from 'zustand';
import type { Station } from '../types';
import { useTrainStore } from './trainStore';
import {
  calculateJourney,
  calculateAllJourneys,
  type JourneyPlan,
  type JourneyOptions
} from '../utils/journeyPlanner';

interface JourneyStore {
  // State
  fromStation: Station | null;
  toStation: Station | null;
  currentJourney: JourneyPlan | null;
  allJourneys: JourneyPlan[];
  isCalculating: boolean;
  lastCalculationTime: Date | null;
  
  // Actions
  setFromStation: (station: Station | null) => void;
  setToStation: (station: Station | null) => void;
  swapStations: () => void;
  calculateRoute: (options?: JourneyOptions) => void;
  clearJourney: () => void;
  refreshJourney: () => void;
}

export const useJourneyStore = create<JourneyStore>((set, get) => {
  // Set up automatic refresh when journey is active
  let refreshInterval: number | null = null;
  
  const startAutoRefresh = () => {
    if (refreshInterval) return;
    
    refreshInterval = setInterval(() => {
      const { fromStation, toStation } = get();
      if (fromStation && toStation) {
        get().refreshJourney();
      }
    }, 30000); // Refresh every 30 seconds
  };
  
  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };

  return {
    // Initial state
    fromStation: null,
    toStation: null,
    currentJourney: null,
    allJourneys: [],
    isCalculating: false,
    lastCalculationTime: null,

    // Set origin station
    setFromStation: (station: Station | null) => {
      set({ fromStation: station });
      
      // Auto-calculate if both stations are set
      const { toStation } = get();
      if (station && toStation && station.id !== toStation.id) {
        get().calculateRoute();
      } else if (!station) {
        get().clearJourney();
      }
    },

    // Set destination station
    setToStation: (station: Station | null) => {
      set({ toStation: station });
      
      // Auto-calculate if both stations are set
      const { fromStation } = get();
      if (station && fromStation && station.id !== fromStation.id) {
        get().calculateRoute();
      } else if (!station) {
        get().clearJourney();
      }
    },

    // Swap origin and destination
    swapStations: () => {
      const { fromStation, toStation } = get();
      set({ 
        fromStation: toStation, 
        toStation: fromStation 
      });
      
      // Recalculate if both stations exist
      if (fromStation && toStation) {
        get().calculateRoute();
      }
    },

    // Calculate journey route
    calculateRoute: (options: JourneyOptions = {}) => {
      const { fromStation, toStation } = get();
      
      if (!fromStation || !toStation || fromStation.id === toStation.id) {
        set({ 
          currentJourney: null, 
          allJourneys: [],
          lastCalculationTime: null 
        });
        stopAutoRefresh();
        return;
      }

      set({ isCalculating: true });
      
      try {
        const trainPositions = useTrainStore.getState().trainPositions;
        
        // Calculate the best journey
        const bestJourney = calculateJourney(
          fromStation.id,
          toStation.id,
          trainPositions,
          options
        );
        
        // Calculate all possible journeys (for future use)
        const allJourneys = calculateAllJourneys(
          fromStation.id,
          toStation.id,
          trainPositions,
          options
        );

        set({
          currentJourney: bestJourney,
          allJourneys,
          isCalculating: false,
          lastCalculationTime: new Date()
        });

        // Start auto-refresh if journey found
        if (bestJourney) {
          startAutoRefresh();
        } else {
          stopAutoRefresh();
        }
        
      } catch (error) {
        console.error('Error calculating journey:', error);
        set({
          currentJourney: null,
          allJourneys: [],
          isCalculating: false,
          lastCalculationTime: new Date()
        });
        stopAutoRefresh();
      }
    },

    // Clear current journey
    clearJourney: () => {
      stopAutoRefresh();
      set({
        fromStation: null,
        toStation: null,
        currentJourney: null,
        allJourneys: [],
        lastCalculationTime: null
      });
    },

    // Refresh current journey with latest train positions
    refreshJourney: () => {
      const { fromStation, toStation, currentJourney } = get();
      
      if (fromStation && toStation && currentJourney) {
        // Recalculate quietly without showing loading state
        try {
          const trainPositions = useTrainStore.getState().trainPositions;
          
          const refreshedJourney = calculateJourney(
            fromStation.id,
            toStation.id,
            trainPositions
          );

          if (refreshedJourney) {
            set({
              currentJourney: refreshedJourney,
              lastCalculationTime: new Date()
            });
          }
        } catch (error) {
          console.error('Error refreshing journey:', error);
        }
      }
    }
  };
});