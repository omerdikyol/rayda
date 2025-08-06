export interface Station {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  distanceFromStart: number; // in km
}

export interface Route {
  id: string;
  name: string;
  termini: [string, string]; // [start station id, end station id]
  frequency: number; // in minutes
  stations: string[]; // ordered list of station ids
  color: string; // hex color for UI
}

export interface Train {
  id: string;
  routeId: string;
  direction: 'forward' | 'backward';
  departureTime: Date;
  currentPosition: {
    fromStationId: string;
    toStationId: string;
    progress: number; // 0-1, progress between stations
    coordinates: [number, number];
  };
}

export interface InterStationTime {
  fromStationId: string;
  toStationId: string;
  time: number; // in seconds
}

export interface Timetable {
  stationId: string;
  arrivals: {
    trainId: string;
    arrivalTime: Date;
    direction: 'forward' | 'backward';
    routeName: string;
    finalDestination: string;
  }[];
}