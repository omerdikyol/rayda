/**
 * Script to fetch Marmaray railway geometry from OpenStreetMap via Overpass API
 * This script queries for railway infrastructure in Istanbul and exports GeoJSON
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Bounding box for Istanbul (approximate)
const ISTANBUL_BBOX = {
  south: 40.8,
  west: 28.5,
  north: 41.2,
  east: 29.5
};

const MARMARAY_QUERY = `
[out:json][timeout:25];
(
  // Query for railway ways in Istanbul bbox
  way["railway"~"^(rail|subway|light_rail)$"](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  
  // Query for railway relations (routes) in Istanbul
  relation["railway"="rail"]["route"="train"](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  
  // Query for Marmaray-specific tags
  way["railway"]["name"~"Marmaray",i](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  relation["name"~"Marmaray",i](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
);
out geom;
`;

async function fetchRailwayData() {
  try {
    console.log('Fetching Marmaray railway data from OpenStreetMap...');
    
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Rayda-App/1.0 (Educational Purpose)'
      },
      body: `data=${encodeURIComponent(MARMARAY_QUERY)}`
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.elements.length} railway elements`);

    // Filter and process the data
    const railways = data.elements.filter(element => 
      element.type === 'way' && 
      element.tags && 
      element.tags.railway === 'rail' &&
      element.geometry && 
      element.geometry.length > 0
    );

    console.log(`Filtered to ${railways.length} railway ways`);

    const railwayGeoJSON = {
      type: 'FeatureCollection',
      features: railways.map(way => ({
        type: 'Feature',
        properties: {
          id: way.id,
          name: way.tags.name || 'Unnamed Railway',
          railway: way.tags.railway,
          electrified: way.tags.electrified,
          gauge: way.tags.gauge,
          maxspeed: way.tags.maxspeed,
          operator: way.tags.operator
        },
        geometry: {
          type: 'LineString',
          coordinates: way.geometry.map(node => [node.lon, node.lat])
        }
      }))
    };

    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const outputPath = path.join(dataDir, 'railway-geometry.json');
    fs.writeFileSync(outputPath, JSON.stringify(railwayGeoJSON, null, 2));
    
    console.log(`Railway data saved to ${outputPath}`);
    console.log(`Features found: ${railwayGeoJSON.features.length}`);
    
    // Log some sample features for debugging
    railwayGeoJSON.features.slice(0, 3).forEach((feature, i) => {
      console.log(`Feature ${i + 1}: ${feature.properties.name}, ${feature.geometry.coordinates.length} points`);
    });
    
    return railwayGeoJSON;
  } catch (error) {
    console.error('Error fetching railway data:', error);
    throw error;
  }
}

// Run the script
fetchRailwayData().catch(console.error);