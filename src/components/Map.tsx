import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import our data
import { stations } from '../data/stations';
import { routeGeometry } from '../data/routeGeometry';
import { useTrainStore } from '../stores/trainStore';

interface MapProps {
  className?: string;
}

const Map = ({ className = '' }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Train simulation state
  const { 
    trainPositions, 
    startSimulation, 
    stopSimulation, 
    isSimulationRunning 
  } = useTrainStore();

  const getRouteColor = useCallback((routeId: string): string => {
    switch (routeId) {
      case 'marmaray-full':
        return '#1E40AF'; // Deep blue
      case 'marmaray-short':
        return '#059669'; // Emerald green  
      case 'marmaray-evening':
        return '#DC2626'; // Red
      default:
        return '#1E40AF';
    }
  }, []);

  const addMarmarayRoutes = useCallback(() => {
    if (!map.current) return;

    // Add route sources
    Object.entries(routeGeometry).forEach(([routeId, geometry]) => {
      // Add source
      map.current!.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { routeId },
          geometry: geometry
        }
      });

      // Add route line layer
      map.current!.addLayer({
        id: `${routeId}-line`,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': getRouteColor(routeId),
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    });
  }, [getRouteColor]);

  const addStationMarkers = useCallback(() => {
    if (!map.current) return;

    // Add stations source
    map.current.addSource('stations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: stations.map(station => ({
          type: 'Feature',
          properties: {
            id: station.id,
            name: station.name,
            distance: station.distanceFromStart
          },
          geometry: {
            type: 'Point',
            coordinates: station.coordinates
          }
        }))
      }
    });

    // Add station base (larger circle)
    map.current.addLayer({
      id: 'station-base',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-color': '#374151',
        'circle-radius': 8,
        'circle-opacity': 0.9
      }
    });

    // Add station inner circle
    map.current.addLayer({
      id: 'stations',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-color': '#F3F4F6',
        'circle-radius': 5,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#1F2937'
      }
    });

    // Add station labels
    map.current.addLayer({
      id: 'station-labels',
      type: 'symbol',
      source: 'stations',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-offset': [0, 2],
        'text-anchor': 'top',
        'text-size': 12
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Add click handler for stations
    map.current.on('click', 'stations', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const station = e.features[0];
      const coordinates = (station.geometry as GeoJSON.Point).coordinates.slice();
      const properties = station.properties;

      // Create popup
      new mapboxgl.Popup()
        .setLngLat([coordinates[0], coordinates[1]])
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
              ${properties?.name}
            </h3>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${properties?.distance} km from Halkalı
            </p>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'stations', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'stations', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });
  }, []);

  const addTrainLayer = useCallback(() => {
    if (!map.current) return;

    // Add empty train source initially
    map.current.addSource('trains', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add train icons layer with route-based colors
    map.current.addLayer({
      id: 'trains',
      type: 'circle',
      source: 'trains',
      paint: {
        'circle-color': [
          'match',
          ['get', 'routeId'],
          'marmaray-full', '#1E40AF',
          'marmaray-short', '#059669', 
          'marmaray-evening', '#DC2626',
          '#1E40AF' // fallback color
        ],
        'circle-radius': 10,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': 0.9
      }
    });

    // Add directional arrows inside circles
    map.current.addLayer({
      id: 'train-direction',
      type: 'symbol',
      source: 'trains',
      layout: {
        'text-field': [
          'match',
          ['get', 'direction'],
          'forward', '▶',
          'backward', '◀',
          '●' // fallback
        ],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-opacity': 1.0
      }
    });

    // Add click handler for trains (works for both layers)
    const handleTrainClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;
      
      const train = e.features[0];
      const coordinates = (train.geometry as GeoJSON.Point).coordinates.slice();
      const properties = train.properties;

      const routeNames: Record<string, string> = {
        'marmaray-full': 'Full Line (Halkalı ↔ Gebze)',
        'marmaray-short': 'Short Service (Ataköy ↔ Pendik)', 
        'marmaray-evening': 'Evening Service (Pendik → Zeytinburnu)'
      };

      new mapboxgl.Popup()
        .setLngLat([coordinates[0], coordinates[1]])
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
              Train ${properties?.trainId}
            </h3>
            <p style="margin: 0 0 2px 0; font-size: 12px;">
              ${routeNames[properties?.routeId] || properties?.routeId}
            </p>
            <p style="margin: 0 0 2px 0; font-size: 12px;">
              Direction: ${properties?.direction} ${properties?.direction === 'forward' ? '▶' : '◀'}
            </p>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${properties?.fromStation} → ${properties?.toStation}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #999;">
              Progress: ${properties?.progress}%
            </p>
          </div>
        `)
        .addTo(map.current!);
    };

    map.current.on('click', 'trains', handleTrainClick);
    map.current.on('click', 'train-direction', handleTrainClick);

    // Change cursor on hover for both layers
    const setCursorPointer = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    };

    const setCursorDefault = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    };

    map.current.on('mouseenter', 'trains', setCursorPointer);
    map.current.on('mouseleave', 'trains', setCursorDefault);
    map.current.on('mouseenter', 'train-direction', setCursorPointer);
    map.current.on('mouseleave', 'train-direction', setCursorDefault);
  }, []);

  // Update train positions on the map
  const updateTrainsOnMap = useCallback(() => {
    if (!map.current || !map.current.getSource('trains')) return;

    const trainFeatures = trainPositions.map(position => ({
      type: 'Feature' as const,
      properties: {
        trainId: position.trainId,
        routeId: position.routeId,
        direction: position.direction,
        fromStation: position.currentSegment.fromStation.name,
        toStation: position.currentSegment.toStation.name,
        progress: Math.round(position.progress * 100)
      },
      geometry: {
        type: 'Point' as const,
        coordinates: position.coordinates
      }
    }));

    (map.current.getSource('trains') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: trainFeatures
    });
  }, [trainPositions]);

  // Main map initialization effect
  useEffect(() => {
    // Check if Mapbox token is available
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env.local file');
      return;
    }

    // Initialize map only once
    if (map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/light-v11', // Light theme for better visibility
      center: [29.0, 41.0], // Center on Istanbul (longitude, latitude)
      zoom: 10, // Good zoom level to see the entire Marmaray line
      pitch: 0, // 2D view initially
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding data
    map.current.on('load', () => {
      if (!map.current) return;

      // Add Marmaray route sources and layers
      addMarmarayRoutes();
      addStationMarkers();
      addTrainLayer();
      
      // Start train simulation
      startSimulation();
    });

    // Cleanup function
    return () => {
      stopSimulation();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [addMarmarayRoutes, addStationMarkers, addTrainLayer, startSimulation, stopSimulation]);

  // Update trains on the map when positions change
  useEffect(() => {
    updateTrainsOnMap();
  }, [updateTrainsOnMap]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-[280px]">
        <h3 className="text-sm font-bold mb-3 text-gray-800 border-b border-gray-200 pb-2">🗺️ Map Legend</h3>
        
        {/* Route Lines */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold mb-2 text-gray-700">ROUTES</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-5 h-2 bg-[#1E40AF] rounded-sm"></div>
              <span className="font-medium">Full Line</span>
              <span className="text-gray-500 text-[10px]">Halkalı ↔ Gebze</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-2 bg-[#059669] rounded-sm"></div>
              <span className="font-medium">Short Service</span>
              <span className="text-gray-500 text-[10px]">Ataköy ↔ Pendik</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-2 bg-[#DC2626] rounded-sm"></div>
              <span className="font-medium">Evening Service</span>
              <span className="text-gray-500 text-[10px]">Pendik → Zeytinburnu</span>
            </div>
          </div>
        </div>
        
        {/* Stations */}
        <div className="mb-3 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-semibold mb-2 text-gray-700">STATIONS</h4>
          <div className="flex items-center gap-3 text-xs">
            <div className="relative">
              <div className="w-4 h-4 bg-[#374151] rounded-full"></div>
              <div className="absolute inset-[3px] bg-[#F3F4F6] border border-[#1F2937] rounded-full"></div>
            </div>
            <span>Station (click for details)</span>
          </div>
        </div>

        {/* Active Trains */}
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-xs font-semibold mb-2 text-gray-700">LIVE TRAINS ({trainPositions.length} active)</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs">
              <div className="relative">
                <div className="w-4 h-4 bg-[#1E40AF] border-2 border-white rounded-full shadow-sm"></div>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">▶</span>
              </div>
              <span>Full Line (Forward/Backward)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="relative">
                <div className="w-4 h-4 bg-[#059669] border-2 border-white rounded-full shadow-sm"></div>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">◀</span>
              </div>
              <span>Short Service (Forward/Backward)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="relative">
                <div className="w-4 h-4 bg-[#DC2626] border-2 border-white rounded-full shadow-sm"></div>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">▶</span>
              </div>
              <span>Evening Service (20:50-23:30)</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <span>▶ Forward direction</span>
              <span className="mx-1">•</span>
              <span>◀ Backward direction</span>
            </div>
          </div>
        </div>
        
        {isSimulationRunning && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Simulation</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator for missing token */}
      {!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Configuration Required</h3>
            <p className="text-gray-600 text-sm">
              Please add your Mapbox access token to <code>.env.local</code>:
            </p>
            <code className="block mt-2 p-2 bg-gray-200 rounded text-xs">
              VITE_MAPBOX_ACCESS_TOKEN=your_token_here
            </code>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;