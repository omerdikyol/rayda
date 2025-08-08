# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rayda is a real-time simulation web application for the Marmaray train line in Istanbul. The app visualizes train positions on an interactive map based on schedule data and provides station-specific arrival times. See PRD.md for complete requirements.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

## Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript 5.8
- **Mapping**: Mapbox GL JS for interactive map and train animations
- **State Management**: Zustand for simulation state
- **Styling**: Tailwind CSS with Radix UI components (dropdown-menu, select, tooltip)
- **Build Tool**: Vite
- **Date Utilities**: date-fns for time calculations

### Core Data Flow
The app simulates train movement using a time-based calculation system:

1. **Static Data**: Station coordinates, routes, and inter-station travel times (src/data/)
2. **Simulation Engine**: Calculates real-time train positions based on current time and schedules
3. **State Management**: Zustand stores manage train positions, selected stations, and timetables
4. **Map Rendering**: Mapbox GL displays animated train icons moving along route geometry
5. **Station Interface**: Users select stations to view upcoming arrival times

### Key Types (src/types/index.ts)
- `Station`: Station data with coordinates and distances
- `Route`: Route patterns with different termini and frequencies (Halkalı↔Gebze, Ataköy↔Pendik)
- `Train`: Individual train instances with positions and timing
- `InterStationTime`: Travel times between consecutive stations
- `Timetable`: Station-specific arrival predictions

### Project Structure
- `src/components/` - React components
- `src/stores/` - Zustand state management
- `src/hooks/` - Custom React hooks
- `src/data/` - Static data files (stations, routes, travel times)
- `src/utils/` - Utility functions for calculations
- `src/types/` - TypeScript type definitions

### Simulation Logic
The core simulation works by:
1. Generating timetables for multiple route patterns on app load
2. Using setInterval to update train positions every second
3. Calculating train progress between stations using elapsed time and travel data
4. Converting progress to geographic coordinates for map display
5. Aggregating arrival times from all active trains for station timetables

### Data Requirements
Station coordinates and inter-station travel times need to be populated with accurate data from official sources. Current data in src/data/stations.ts are placeholders.

### Environment Configuration
Required environment variable for Mapbox:
- `VITE_MAPBOX_ACCESS_TOKEN` - Your Mapbox access token (set in .env.local)