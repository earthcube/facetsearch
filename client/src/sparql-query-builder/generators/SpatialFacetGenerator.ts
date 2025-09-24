/**
 * Spatial Facet Generator - Handles geographic bounding box and spatial filters
 * Based on the Advanced Spatial Facet Implementation from SPARQL_FILTERING_REFACTOR_PLAN.md
 */

import { BaseFacetGenerator } from './BaseFacetGenerator.js';
import { FacetConfig, QueryEngine, SpatialFilterValue } from '../types.js';

export class SpatialFacetGenerator extends BaseFacetGenerator {
  private coordinateSystems: string[];

  constructor(facetConfig: FacetConfig, queryEngine: QueryEngine) {
    super(facetConfig, queryEngine);
    this.coordinateSystems = ['WGS84', 'NAD83', 'EPSG:4326'];
  }

  /**
   * Generate discovery fragment for spatial data
   */
  generateDiscoveryFragment(): string {
    return `
OPTIONAL {
    ?subj schema:spatialCoverage|sschema:spatialCoverage ?spatialCoverage .

    # Handle GeoCoordinates
    {
        ?spatialCoverage schema:geo|sschema:geo ?geo .
        ?geo a schema:GeoCoordinates|sschema:GeoCoordinates .
        ?geo schema:latitude|sschema:latitude ?lat .
        ?geo schema:longitude|sschema:longitude ?lon .
    } UNION {
        # Handle direct lat/lon on spatial coverage
        ?spatialCoverage schema:latitude|sschema:latitude ?lat .
        ?spatialCoverage schema:longitude|sschema:longitude ?lon .
    } UNION {
        # Handle GeoShape with box
        ?spatialCoverage schema:geo|sschema:geo ?geo .
        ?geo a schema:GeoShape|sschema:GeoShape .
        ?geo schema:box|sschema:box ?bbox .
    }
}`;
  }

  /**
   * Generate active filtering fragment
   */
  generateActiveFragment(boundingBox: SpatialFilterValue | BoundingBoxInput): string {
    const { minLat, maxLat, minLon, maxLon } = this.parseBoundingBox(boundingBox);

    return `
?subj schema:spatialCoverage|sschema:spatialCoverage ?spatialCoverage .

{
    # Filter by GeoCoordinates
    ?spatialCoverage schema:geo|sschema:geo ?geo .
    ?geo a schema:GeoCoordinates|sschema:GeoCoordinates .
    ?geo schema:latitude|sschema:latitude ?lat .
    ?geo schema:longitude|sschema:longitude ?lon .

    FILTER (
        ?lat >= ${minLat} && ?lat <= ${maxLat} &&
        ?lon >= ${minLon} && ?lon <= ${maxLon}
    )
} UNION {
    # Filter by direct coordinates
    ?spatialCoverage schema:latitude|sschema:latitude ?lat .
    ?spatialCoverage schema:longitude|sschema:longitude ?lon .

    FILTER (
        ?lat >= ${minLat} && ?lat <= ${maxLat} &&
        ?lon >= ${minLon} && ?lon <= ${maxLon}
    )
} UNION {
    # Filter by bounding box intersection
    ?spatialCoverage schema:geo|sschema:geo ?geo .
    ?geo a schema:GeoShape|sschema:GeoShape .
    ?geo schema:box|sschema:box ?bbox .

    # Parse bbox format: "minLon,minLat maxLon,maxLat"
    BIND (xsd:decimal(SUBSTR(?bbox, 1, STRPOS(?bbox, ",") - 1)) AS ?itemMinLon)
    BIND (xsd:decimal(SUBSTR(?bbox, STRPOS(?bbox, ",") + 1, STRPOS(?bbox, " ") - STRPOS(?bbox, ",") - 1)) AS ?itemMinLat)
    BIND (xsd:decimal(SUBSTR(?bbox, STRPOS(?bbox, " ") + 1, STRRPOS(?bbox, ",") - STRPOS(?bbox, " ") - 1)) AS ?itemMaxLon)
    BIND (xsd:decimal(SUBSTR(?bbox, STRRPOS(?bbox, ",") + 1)) AS ?itemMaxLat)

    # Bounding box intersection
    FILTER (
        ?itemMinLon <= ${maxLon} && ?itemMaxLon >= ${minLon} &&
        ?itemMinLat <= ${maxLat} && ?itemMaxLat >= ${minLat}
    )
}`;
  }

  /**
   * Parse various bounding box input formats
   */
  private parseBoundingBox(boundingBox: any): Required<SpatialFilterValue> {
    // Array format: [minLon, minLat, maxLon, maxLat]
    if (Array.isArray(boundingBox) && boundingBox.length === 4) {
      return {
        minLon: boundingBox[0],
        minLat: boundingBox[1],
        maxLon: boundingBox[2],
        maxLat: boundingBox[3]
      };
    }

    // Object format with various property names
    if (typeof boundingBox === 'object' && boundingBox !== null) {
      const coords = {
        minLat: boundingBox.minLat ?? boundingBox.south ?? boundingBox.southWest?.lat,
        maxLat: boundingBox.maxLat ?? boundingBox.north ?? boundingBox.northEast?.lat,
        minLon: boundingBox.minLon ?? boundingBox.west ?? boundingBox.southWest?.lon,
        maxLon: boundingBox.maxLon ?? boundingBox.east ?? boundingBox.northEast?.lon
      };

      // Validate all coordinates are present
      if (coords.minLat !== undefined && coords.maxLat !== undefined &&
          coords.minLon !== undefined && coords.maxLon !== undefined) {
        return coords as Required<SpatialFilterValue>;
      }
    }

    throw new Error(
      'Bounding box must be [minLon, minLat, maxLon, maxLat] or ' +
      '{minLat, maxLat, minLon, maxLon} or similar object format'
    );
  }

  /**
   * Generate polygon-based filtering for complex shapes (basic implementation)
   */
  generatePolygonFilter(polygon: Array<[number, number]>): string {
    if (!polygon || polygon.length < 3) {
      throw new Error('Polygon must have at least 3 points');
    }

    // For simplicity, use bounding box approximation
    // A full polygon implementation would require more complex SPARQL
    const lats = polygon.map(p => p[1]);
    const lons = polygon.map(p => p[0]);
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons)
    };

    return this.generateActiveFragment(bounds);
  }

  /**
   * Generate circle-based filtering (radius search)
   */
  generateCircleFilter(centerLat: number, centerLon: number, radiusKm: number): string {
    // Simple approximation using bounding box
    // For more precise circle filtering, would need haversine distance calculation in SPARQL
    const kmToDegrees = radiusKm / 111; // Rough approximation

    const bounds = {
      minLat: centerLat - kmToDegrees,
      maxLat: centerLat + kmToDegrees,
      minLon: centerLon - kmToDegrees,
      maxLon: centerLon + kmToDegrees
    };

    return this.generateActiveFragment(bounds);
  }

  /**
   * Validate bounding box coordinates
   */
  private validateBoundingBox(bounds: Required<SpatialFilterValue>): void {
    const { minLat, maxLat, minLon, maxLon } = bounds;

    if (minLat < -90 || maxLat > 90 || minLon < -180 || maxLon > 180) {
      throw new Error('Coordinates out of valid range: lat [-90,90], lon [-180,180]');
    }

    if (minLat >= maxLat) {
      throw new Error('minLat must be less than maxLat');
    }

    if (minLon >= maxLon) {
      throw new Error('minLon must be less than maxLon');
    }
  }

  /**
   * Get supported coordinate systems
   */
  getSupportedCoordinateSystems(): string[] {
    return [...this.coordinateSystems];
  }
}

// Helper interface for various bounding box input formats
interface BoundingBoxInput {
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  southWest?: { lat: number; lon: number };
  northEast?: { lat: number; lon: number };
}