/**
 * Script to fetch Marmaray railway relations and complete track geometry from OpenStreetMap
 * Focus on getting route relations which should have complete track data
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Bounding box for Istanbul area (wider to ensure we get all Marmaray segments)
const ISTANBUL_BBOX = {
  south: 40.7,
  west: 28.4,
  north: 41.3,
  east: 29.7
};

// Query specifically for Marmaray railway relations and complete track data
const MARMARAY_RELATIONS_QUERY = `
[out:json][timeout:60];
(
  // First, get all relations that might be Marmaray
  relation["type"="route"]["route"="train"]["name"~"Marmaray",i](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  relation["railway"]["name"~"Marmaray",i](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  
  // Also get relations with operator tags
  relation["operator"~"Marmaray|TCDD",i]["route"="train"](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  
  // Get all railway ways that might be part of Marmaray
  way["railway"="rail"]["name"~"Marmaray",i](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  way["railway"="rail"]["operator"~"Marmaray|TCDD",i](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  
  // Get electrified rail lines (Marmaray is electrified)
  way["railway"="rail"]["electrified"]["gauge"="1435"](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
);
// Get complete geometry for all found elements
(._;>;);
out geom;
`;

// Alternative query focusing on the tunnel and main line
const MARMARAY_TUNNEL_QUERY = `
[out:json][timeout:60];
(
  // Search for tunnel ways (the Bosphorus crossing)
  way["railway"="rail"]["tunnel"="yes"](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  way["railway"="rail"]["layer"~"-1|-2|-3|-4|-5"](${ISTANBUL_BBOX.south},${ISTANBUL_BBOX.west},${ISTANBUL_BBOX.north},${ISTANBUL_BBOX.east});
  
  // Get ways connecting major Marmaray stations
  way["railway"="rail"](bn:way(n["railway"="station"]["name"~"Halkalı|Gebze|Sirkeci|Üsküdar|Yenikapı",i]));
);
(._;>;);
out geom;
`;

async function fetchMarmarayRelations() {
  try {
    console.log('Fetching Marmaray railway relations and track data...');
    
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Rayda-App/1.0 (Educational Railway Data Research)'
      },
      body: `data=${encodeURIComponent(MARMARAY_RELATIONS_QUERY)}`
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.elements.length} elements for Marmaray relations query`);

    // Separate relations, ways, and nodes
    const relations = data.elements.filter(el => el.type === 'relation');
    const ways = data.elements.filter(el => el.type === 'way' && el.tags && el.tags.railway === 'rail');
    const nodes = data.elements.filter(el => el.type === 'node');

    console.log(`Relations: ${relations.length}, Ways: ${ways.length}, Nodes: ${nodes.length}`);

    // Log relation details
    relations.forEach(rel => {
      console.log(`Relation ${rel.id}: ${rel.tags?.name || 'Unnamed'} - ${rel.tags?.type} ${rel.tags?.route || ''}`);
      if (rel.members) {
        console.log(`  Members: ${rel.members.length}`);
      }
    });

    // Process ways into GeoJSON
    const railwayGeoJSON = {
      type: 'FeatureCollection',
      features: ways.filter(way => way.geometry && way.geometry.length > 0).map(way => ({
        type: 'Feature',
        properties: {
          id: way.id,
          name: way.tags?.name || 'Railway Segment',
          railway: way.tags?.railway,
          electrified: way.tags?.electrified,
          gauge: way.tags?.gauge,
          maxspeed: way.tags?.maxspeed,
          operator: way.tags?.operator,
          tunnel: way.tags?.tunnel,
          bridge: way.tags?.bridge,
          layer: way.tags?.layer
        },
        geometry: {
          type: 'LineString',
          coordinates: way.geometry.map(node => [node.lon, node.lat])
        }
      }))
    };

    // Save relations data
    const dataDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const relationsPath = path.join(dataDir, 'marmaray-relations.json');
    fs.writeFileSync(relationsPath, JSON.stringify({
      relations,
      ways: ways.filter(w => w.geometry),
      nodes: nodes.filter(n => n.lat && n.lon)
    }, null, 2));
    
    const geometryPath = path.join(dataDir, 'marmaray-track-geometry.json');
    fs.writeFileSync(geometryPath, JSON.stringify(railwayGeoJSON, null, 2));
    
    console.log(`Relations data saved to ${relationsPath}`);
    console.log(`Track geometry saved to ${geometryPath}`);
    console.log(`Track segments found: ${railwayGeoJSON.features.length}`);
    
    // Log some sample track segments
    railwayGeoJSON.features.slice(0, 5).forEach((feature, i) => {
      console.log(`Track ${i + 1}: ${feature.properties.name} (${feature.geometry.coordinates.length} points)`);
      if (feature.properties.tunnel) console.log(`  - Tunnel segment`);
      if (feature.properties.electrified) console.log(`  - Electrified`);
    });
    
    return { relations, ways, geometry: railwayGeoJSON };
  } catch (error) {
    console.error('Error fetching Marmaray relations:', error);
    throw error;
  }
}

async function fetchTunnelData() {
  try {
    console.log('\nFetching Marmaray tunnel and connection data...');
    
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Rayda-App/1.0 (Educational Railway Data Research)'
      },
      body: `data=${encodeURIComponent(MARMARAY_TUNNEL_QUERY)}`
    });

    const data = await response.json();
    console.log(`Found ${data.elements.length} elements for tunnel query`);

    const tunnelWays = data.elements.filter(el => 
      el.type === 'way' && 
      el.tags && 
      el.tags.railway === 'rail' && 
      el.geometry
    );

    console.log(`Tunnel/connection ways: ${tunnelWays.length}`);

    tunnelWays.forEach(way => {
      const props = [];
      if (way.tags.tunnel) props.push('tunnel');
      if (way.tags.bridge) props.push('bridge');
      if (way.tags.layer) props.push(`layer:${way.tags.layer}`);
      if (way.tags.electrified) props.push('electrified');
      
      console.log(`Way ${way.id}: ${way.tags.name || 'Unnamed'} [${props.join(', ')}]`);
    });

    return tunnelWays;
  } catch (error) {
    console.error('Error fetching tunnel data:', error);
    throw error;
  }
}

// Run both queries
async function main() {
  try {
    const relationsData = await fetchMarmarayRelations();
    const tunnelData = await fetchTunnelData();
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total railway relations found: ${relationsData.relations.length}`);
    console.log(`Total railway ways found: ${relationsData.ways.length}`);
    console.log(`Total track segments in GeoJSON: ${relationsData.geometry.features.length}`);
    console.log(`Tunnel/connection segments: ${tunnelData.length}`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

main().catch(console.error);