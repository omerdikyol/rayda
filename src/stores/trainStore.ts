import { create } from 'zustand';
import { TrainSimulationEngine, type TrainPosition } from '../utils/trainSimulation';

interface TrainStore {
  // State
  trainPositions: TrainPosition[];
  simulationEngine: TrainSimulationEngine;
  isSimulationRunning: boolean;
  lastUpdateTime: Date;
  
  // Actions
  startSimulation: () => void;
  stopSimulation: () => void;
  updateTrainPositions: () => void;
  getTrainsForRoute: (routeId: string) => TrainPosition[];
}

export const useTrainStore = create<TrainStore>((set, get) => {
  let updateInterval: number | null = null;
  const simulationEngine = new TrainSimulationEngine();

  return {
    // Initial state
    trainPositions: [],
    simulationEngine,
    isSimulationRunning: false,
    lastUpdateTime: new Date(),

    // Start the simulation with regular updates
    startSimulation: () => {
      const { isSimulationRunning } = get();
      
      if (isSimulationRunning) return; // Already running

      // Update immediately
      get().updateTrainPositions();

      // Set up interval for regular updates (every 5 seconds)
      updateInterval = setInterval(() => {
        get().updateTrainPositions();
        
        // Cleanup old trains every 5 minutes
        if (Date.now() % (5 * 60 * 1000) < 5000) {
          simulationEngine.cleanup();
        }
      }, 5000);

      set({ isSimulationRunning: true });
    },

    // Stop the simulation
    stopSimulation: () => {
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
      
      set({ 
        isSimulationRunning: false,
        trainPositions: []
      });
    },

    // Update train positions
    updateTrainPositions: () => {
      const currentTime = new Date();
      const positions = simulationEngine.updateTrainPositions(currentTime);
      
      set({ 
        trainPositions: positions,
        lastUpdateTime: currentTime
      });
    },

    // Get trains for a specific route
    getTrainsForRoute: (routeId: string) => {
      const { trainPositions } = get();
      return trainPositions.filter(pos => pos.routeId === routeId);
    }
  };
});