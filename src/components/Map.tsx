import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import our data
import { stations } from '../data/stations';
import { routeGeometry } from '../data/routeGeometry';
import { useTrainStore } from '../stores/trainStore';
import { useTimetableStore } from '../stores/timetableStore';
import { useJourneyStore } from '../stores/journeyStore';
import { excludedRailwayIds, excludedRailwayNames } from '../data/excludedRailwaySegments';
// Import the real Marmaray railway geometry
import marmarayTrackGeometry from '../data/marmaray-track-geometry.json';

interface MapProps {
  className?: string;
}

const Map = ({ className = '' }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [clickedRailwayInfo, setClickedRailwayInfo] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAreaFeatures, setSelectedAreaFeatures] = useState<any[]>([]);
  const [selectionBox, setSelectionBox] = useState<mapboxgl.LngLatBounds | null>(null);
  const { t } = useLanguage();
  
  // Train simulation state
  const { 
    trainPositions, 
    startSimulation, 
    stopSimulation, 
    isSimulationRunning 
  } = useTrainStore();

  // Timetable state
  const { selectStation } = useTimetableStore();
  
  // Journey planner state
  const { fromStation, toStation, setFromStation, setToStation } = useJourneyStore();

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

    // Filter the railway data to show only main Marmaray passenger line
    // Remove maintenance facilities, freight lines, and extensions beyond service area
    const filteredFeatures = marmarayTrackGeometry.features.filter(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      
      // Skip if no coordinates
      if (!coords || coords.length === 0) return false;
      
      // Skip excluded railway lines by name (non-Marmaray lines)
      if (props.name && excludedRailwayNames.includes(props.name)) {
        console.log(`🚫 Map filtering: Excluding "${props.name}"`);
        return false;
      }
      
      // Exclude by specific IDs that are known to be problematic
      if (props.id && excludedRailwayIds.includes(props.id)) {
        console.log(`🚫 Map filtering: Excluding feature with ID ${props.id}`);
        return false;
      }
      
      // Get approximate bounds of the feature
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      // Filter out tracks beyond Marmaray service area
      // Halkalı: 28.766, Gebze: 29.409 - need wider bounds for full service area
      if (minLng < 28.70 || maxLng > 29.50) return false;
      
      // Filter out tracks beyond the Marmaray corridor
      // Gebze is at 40.784, so we need to allow southern sections
      // But filter out unrelated lines north and south
      if (maxLat < 40.70 || minLat > 41.10) return false;
      
      // Filter out obvious maintenance/freight facilities
      if (props.railway === 'rail') {
        // Keep main passenger lines
        if (props.name === 'Marmaray') return true;
        
        // Keep electrified passenger lines with standard gauge
        if (props.electrified && props.gauge === '1435' && 
            (props.usage === 'main' || !props.usage)) {
          return true;
        }
        
        // Skip service tracks, sidings, freight lines
        if (props.service || props.usage === 'freight' || 
            props.usage === 'industrial' || props.usage === 'branch') {
          return false;
        }
        
        // Skip maintenance yard tracks and depot facilities
        if (props.service === 'yard' || props.service === 'depot' || 
            props.service === 'crossover' || props.service === 'spur') {
          return false;
        }
        
        // Skip tracks with very few coordinate points (likely connectors/sidings)
        if (coords.length < 3) return false;
        
        return true;
      }
      
      return false;
    });

    const filteredGeoJSON = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };

    // Add the filtered Marmaray railway tracks
    map.current.addSource('marmaray-tracks', {
      type: 'geojson',
      data: filteredGeoJSON
    });

    // Add main railway line (surface tracks)
    map.current.addLayer({
      id: 'marmaray-tracks-main',
      type: 'line',
      source: 'marmaray-tracks',
      filter: [
        'all',
        ['!=', ['get', 'tunnel'], 'yes'],
        ['!=', ['get', 'bridge'], 'yes']
      ],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#1E40AF', // Marmaray blue
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 4,
          16, 8
        ],
        'line-opacity': 0.8
      }
    });

    // Add tunnel sections (styled differently)
    map.current.addLayer({
      id: 'marmaray-tracks-tunnel',
      type: 'line',
      source: 'marmaray-tracks',
      filter: ['==', ['get', 'tunnel'], 'yes'],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#059669', // Different color for tunnel
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 4,
          16, 8
        ],
        'line-opacity': 0.9,
        'line-dasharray': [3, 3] // Dashed line for tunnels
      }
    });

    // Add bridge sections
    map.current.addLayer({
      id: 'marmaray-tracks-bridge',
      type: 'line',
      source: 'marmaray-tracks',
      filter: ['==', ['get', 'bridge'], 'yes'],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#DC2626', // Red for bridges
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 4,
          16, 8
        ],
        'line-opacity': 0.9
      }
    });

    console.log(`Filtered to ${filteredFeatures.length} railway segments from ${marmarayTrackGeometry.features.length} total`);
  }, []);

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
      const properties = station.properties;

      // Get the station ID from the properties
      const stationId = properties?.id;
      if (stationId) {
        // Open the station timetable
        selectStation(stationId);
        
        // Dispatch a custom event to notify StationSelector to open
        window.dispatchEvent(new CustomEvent('openStationTimetable', {
          detail: { stationId }
        }));
      }
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
  }, [selectStation]);

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

    // Add train icons layer with route-specific colors and smooth transitions
    map.current.addLayer({
      id: 'trains',
      type: 'circle',
      source: 'trains',
      paint: {
        'circle-color': [
          'match',
          ['get', 'routeId'],
          'marmaray-full', '#1E40AF',      // Blue - Full Line (Halkalı ↔ Gebze)
          'marmaray-short', '#059669',     // Green - Short Service (Ataköy ↔ Pendik)
          'marmaray-evening', '#DC2626',   // Red - Evening Service (Pendik → Zeytinburnu)
          '#1E40AF' // fallback color - Blue
        ],
        'circle-radius': 12,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': 0.9
      },
      layout: {
        'circle-sort-key': 1 // Keep trains on top
      }
    });

    // Add directional arrows inside circles with rotation
    map.current.addLayer({
      id: 'train-direction',
      type: 'symbol',
      source: 'trains',
      layout: {
        'text-field': '▲', // Single upward arrow that will rotate
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-anchor': 'center',
        'text-rotate': ['get', 'bearing'], // Rotate based on bearing
        'text-rotation-alignment': 'viewport', // Keep direction fixed regardless of map rotation
        'text-pitch-alignment': 'viewport'
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-opacity': 1.0,
        'text-halo-color': '#000000',
        'text-halo-width': 1.5
      }
    });

    // Add click handler for trains (works for both layers)
    const handleTrainClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;
      
      const train = e.features[0];
      const coordinates = (train.geometry as GeoJSON.Point).coordinates.slice();
      const properties = train.properties;

      const routeNames: Record<string, string> = {
        'marmaray-full': `${t('fullLine')} (${t('endpoints.halkalı-gebze')})`,
        'marmaray-short': `${t('shortService')} (${t('endpoints.ataköy-pendik')})`, 
        'marmaray-evening': `${t('eveningService')} (${t('endpoints.pendik-zeytinburnu')})`
      };

      // Get destination based on direction
      const getDestination = (routeId: string, direction: string) => {
        if (routeId === 'marmaray-full') {
          return direction === 'forward' ? 'Gebze' : 'Halkalı';
        } else if (routeId === 'marmaray-short') {
          return direction === 'forward' ? 'Pendik' : 'Ataköy';
        } else if (routeId === 'marmaray-evening') {
          return direction === 'forward' ? 'Zeytinburnu' : 'Pendik';
        }
        return direction === 'forward' ? 'Forward' : 'Backward';
      };

      new mapboxgl.Popup()
        .setLngLat([coordinates[0], coordinates[1]])
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
              ${properties?.displayName || `${t('train')} ${properties?.trainId}`}
            </h3>
            <p style="margin: 0 0 2px 0; font-size: 12px; color: #0066CC; font-weight: 500;">
              ${properties?.fullName || `${routeNames[properties?.routeId] || properties?.routeId}`}
            </p>
            <p style="margin: 0 0 2px 0; font-size: 12px;">
              ${t('trainPopupDirection')}: ${getDestination(properties?.routeId, properties?.direction)} ${properties?.direction === 'forward' ? '▶' : '◀'}
            </p>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${properties?.fromStation} → ${properties?.toStation}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #999;">
              ${t('trainPopupProgress')}: ${properties?.progress}% • ${routeNames[properties?.routeId] || properties?.routeId}
            </p>
          </div>
        `)
        .addTo(map.current!);
    };

    map.current.on('click', 'trains', handleTrainClick);
    map.current.on('click', 'train-direction', handleTrainClick);

    // Railway debug click handler - always active, but only shows UI when debug mode is on
    const handleRailwayClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['marmaray-tracks-main', 'marmaray-tracks-tunnel', 'marmaray-tracks-bridge']
      });
      
      if (features && features.length > 0) {
        const feature = features[0];
        console.log('🛤️ Clicked railway feature:', feature.properties);
        
        // Always set the info, the UI will decide whether to show it based on debug mode
        setClickedRailwayInfo({
          ...feature.properties,
          coordinates: feature.geometry.type === 'LineString' ? 
            (feature.geometry as any).coordinates : null
        });
      }
    };

    // Add click handlers for all railway layers
    map.current.on('click', 'marmaray-tracks-main', handleRailwayClick);
    map.current.on('click', 'marmaray-tracks-tunnel', handleRailwayClick);
    map.current.on('click', 'marmaray-tracks-bridge', handleRailwayClick);

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

    // Add hover effects for railway layers - cursor will change when in debug mode
    const railwayLayers = ['marmaray-tracks-main', 'marmaray-tracks-tunnel', 'marmaray-tracks-bridge'];
    railwayLayers.forEach(layerId => {
      map.current!.on('mouseenter', layerId, setCursorPointer);
      map.current!.on('mouseleave', layerId, setCursorDefault);
    });
  }, []);

  // Calculate geographic bearing for rotation
  // Helper function to check if a point is inside a bounding box
  const isPointInBounds = useCallback((point: [number, number], bounds: mapboxgl.LngLatBounds): boolean => {
    const [lng, lat] = point;
    return lng >= bounds.getWest() && lng <= bounds.getEast() &&
           lat >= bounds.getSouth() && lat <= bounds.getNorth();
  }, []);

  // Helper function to check if a LineString intersects with bounding box
  const isLineStringInBounds = useCallback((coordinates: [number, number][], bounds: mapboxgl.LngLatBounds): boolean => {
    return coordinates.some(coord => isPointInBounds(coord, bounds));
  }, [isPointInBounds]);

  // Function to get railway features in selected area
  const getRailwayFeaturesInArea = useCallback((bounds: mapboxgl.LngLatBounds) => {
    const geoData = marmarayTrackGeometry as any;
    const featuresInArea: any[] = [];

    for (const feature of geoData.features) {
      if (feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates as [number, number][];
        if (isLineStringInBounds(coordinates, bounds)) {
          featuresInArea.push({
            ...feature.properties,
            coordinates: coordinates,
            geometryType: feature.geometry.type
          });
        }
      }
    }

    return featuresInArea;
  }, [isLineStringInBounds]);

  // Check if a point is inside a polygon
  const isPointInPolygon = useCallback((point: [number, number], polygon: [number, number][]): boolean => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }, []);

  // Check if a LineString intersects with polygon
  const isLineStringInPolygon = useCallback((lineString: [number, number][], polygon: [number, number][]): boolean => {
    // Check if any point of the line is inside the polygon
    return lineString.some(point => isPointInPolygon(point, polygon));
  }, [isPointInPolygon]);

  // Function to get railway features in selected polygon
  const getRailwayFeaturesInPolygon = useCallback((polygon: [number, number][]) => {
    const geoData = marmarayTrackGeometry as any;
    const featuresInArea: any[] = [];

    for (const feature of geoData.features) {
      if (feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates as [number, number][];
        if (isLineStringInPolygon(coordinates, polygon)) {
          featuresInArea.push({
            ...feature.properties,
            coordinates: coordinates,
            geometryType: feature.geometry.type
          });
        }
      }
    }

    return featuresInArea;
  }, [isLineStringInPolygon]);

  const calculateBearing = useCallback((fromCoords: [number, number], toCoords: [number, number]): number => {
    const [fromLng, fromLat] = fromCoords;
    const [toLng, toLat] = toCoords;
    
    const deltaLng = toLng - fromLng;
    const deltaLat = toLat - fromLat;
    
    // Calculate angle in radians
    const angle = Math.atan2(deltaLng, deltaLat);
    
    // Convert to degrees (0-360) and adjust for Mapbox rotation (0° = North)
    let bearing = (angle * 180 / Math.PI + 360) % 360;
    
    return bearing;
  }, []);

  // Apply offset to prevent overlapping trains
  const applyTrainOffset = useCallback((positions: typeof trainPositions) => {
    const offsetDistance = 0.0008; // Small offset in degrees (~90 meters)
    const clusteredPositions: { [key: string]: typeof trainPositions } = {};

    // Group trains by approximate location (same segment)
    positions.forEach(position => {
      const key = `${position.currentSegment.fromStationId}-${position.currentSegment.toStationId}-${Math.floor(position.progress * 10)}`;
      if (!clusteredPositions[key]) {
        clusteredPositions[key] = [];
      }
      clusteredPositions[key].push(position);
    });

    // Apply offsets to overlapping trains
    const offsetPositions = [];
    for (const cluster of Object.values(clusteredPositions)) {
      if (cluster.length === 1) {
        // Single train, no offset needed
        offsetPositions.push(cluster[0]);
      } else {
        // Multiple trains, apply circular offset pattern
        cluster.forEach((train, index) => {
          const angle = (index * 2 * Math.PI) / cluster.length; // Distribute in circle
          const offsetX = Math.cos(angle) * offsetDistance;
          const offsetY = Math.sin(angle) * offsetDistance;
          
          offsetPositions.push({
            ...train,
            coordinates: [
              train.coordinates[0] + offsetX,
              train.coordinates[1] + offsetY
            ] as [number, number]
          });
        });
      }
    }

    return offsetPositions;
  }, []);

  // Update train positions on the map
  const updateTrainsOnMap = useCallback(() => {
    if (!map.current || !map.current.getSource('trains')) return;

    // Apply offsets to prevent overlapping
    const offsetTrainPositions = applyTrainOffset(trainPositions);

    const trainFeatures = offsetTrainPositions.map(position => {
      // Use the bearing calculated by the route calculator
      // The route calculator already handles direction properly, so no adjustment needed
      const bearing = position.bearing;

      return {
        type: 'Feature' as const,
        properties: {
          trainId: position.trainId,
          displayName: position.displayName,
          fullName: position.fullName,
          routeId: position.routeId,
          bearing: bearing,
          direction: position.direction,
          fromStation: position.currentSegment.fromStation.name,
          toStation: position.currentSegment.toStation.name,
          progress: Math.round(position.progress * 100)
        },
        geometry: {
          type: 'Point' as const,
          coordinates: position.coordinates
        }
      };
    });

    // Update train positions smoothly
    const trainsSource = map.current.getSource('trains') as mapboxgl.GeoJSONSource;
    if (trainsSource) {
      trainsSource.setData({
        type: 'FeatureCollection',
        features: trainFeatures
      });
    }
  }, [trainPositions, calculateBearing, applyTrainOffset]);

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
      minZoom: 9, // Don't allow zooming out too far from the route
      maxZoom: 16, // Allow detailed street-level zoom
      pitch: 0, // 2D view initially
      bearing: 0,
      maxBounds: [
        [28.4, 40.7], // Southwest coordinates (west of Halkalı, south to include Gebze)
        [29.6, 41.2]  // Northeast coordinates (east of Gebze, north of route)
      ],
      // Enable smooth animations
      attributionControl: true,
      logoPosition: 'bottom-left'
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

  // Handle selection mode changes
  useEffect(() => {
    if (!map.current) return;

    let isDrawing = false;
    let polygonPoints: [number, number][] = [];

    const onMouseDown = (e: mapboxgl.MapMouseEvent) => {
      if (!selectionMode) return;
      
      // Disable map dragging
      map.current!.dragPan.disable();
      map.current!.getCanvas().style.cursor = 'crosshair';
      
      isDrawing = true;
      polygonPoints = [[e.lngLat.lng, e.lngLat.lat]];
      
      // Initialize the drawing layer
      if (!map.current!.getSource('selection-area')) {
        map.current!.addSource('selection-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: polygonPoints
            }
          }
        });

        map.current!.addLayer({
          id: 'selection-area-line',
          type: 'line',
          source: 'selection-area',
          paint: {
            'line-color': '#0080ff',
            'line-width': 3,
            'line-opacity': 0.8
          }
        });
      }
    };

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!selectionMode || !isDrawing) return;

      // Add point to polygon
      polygonPoints.push([e.lngLat.lng, e.lngLat.lat]);

      // Update the drawing visualization
      if (map.current!.getSource('selection-area')) {
        (map.current!.getSource('selection-area') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: polygonPoints
          }
        } as any);
      }
    };

    const onMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!selectionMode || !isDrawing) return;

      isDrawing = false;
      
      // Close the polygon by adding the first point at the end
      if (polygonPoints.length > 2) {
        polygonPoints.push(polygonPoints[0]);
        
        // Convert LineString to Polygon for final visualization
        if (map.current!.getSource('selection-area')) {
          // Remove the line layer
          if (map.current!.getLayer('selection-area-line')) {
            map.current!.removeLayer('selection-area-line');
          }
          
          // Update data to polygon
          (map.current!.getSource('selection-area') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [polygonPoints]
            }
          } as any);
          
          // Add fill and border layers for the polygon
          if (!map.current!.getLayer('selection-area-fill')) {
            map.current!.addLayer({
              id: 'selection-area-fill',
              type: 'fill',
              source: 'selection-area',
              paint: {
                'fill-color': '#0080ff',
                'fill-opacity': 0.2
              }
            });
          }
          
          if (!map.current!.getLayer('selection-area-border')) {
            map.current!.addLayer({
              id: 'selection-area-border',
              type: 'line',
              source: 'selection-area',
              paint: {
                'line-color': '#0080ff',
                'line-width': 2,
                'line-dasharray': [5, 5]
              }
            });
          }
        }
        
        // Get railway features in the selected polygon
        const featuresInArea = getRailwayFeaturesInPolygon(polygonPoints);
        
        setSelectedAreaFeatures(featuresInArea);
        
        console.log(`🔍 Found ${featuresInArea.length} railway features in selected area:`, featuresInArea);
      }
      
      // Re-enable map dragging
      map.current!.dragPan.enable();
      map.current!.getCanvas().style.cursor = 'crosshair';
      
      polygonPoints = [];
    };

    if (selectionMode) {
      // Add event listeners
      map.current.on('mousedown', onMouseDown);
      map.current.on('mousemove', onMouseMove);
      map.current.on('mouseup', onMouseUp);
      
      // Set cursor
      map.current.getCanvas().style.cursor = 'crosshair';
    } else {
      // Reset cursor
      map.current.getCanvas().style.cursor = '';
      
      // Re-enable dragging in case it was disabled
      map.current.dragPan.enable();
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.off('mousedown', onMouseDown);
        map.current.off('mousemove', onMouseMove);
        map.current.off('mouseup', onMouseUp);
        map.current.dragPan.enable();
        map.current.getCanvas().style.cursor = '';
      }
    };
  }, [selectionMode, getRailwayFeaturesInPolygon]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Legend - Collapsible */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg overflow-hidden min-w-[240px] sm:min-w-[280px] max-w-[90vw] sm:max-w-none">
        {/* Legend Header */}
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-xs sm:text-sm font-bold text-gray-800">🗺️ {t('mapLegend')}</h3>
          {isLegendOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Legend Content */}
        <div className={`transition-all duration-300 ease-in-out ${
          isLegendOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100">
        
        {/* Railway Track Types */}
        <div className="mb-2 sm:mb-3">
          <h4 className="text-xs font-semibold mb-1 sm:mb-2 text-gray-700">{t('marmarayTracks').toUpperCase()}</h4>
          <div className="space-y-1 sm:space-y-2 text-xs">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-4 sm:w-5 h-1.5 sm:h-2 bg-[#1E40AF] rounded-sm flex-shrink-0"></div>
              <span className="font-medium text-xs">{t('surfaceRailway')}</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] hidden sm:inline">{t('mainLine')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-4 sm:w-5 h-1.5 sm:h-2 bg-[#059669] rounded-sm flex-shrink-0 relative">
                <div className="absolute inset-0 bg-white opacity-30" style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, white 2px, white 4px)'}}></div>
              </div>
              <span className="font-medium text-xs">{t('tunnelSections')}</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] hidden sm:inline">{t('underBosphorus')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-4 sm:w-5 h-1.5 sm:h-2 bg-[#DC2626] rounded-sm flex-shrink-0"></div>
              <span className="font-medium text-xs">{t('bridgeSections')}</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] hidden sm:inline">{t('overWaterRoads')}</span>
            </div>
          </div>
        </div>
        
        {/* Stations */}
        <div className="mb-3 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-semibold mb-2 text-gray-700">{t('stations').toUpperCase()}</h4>
          <div className="flex items-center gap-3 text-xs">
            <div className="relative">
              <div className="w-4 h-4 bg-[#374151] rounded-full"></div>
              <div className="absolute inset-[3px] bg-[#F3F4F6] border border-[#1F2937] rounded-full"></div>
            </div>
            <span>{t('station')}</span>
          </div>
        </div>

        {/* Active Trains */}
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-xs font-semibold mb-1 sm:mb-2 text-gray-700">{t('trains').toUpperCase()} ({trainPositions.length})</h4>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="relative">
                <div className="w-3 sm:w-4 h-3 sm:h-4 bg-[#1E40AF] border border-white rounded-full shadow-sm"></div>
                <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[8px] text-white font-bold">▲</span>
              </div>
              <span className="text-xs">{t('fullLine')}</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] hidden sm:inline">{t('endpoints.halkalı-gebze')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="relative">
                <div className="w-3 sm:w-4 h-3 sm:h-4 bg-[#059669] border border-white rounded-full shadow-sm"></div>
                <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[8px] text-white font-bold">▲</span>
              </div>
              <span className="text-xs">{t('shortService')}</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] hidden sm:inline">{t('endpoints.ataköy-pendik')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="relative">
                <div className="w-3 sm:w-4 h-3 sm:h-4 bg-[#DC2626] border border-white rounded-full shadow-sm"></div>
                <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[8px] text-white font-bold">▲</span>
              </div>
              <span className="text-xs">{t('eveningService')}</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] hidden sm:inline">{t('endpoints.pendik-zeytinburnu')}</span>
            </div>
          </div>
          
          <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-100 text-[9px] sm:text-[10px] text-gray-500">
            <div className="flex flex-col gap-1">
              <span>▲ Arrows point to next station</span>
              <span className="text-[8px] sm:text-[9px]">Multiple trains spread to avoid overlap</span>
            </div>
          </div>
        </div>
        
        {isSimulationRunning && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{t('simulationData')}</span>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Railway Debug Panel */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            debugMode 
              ? 'bg-orange-500 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          🛤️ {debugMode ? t('debugOn') : t('railwayDebug')}
        </button>
        
        <button
          onClick={() => {
            setSelectionMode(!selectionMode);
            if (selectionMode) {
              // Turning off selection mode - clear everything
              setSelectedAreaFeatures([]);
              setSelectionBox(null);
              // Remove selection layers if they exist
              if (map.current?.getSource('selection-area')) {
                if (map.current.getLayer('selection-area-line')) {
                  map.current.removeLayer('selection-area-line');
                }
                if (map.current.getLayer('selection-area-fill')) {
                  map.current.removeLayer('selection-area-fill');
                }
                if (map.current.getLayer('selection-area-border')) {
                  map.current.removeLayer('selection-area-border');
                }
                map.current.removeSource('selection-area');
              }
            }
          }}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            selectionMode
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          📐 {selectionMode ? t('selectionOn') : t('areaSelector')}
        </button>
      </div>

      {/* Railway Info Panel */}
      {debugMode && clickedRailwayInfo && (
        <div className="absolute top-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">🛤️ Railway Info</h3>
            <button
              onClick={() => setClickedRailwayInfo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div><strong>ID:</strong> {clickedRailwayInfo.id}</div>
            {clickedRailwayInfo.name && (
              <div><strong>Name:</strong> {clickedRailwayInfo.name}</div>
            )}
            {clickedRailwayInfo.railway && (
              <div><strong>Type:</strong> {clickedRailwayInfo.railway}</div>
            )}
            {clickedRailwayInfo.operator && (
              <div><strong>Operator:</strong> {clickedRailwayInfo.operator}</div>
            )}
            {clickedRailwayInfo.service && (
              <div><strong>Service:</strong> {clickedRailwayInfo.service}</div>
            )}
            {clickedRailwayInfo.electrified && (
              <div><strong>Electrified:</strong> {clickedRailwayInfo.electrified}</div>
            )}
            {clickedRailwayInfo.gauge && (
              <div><strong>Gauge:</strong> {clickedRailwayInfo.gauge}</div>
            )}
            {clickedRailwayInfo.coordinates && (
              <div>
                <strong>Start:</strong> [{clickedRailwayInfo.coordinates[0]?.join(', ')}]<br/>
                <strong>End:</strong> [{clickedRailwayInfo.coordinates[clickedRailwayInfo.coordinates.length - 1]?.join(', ')}]
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  console.log('Full railway feature data:', clickedRailwayInfo);
                  navigator.clipboard.writeText(JSON.stringify(clickedRailwayInfo, null, 2));
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Copy Data
              </button>
              {clickedRailwayInfo.name && (
                <button
                  onClick={async () => {
                    const featureName = clickedRailwayInfo.name;
                    console.log(`🚫 Excluding railway feature: "${featureName}"`);
                    
                    // Access the simulation engine through the train store
                    const trainEngine = (window as any).trainSimulationEngine;
                    if (trainEngine) {
                      await trainEngine.excludeRailwayFeatures([featureName]);
                      alert(`Excluded railway feature: "${featureName}"`);
                    }
                  }}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                >
                  Exclude This Line
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Area Selection Results Panel */}
      {selectedAreaFeatures.length > 0 && (
        <div className="absolute top-32 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">📐 Selected Area Features ({selectedAreaFeatures.length})</h3>
            <button
              onClick={() => {
                setSelectedAreaFeatures([]);
                setSelectionBox(null);
                // Remove selection layers
                if (map.current?.getSource('selection-area')) {
                  if (map.current.getLayer('selection-area-line')) {
                    map.current.removeLayer('selection-area-line');
                  }
                  if (map.current.getLayer('selection-area-fill')) {
                    map.current.removeLayer('selection-area-fill');
                  }
                  if (map.current.getLayer('selection-area-border')) {
                    map.current.removeLayer('selection-area-border');
                  }
                  map.current.removeSource('selection-area');
                }
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {selectedAreaFeatures.map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded p-2">
                <div className="font-bold">Feature #{index + 1}</div>
                <div><strong>ID:</strong> {feature.id || 'N/A'}</div>
                {feature.name && <div><strong>Name:</strong> {feature.name}</div>}
                {feature.railway && <div><strong>Type:</strong> {feature.railway}</div>}
                {feature.operator && <div><strong>Operator:</strong> {feature.operator}</div>}
                {feature.service && <div><strong>Service:</strong> {feature.service}</div>}
                {feature.electrified && <div><strong>Electrified:</strong> {feature.electrified}</div>}
                {feature.gauge && <div><strong>Gauge:</strong> {feature.gauge}</div>}
                
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => {
                      console.log('Railway feature data:', feature);
                      navigator.clipboard.writeText(JSON.stringify(feature, null, 2));
                    }}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    Copy
                  </button>
                  {feature.name && (
                    <button
                      onClick={async () => {
                        const featureName = feature.name;
                        console.log(`🚫 Excluding railway feature: "${featureName}"`);
                        
                        // Access the simulation engine through the train store
                        const trainEngine = (window as any).trainSimulationEngine;
                        if (trainEngine) {
                          await trainEngine.excludeRailwayFeatures([featureName]);
                          alert(`Excluded railway feature: "${featureName}"`);
                        }
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                    >
                      Exclude
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="mt-3 pt-2 border-t border-gray-200 space-y-2">
              <button
                onClick={() => {
                  const jsonData = JSON.stringify(selectedAreaFeatures, null, 2);
                  navigator.clipboard.writeText(jsonData);
                  console.log('📋 Copied all features as JSON:', selectedAreaFeatures);
                  alert(`Copied ${selectedAreaFeatures.length} features to clipboard as JSON`);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium"
              >
                📋 Copy All as JSON ({selectedAreaFeatures.length} features)
              </button>
              
              <button
                onClick={() => {
                  const featureIds = selectedAreaFeatures
                    .filter(f => f.id)
                    .map(f => f.id);
                  
                  if (featureIds.length > 0) {
                    // Copy as comma-separated list for easy use in code
                    const idsString = featureIds.join(', ');
                    navigator.clipboard.writeText(idsString);
                    console.log('🔢 Copied feature IDs:', idsString);
                    alert(`Copied ${featureIds.length} feature IDs to clipboard`);
                  } else {
                    alert('No features with IDs found');
                  }
                }}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm font-medium"
              >
                🔢 Copy Only IDs ({selectedAreaFeatures.filter(f => f.id).length} IDs)
              </button>
              
              <button
                onClick={() => {
                  const featureNames = selectedAreaFeatures
                    .filter(f => f.name)
                    .map(f => f.name);
                  
                  if (featureNames.length > 0) {
                    console.log(`🚫 Excluding ${featureNames.length} railway features:`, featureNames);
                    
                    const trainEngine = (window as any).trainSimulationEngine;
                    if (trainEngine) {
                      trainEngine.excludeRailwayFeatures(featureNames).then(() => {
                        alert(`Excluded ${featureNames.length} railway features from the selected area`);
                      });
                    }
                  } else {
                    alert('No named features found to exclude');
                  }
                }}
                className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm font-medium"
              >
                🚫 Exclude All Named Features ({selectedAreaFeatures.filter(f => f.name).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Mode Instructions */}
      {selectionMode && (
        <div className="absolute bottom-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 text-xs z-20 max-w-sm">
          📐 <strong>Area Selection Mode:</strong> Click and drag to draw a polygon around railway features
          <br />
          <span className="text-gray-600 mt-1 block">
            • Click and hold to start drawing<br />
            • Drag to draw a freehand polygon<br />
            • Release to complete selection<br />
            • Use results panel to exclude unwanted lines
          </span>
        </div>
      )}

      {debugMode && !selectionMode && (
        <div className="absolute bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-xs z-20">
          🛠️ <strong>Debug Mode:</strong> Click on railway lines to inspect their properties
          <br />
          <span className="text-gray-600">
            Debug: {debugMode ? 'ON' : 'OFF'} | Selection: {selectionMode ? 'ON' : 'OFF'} | Info: {clickedRailwayInfo ? 'SET' : 'NONE'}
          </span>
        </div>
      )}

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