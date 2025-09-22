# Refined SPARQL Filtering Refactoring Plan

## Executive Summary

This document provides a comprehensive technical plan for refactoring the GeoCODES Faceted Search application from client-side filtering to server-side SPARQL query generation. The plan includes detailed implementations for each facet type, advanced query building architecture, comprehensive testing strategies against live SPARQL databases, and performance optimization guidelines.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Advanced Query Building Pipeline](#advanced-query-building-pipeline)
- [Detailed Facet Type Implementations](#detailed-facet-type-implementations)
- [Live Database Testing Strategy](#live-database-testing-strategy)
- [Performance Optimization](#performance-optimization)
- [Implementation Timeline](#implementation-timeline)
- [Risk Mitigation](#risk-mitigation)

## Architecture Overview

### Current vs. Proposed Data Flow

**Current Architecture:**
```
User Input → Single SPARQL Query → All Results → Client-Side Filtering → Displayed Results
```

**Proposed Architecture:**
```
User Input → Facet State Analysis → Dynamic SPARQL Generation → Targeted Query → Filtered Results
```

### Core Components

#### 1. SparqlQueryBuilder Service
Central service responsible for dynamic query construction with facet fragment injection.

#### 2. Facet-Specific Fragment Generators
Specialized generators for each facet type handling both discovery and filtering modes.

#### 3. Engine Adaptation Layer
Handles differences between Blazegraph and QLever query engines.

#### 4. Query Result Cache
LRU cache with facet-aware keys for performance optimization.

#### 5. Live Database Testing Suite
Comprehensive testing framework for validation against real SPARQL endpoints.

## Advanced Query Building Pipeline

### 1. Query Template System

```javascript
// Base query template with placeholder injection
const baseQueryTemplate = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX schema: <http://schema.org/>
PREFIX sschema: <https://schema.org/>
\${engineSpecificPrefixes}

SELECT DISTINCT \${selectFields}
WHERE {
  \${textSearchFragment}
  \${facetFilters}
  \${responseBodyFragment}
}
\${groupByClause}
\${orderByClause}
LIMIT \${limitValue}
OFFSET \${offsetValue}
`;
```

### 2. Fragment Injection Pipeline

```javascript
class SparqlQueryBuilder {
  constructor(baseTemplate, queryEngine) {
    this.baseTemplate = baseTemplate;
    this.queryEngine = queryEngine;
    this.facetFragments = new Map();
    this.activeFilters = new Map();
  }

  // Add or update facet fragment
  setFacetFragment(facetField, fragment, isActive = false) {
    if (isActive) {
      this.activeFilters.set(facetField, fragment);
      this.facetFragments.delete(facetField); // Remove discovery fragment
    } else {
      this.facetFragments.set(facetField, this.wrapOptional(fragment));
      this.activeFilters.delete(facetField); // Remove active filter
    }
  }

  // Build complete SPARQL query
  buildQuery(textQuery, options = {}) {
    const {
      limit = 50,
      offset = 0,
      selectFields = this.getDefaultSelectFields(),
      groupBy = true,
      orderBy = 'DESC(?score)'
    } = options;

    return this.baseTemplate
      .replace('${engineSpecificPrefixes}', this.getEnginePrefixes())
      .replace('${selectFields}', selectFields)
      .replace('${textSearchFragment}', this.generateTextSearchFragment(textQuery))
      .replace('${facetFilters}', this.combineAllFragments())
      .replace('${responseBodyFragment}', this.getResponseBodyFragment())
      .replace('${groupByClause}', groupBy ? this.getGroupByClause() : '')
      .replace('${orderByClause}', `ORDER BY ${orderBy}`)
      .replace('${limitValue}', limit)
      .replace('${offsetValue}', offset);
  }

  combineAllFragments() {
    const discoveryFragments = Array.from(this.facetFragments.values());
    const activeFragments = Array.from(this.activeFilters.values());
    return [...discoveryFragments, ...activeFragments].join('\n');
  }
}
```

### 3. Engine-Specific Adaptations

```javascript
class EngineAdapter {
  static getEnginePrefixes(engine) {
    switch (engine) {
      case 'blazegraph':
        return 'PREFIX bds: <http://www.bigdata.com/rdf/search#>';
      case 'qlever':
        return 'PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin-functions/>';
      default:
        return '';
    }
  }

  static generateTextSearch(query, engine) {
    const escapedQuery = this.escapeQuery(query);

    switch (engine) {
      case 'blazegraph':
        return `
          ?lit bds:search "${escapedQuery}" .
          ?lit bds:relevance ?score1 .
          ?g ?p ?lit .
        `;
      case 'qlever':
        return `
          ?subj ?o ?item .
          ?text ql:contains-entity ?item .
          ?text ql:contains-word "${escapedQuery}"
        `;
      default:
        throw new Error(`Unsupported engine: ${engine}`);
    }
  }
}
```

## Detailed Facet Type Implementations

### 1. Text Facets (Keywords, Publishers, Places)

#### Advanced Text Facet Implementation

```javascript
class TextFacetGenerator {
  constructor(facetConfig, queryEngine) {
    this.facetConfig = facetConfig;
    this.queryEngine = queryEngine;
    this.fieldMappings = this.initializeFieldMappings();
  }

  initializeFieldMappings() {
    return {
      'kw': 'schema:keywords|sschema:keywords',
      'pubname': 'schema:publisher/schema:name|sschema:publisher/sschema:name',
      'placenames': 'schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name',
      'resourceType': 'rdf:type'
    };
  }

  // Generate discovery fragment (OPTIONAL wrapper)
  generateDiscoveryFragment() {
    const field = this.facetConfig.field;
    const sparqlProperty = this.facetConfig.sparql_property || this.fieldMappings[field];
    const variable = `?${field}1`;

    if (!sparqlProperty) {
      throw new Error(`No SPARQL property mapping for field: ${field}`);
    }

    // Handle special cases
    switch (field) {
      case 'pubname':
        return `
          OPTIONAL {
            ?subj schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?legalName .
          }
          OPTIONAL {
            ?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?publisher .
          }
          BIND (COALESCE(?publisher, ?legalName, "No Publisher") AS ?pubname)
        `;

      case 'placenames':
        return `
          OPTIONAL {
            ?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name|sschema:sdPublisher ?place_name .
          }
          BIND (IF (BOUND(?place_name), ?place_name, "No Placenames") AS ?placename) .
        `;

      case 'resourceType':
        return `
          VALUES (?type ?resourceType_u) {
            (schema:Dataset "data")
            (sschema:Dataset "data")
            (schema:ResearchProject "researchProject")
            (sschema:ResearchProject "researchProject")
            (schema:SoftwareApplication "tool")
            (sschema:SoftwareApplication "tool")
            (schema:Person "person")
            (sschema:Person "person")
            (schema:Event "event")
            (sschema:Event "event")
            (schema:Award "award")
            (sschema:Award "award")
            (schema:DataCatalog "DataCatalog")
            (sschema:DataCatalog "DataCatalog")
          }
          ?subj a ?type .
        `;

      default:
        return `OPTIONAL { ?subj ${sparqlProperty} ${variable} . }`;
    }
  }

  // Generate active filtering fragment
  generateActiveFragment(selectedValues) {
    const field = this.facetConfig.field;
    const sparqlProperty = this.facetConfig.sparql_property || this.fieldMappings[field];

    if (!Array.isArray(selectedValues) || selectedValues.length === 0) {
      throw new Error('Selected values must be a non-empty array');
    }

    const escapedValues = selectedValues.map(v => `"${this.escapeValue(v)}"`);

    // Handle different filtering strategies
    switch (field) {
      case 'kw':
        return this.generateKeywordFilter(escapedValues, sparqlProperty);

      case 'pubname':
        return this.generatePublisherFilter(escapedValues);

      case 'placenames':
        return this.generatePlaceFilter(escapedValues);

      case 'resourceType':
        return this.generateResourceTypeFilter(selectedValues);

      default:
        return this.generateGenericTextFilter(escapedValues, sparqlProperty);
    }
  }

  generateKeywordFilter(escapedValues, sparqlProperty) {
    // Support both exact match and partial match
    const exactMatch = escapedValues.join(' ');
    const partialMatches = escapedValues.map(v => `CONTAINS(LCASE(?kwu), LCASE(${v}))`).join(' || ');

    return `
      ?subj ${sparqlProperty} ?kwu .
      FILTER (
        (${partialMatches}) ||
        (${escapedValues.map(v => `?kwu = ${v}`).join(' || ')})
      )
    `;
  }

  generatePublisherFilter(escapedValues) {
    return `
      {
        ?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?pub_name .
        FILTER(?pub_name IN (${escapedValues.join(', ')}))
      } UNION {
        ?subj schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?legal_name .
        FILTER(?legal_name IN (${escapedValues.join(', ')}))
      }
    `;
  }

  generatePlaceFilter(escapedValues) {
    return `
      ?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name ?place_name .
      FILTER(
        ${escapedValues.map(v => `CONTAINS(LCASE(?place_name), LCASE(${v}))`).join(' || ')}
      )
    `;
  }

  generateResourceTypeFilter(selectedValues) {
    const typeMapping = {
      'data': ['schema:Dataset', 'sschema:Dataset'],
      'tool': ['schema:SoftwareApplication', 'sschema:SoftwareApplication'],
      'person': ['schema:Person', 'sschema:Person'],
      'project': ['schema:ResearchProject', 'sschema:ResearchProject'],
      'event': ['schema:Event', 'sschema:Event'],
      'award': ['schema:Award', 'sschema:Award']
    };

    const allTypes = selectedValues.flatMap(v => typeMapping[v] || []);
    const typeValues = allTypes.map(t => `<${t.replace('schema:', 'http://schema.org/').replace('sschema:', 'https://schema.org/')}>`);

    return `
      ?subj a ?selectedType .
      VALUES ?selectedType { ${typeValues.join(' ')} }
    `;
  }

  generateGenericTextFilter(escapedValues, sparqlProperty) {
    return `
      ?subj ${sparqlProperty} ?value .
      FILTER(?value IN (${escapedValues.join(', ')}))
    `;
  }

  escapeValue(value) {
    return value.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  }
}
```

### 2. Range Facets (Depth, Temporal)

#### Advanced Range Facet Implementation

```javascript
class RangeFacetGenerator {
  constructor(facetConfig, queryEngine) {
    this.facetConfig = facetConfig;
    this.queryEngine = queryEngine;
    this.rangeType = this.determineRangeType();
  }

  determineRangeType() {
    const field = this.facetConfig.field;
    if (field.includes('depth')) return 'depth';
    if (field.includes('temporal') || field.includes('date')) return 'temporal';
    if (field.includes('year')) return 'year';
    return 'numeric';
  }

  // Generate discovery fragment for range data
  generateDiscoveryFragment() {
    switch (this.rangeType) {
      case 'depth':
        return this.generateDepthDiscoveryFragment();
      case 'temporal':
        return this.generateTemporalDiscoveryFragment();
      case 'year':
        return this.generateYearDiscoveryFragment();
      default:
        return this.generateNumericDiscoveryFragment();
    }
  }

  generateDepthDiscoveryFragment() {
    // Support multiple depth field names and measurement types
    const depthProperties = this.facetConfig.depth_properties ||
      ["depth", "CmpDep", "package_depth", "collection_depth", "Bottle Depth", "sample depth", "tow depth"];

    const depthFilter = depthProperties.map(prop => `"${prop}"`).join(', ');

    return `
      OPTIONAL {
        ?subj sschema:variableMeasured ?vmd .
        ?vmd a sschema:PropertyValue .
        ?vmd sschema:name ?namedepth .
        FILTER (LCASE(?namedepth) IN (${depthFilter.toLowerCase()})) .
        ?vmd sschema:maxValue ?maxDepth_d .
        ?vmd sschema:minValue ?minDepth_d .
      }
      BIND (COALESCE(?maxDepth_d) AS ?maxDepth)
      BIND (COALESCE(?minDepth_d) AS ?minDepth)
    `;
  }

  generateTemporalDiscoveryFragment() {
    return `
      OPTIONAL { ?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage . }
      OPTIONAL { ?subj schema:datePublished|sschema:datePublished ?datep1 . }
      OPTIONAL { ?subj schema:dateCreated|sschema:dateCreated ?datec . }
      OPTIONAL { ?subj schema:dateModified|sschema:dateModified ?datem . }
      BIND (COALESCE(?datec, ?datem, ?datep1) AS ?datep)
    `;
  }

  generateYearDiscoveryFragment() {
    return `
      OPTIONAL { ?subj schema:datePublished|sschema:datePublished ?datep1 . }
      OPTIONAL { ?subj schema:dateCreated|sschema:dateCreated ?datec . }
      OPTIONAL { ?subj schema:dateModified|sschema:dateModified ?datem . }
      BIND (COALESCE(?datec, ?datem, ?datep1) AS ?datep)
      BIND (YEAR(?datep) AS ?year)
    `;
  }

  // Generate active filtering fragment
  generateActiveFragment(rangeValues) {
    const { minValue, maxValue } = this.parseRangeValues(rangeValues);

    switch (this.rangeType) {
      case 'depth':
        return this.generateDepthFilterFragment(minValue, maxValue);
      case 'temporal':
        return this.generateTemporalFilterFragment(minValue, maxValue);
      case 'year':
        return this.generateYearFilterFragment(minValue, maxValue);
      default:
        return this.generateNumericFilterFragment(minValue, maxValue);
    }
  }

  generateDepthFilterFragment(minDepth, maxDepth) {
    const depthProperties = this.facetConfig.depth_properties ||
      ["depth", "CmpDep", "package_depth", "collection_depth", "Bottle Depth", "sample depth", "tow depth"];

    const depthFilter = depthProperties.map(prop => `"${prop}"`).join(', ');

    return `
      ?subj sschema:variableMeasured ?vm .
      ?vm a sschema:PropertyValue .
      ?vm sschema:name ?namedepth .
      FILTER (LCASE(?namedepth) IN (${depthFilter.toLowerCase()})) .
      ?vm sschema:maxValue ?maxDepth_d .
      ?vm sschema:minValue ?minDepth_d .

      # Range overlap: item range intersects with search range
      FILTER (
        ?minDepth_d <= ${maxDepth} && ?maxDepth_d >= ${minDepth}
      )
    `;
  }

  generateTemporalFilterFragment(startDate, endDate) {
    // Handle various temporal formats: ISO dates, year ranges, intervals
    return `
      ?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .

      # Handle different temporal coverage formats
      FILTER (
        # ISO date range format: 2020-01-01/2020-12-31
        (REGEX(?temporalCoverage, "^\\\\d{4}-\\\\d{2}-\\\\d{2}/\\\\d{4}-\\\\d{2}-\\\\d{2}$") &&
         xsd:date(SUBSTR(?temporalCoverage, 1, 10)) <= xsd:date("${endDate}") &&
         xsd:date(SUBSTR(?temporalCoverage, 12, 10)) >= xsd:date("${startDate}")) ||

        # Year range format: 2020/2023
        (REGEX(?temporalCoverage, "^\\\\d{4}/\\\\d{4}$") &&
         xsd:integer(SUBSTR(?temporalCoverage, 1, 4)) <= ${new Date(endDate).getFullYear()} &&
         xsd:integer(SUBSTR(?temporalCoverage, 6, 4)) >= ${new Date(startDate).getFullYear()}) ||

        # Single year format: 2020
        (REGEX(?temporalCoverage, "^\\\\d{4}$") &&
         xsd:integer(?temporalCoverage) >= ${new Date(startDate).getFullYear()} &&
         xsd:integer(?temporalCoverage) <= ${new Date(endDate).getFullYear()})
      )
    `;
  }

  generateYearFilterFragment(startYear, endYear) {
    return `
      {
        ?subj schema:datePublished|sschema:datePublished ?date .
        FILTER (YEAR(?date) >= ${startYear} && YEAR(?date) <= ${endYear})
      } UNION {
        ?subj schema:dateCreated|sschema:dateCreated ?date .
        FILTER (YEAR(?date) >= ${startYear} && YEAR(?date) <= ${endYear})
      } UNION {
        ?subj schema:dateModified|sschema:dateModified ?date .
        FILTER (YEAR(?date) >= ${startYear} && YEAR(?date) <= ${endYear})
      }
    `;
  }

  parseRangeValues(rangeValues) {
    if (Array.isArray(rangeValues) && rangeValues.length === 2) {
      return { minValue: rangeValues[0], maxValue: rangeValues[1] };
    }

    if (typeof rangeValues === 'object' && rangeValues.min !== undefined && rangeValues.max !== undefined) {
      return { minValue: rangeValues.min, maxValue: rangeValues.max };
    }

    throw new Error('Range values must be an array [min, max] or object {min, max}');
  }
}
```

### 3. Spatial Facets (Geographic Bounding Box)

#### Advanced Spatial Facet Implementation

```javascript
class SpatialFacetGenerator {
  constructor(facetConfig, queryEngine) {
    this.facetConfig = facetConfig;
    this.queryEngine = queryEngine;
    this.coordinateSystems = ['WGS84', 'NAD83', 'EPSG:4326'];
  }

  // Generate discovery fragment for spatial data
  generateDiscoveryFragment() {
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
      }
    `;
  }

  // Generate active filtering fragment
  generateActiveFragment(boundingBox) {
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
      }
    `;
  }

  parseBoundingBox(boundingBox) {
    if (Array.isArray(boundingBox) && boundingBox.length === 4) {
      return {
        minLon: boundingBox[0],
        minLat: boundingBox[1],
        maxLon: boundingBox[2],
        maxLat: boundingBox[3]
      };
    }

    if (typeof boundingBox === 'object') {
      return {
        minLat: boundingBox.minLat || boundingBox.south,
        maxLat: boundingBox.maxLat || boundingBox.north,
        minLon: boundingBox.minLon || boundingBox.west,
        maxLon: boundingBox.maxLon || boundingBox.east
      };
    }

    throw new Error('Bounding box must be [minLon, minLat, maxLon, maxLat] or {minLat, maxLat, minLon, maxLon}');
  }

  // Generate polygon-based filtering for complex shapes
  generatePolygonFilter(polygon) {
    const points = polygon.map(([lon, lat]) => `${lon} ${lat}`).join(', ');

    return `
      ?subj schema:spatialCoverage|sschema:spatialCoverage ?spatialCoverage .
      ?spatialCoverage schema:geo|sschema:geo ?geo .
      ?geo schema:latitude|sschema:latitude ?lat .
      ?geo schema:longitude|sschema:longitude ?lon .

      # Point-in-polygon test (simplified for basic convex polygons)
      FILTER (
        # This would need a more sophisticated implementation for general polygons
        # For now, use bounding box approximation
        ?lat >= ${Math.min(...polygon.map(p => p[1]))} &&
        ?lat <= ${Math.max(...polygon.map(p => p[1]))} &&
        ?lon >= ${Math.min(...polygon.map(p => p[0]))} &&
        ?lon <= ${Math.max(...polygon.map(p => p[0]))}
      )
    `;
  }
}
```

### 4. Property Value Facets (Variable Measured)

#### Advanced Property Value Implementation

```javascript
class PropertyValueFacetGenerator {
  constructor(facetConfig, queryEngine) {
    this.facetConfig = facetConfig;
    this.queryEngine = queryEngine;
    this.propertyMappings = this.initializePropertyMappings();
  }

  initializePropertyMappings() {
    return {
      'temperature': ['temperature', 'temp', 'Temperature', 'water temperature'],
      'salinity': ['salinity', 'Salinity', 'sal'],
      'pH': ['pH', 'ph', 'acidity'],
      'oxygen': ['oxygen', 'O2', 'dissolved oxygen', 'DO'],
      'nitrogen': ['nitrogen', 'N', 'nitrate', 'nitrite'],
      'phosphorus': ['phosphorus', 'P', 'phosphate'],
      'chlorophyll': ['chlorophyll', 'chl', 'chlorophyll-a', 'chla']
    };
  }

  // Generate discovery fragment for property values
  generateDiscoveryFragment() {
    return `
      OPTIONAL {
        ?subj sschema:variableMeasured ?vm .
        ?vm a sschema:PropertyValue .
        ?vm sschema:name ?variableMeasured_a .
        ?vm sschema:value|sschema:minValue|sschema:maxValue ?propertyValue .
        OPTIONAL { ?vm sschema:unitText|sschema:unitCode ?unit . }
        OPTIONAL { ?vm sschema:minValue ?minVal . }
        OPTIONAL { ?vm sschema:maxValue ?maxVal . }
      }
    `;
  }

  // Generate active filtering fragment
  generateActiveFragment(propertyFilter) {
    const { propertyName, minValue, maxValue, unit } = this.parsePropertyFilter(propertyFilter);
    const propertyVariants = this.getPropertyVariants(propertyName);

    return `
      ?subj sschema:variableMeasured ?vm .
      ?vm a sschema:PropertyValue .
      ?vm sschema:name ?propName .

      # Match property name variants
      FILTER (
        ${propertyVariants.map(variant => `LCASE(?propName) = LCASE("${variant}")`).join(' || ')}
      )

      # Handle different value structures
      {
        # Direct value
        ?vm sschema:value ?propValue .
        ${this.generateValueRangeFilter('?propValue', minValue, maxValue)}
      } UNION {
        # Min/Max value range
        ?vm sschema:minValue ?minVal .
        ?vm sschema:maxValue ?maxVal .

        # Range overlap: property range intersects with search range
        FILTER (?minVal <= ${maxValue} && ?maxVal >= ${minValue})
      }

      ${unit ? this.generateUnitFilter(unit) : ''}
    `;
  }

  generateValueRangeFilter(valueVariable, minValue, maxValue) {
    if (minValue !== undefined && maxValue !== undefined) {
      return `FILTER (${valueVariable} >= ${minValue} && ${valueVariable} <= ${maxValue})`;
    } else if (minValue !== undefined) {
      return `FILTER (${valueVariable} >= ${minValue})`;
    } else if (maxValue !== undefined) {
      return `FILTER (${valueVariable} <= ${maxValue})`;
    }
    return '';
  }

  generateUnitFilter(unit) {
    return `
      OPTIONAL { ?vm sschema:unitText|sschema:unitCode ?vmUnit . }
      FILTER (!BOUND(?vmUnit) || LCASE(?vmUnit) = LCASE("${unit}"))
    `;
  }

  getPropertyVariants(propertyName) {
    return this.propertyMappings[propertyName.toLowerCase()] || [propertyName];
  }

  parsePropertyFilter(propertyFilter) {
    if (typeof propertyFilter === 'string') {
      return { propertyName: propertyFilter };
    }

    if (typeof propertyFilter === 'object') {
      return {
        propertyName: propertyFilter.property || propertyFilter.name,
        minValue: propertyFilter.min || propertyFilter.minValue,
        maxValue: propertyFilter.max || propertyFilter.maxValue,
        unit: propertyFilter.unit
      };
    }

    throw new Error('Property filter must be a string (property name) or object with property details');
  }

  // Generate advanced property filtering with statistical operations
  generateStatisticalFilter(propertyName, operation, threshold) {
    const propertyVariants = this.getPropertyVariants(propertyName);

    const operationMap = {
      'avg': 'AVG(?propValue)',
      'mean': 'AVG(?propValue)',
      'min': 'MIN(?propValue)',
      'max': 'MAX(?propValue)',
      'count': 'COUNT(?propValue)',
      'sum': 'SUM(?propValue)'
    };

    const sparqlOperation = operationMap[operation.toLowerCase()];
    if (!sparqlOperation) {
      throw new Error(`Unsupported operation: ${operation}`);
    }

    return `
      {
        SELECT ?subj WHERE {
          ?subj sschema:variableMeasured ?vm .
          ?vm a sschema:PropertyValue .
          ?vm sschema:name ?propName .
          ?vm sschema:value ?propValue .

          FILTER (
            ${propertyVariants.map(variant => `LCASE(?propName) = LCASE("${variant}")`).join(' || ')}
          )
        }
        GROUP BY ?subj
        HAVING (${sparqlOperation} > ${threshold})
      }
    `;
  }
}
```

## Live Database Testing Strategy

### 1. Test Environment Configuration

```javascript
// jest.config.live.cjs
module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: [
    '**/src/__tests__/live/**/*.test.js',
    '**/src/__tests__/integration/**/*.test.js'
  ],
  testTimeout: 30000, // 30 second timeout for live queries
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.js',
    '<rootDir>/src/__tests__/setup-live.js'
  ],
  globalSetup: '<rootDir>/src/__tests__/global-setup.js',
  globalTeardown: '<rootDir>/src/__tests__/global-teardown.js'
};
```

### 2. Live SPARQL Testing Service

```javascript
// src/__tests__/services/SparqlTestService.js
export class SparqlTestService {
  constructor(endpoint, queryEngine = 'blazegraph') {
    this.endpoint = endpoint;
    this.queryEngine = queryEngine;
    this.timeout = 15000;
    this.retryCount = 3;
    this.validateEndpoint();
  }

  async validateEndpoint() {
    try {
      const testQuery = 'SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o } LIMIT 1';
      await this.executeQuery(testQuery);
    } catch (error) {
      console.warn(`Endpoint ${this.endpoint} may not be available: ${error.message}`);
    }
  }

  async executeQuery(sparqlQuery, options = {}) {
    const { validateSyntax = true, measurePerformance = false } = options;

    if (validateSyntax) {
      this.validateSparqlSyntax(sparqlQuery);
    }

    const startTime = measurePerformance ? Date.now() : 0;

    try {
      const response = await this.executeWithRetry(sparqlQuery);
      const endTime = measurePerformance ? Date.now() : 0;

      return {
        success: true,
        results: response.results?.bindings || [],
        queryTime: endTime - startTime,
        resultCount: response.results?.bindings?.length || 0,
        endpoint: this.endpoint,
        engine: this.queryEngine
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        queryTime: measurePerformance ? Date.now() - startTime : 0,
        endpoint: this.endpoint,
        engine: this.queryEngine
      };
    }
  }

  async executeWithRetry(sparqlQuery, attempt = 1) {
    try {
      const params = new URLSearchParams();
      params.append('query', sparqlQuery);
      params.append('queryLn', 'sparql');

      if (this.queryEngine === 'blazegraph') {
        params.append('timeout', '15');
      }

      const response = await fetch(`${this.endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'FacetSearch-Test-Suite/1.0'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.retryCount && !error.message.includes('timeout')) {
        await this.delay(attempt * 1000);
        return this.executeWithRetry(sparqlQuery, attempt + 1);
      }
      throw error;
    }
  }

  validateSparqlSyntax(sparqlQuery) {
    const requiredKeywords = ['SELECT', 'WHERE'];
    const hasRequired = requiredKeywords.every(keyword =>
      sparqlQuery.toUpperCase().includes(keyword)
    );

    if (!hasRequired) {
      throw new Error(`Invalid SPARQL: Missing required keywords ${requiredKeywords}`);
    }

    const openBraces = (sparqlQuery.match(/{/g) || []).length;
    const closeBraces = (sparqlQuery.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      throw new Error('Invalid SPARQL: Unbalanced braces');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. Available Test Endpoints

```javascript
// src/__tests__/config/test-endpoints.js
export const testEndpoints = {
  // Production endpoints
  production: {
    blazegraph_main: {
      url: 'https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/geocodes_all/sparql',
      engine: 'blazegraph',
      description: 'Main production Blazegraph endpoint'
    },
    qlever_main: {
      url: 'https://qlever.geocodes-aws-dev.earthcube.org/graphspace/facetsearch',
      engine: 'qlever',
      description: 'Main production QLever endpoint'
    }
  },

  // Development/test endpoints
  development: {
    blazegraph_test: {
      url: 'https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/test/sparql',
      engine: 'blazegraph',
      description: 'Blazegraph test endpoint'
    },
    blazegraph_datetest: {
      url: 'https://graph.geocodes-aws-dev.earthcube.org/blazegraph/namespace/datetest/sparql',
      engine: 'blazegraph',
      description: 'Date testing endpoint'
    }
  },

  // Community-specific endpoints
  community: {
    obisdepth: {
      url: 'https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/obisdepth/sparql',
      engine: 'blazegraph',
      description: 'OBIS depth data'
    },
    deepoceans: {
      url: 'https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/deepoceans/sparql',
      engine: 'blazegraph',
      description: 'Deep oceans research data'
    },
    geochemistry: {
      url: 'https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/geochemistry/sparql',
      engine: 'blazegraph',
      description: 'Geochemistry research data'
    }
  }
};

// Get endpoints for testing based on environment
export function getTestEndpoints(environment = 'development') {
  const endpoints = testEndpoints[environment] || testEndpoints.development;
  return Object.entries(endpoints).map(([name, config]) => ({
    name,
    ...config
  }));
}
```

### 4. Cross-Engine Validation Tests

```javascript
// src/__tests__/live/cross-engine-validation.test.js
import { SparqlTestService } from '../services/SparqlTestService';
import { getTestEndpoints } from '../config/test-endpoints';
import { TextFacetGenerator, RangeFacetGenerator } from '../../services/facetGenerators';

describe('Cross-Engine SPARQL Query Validation', () => {
  const testEndpoints = [
    {
      name: 'blazegraph',
      url: 'https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/test/sparql',
      engine: 'blazegraph'
    },
    {
      name: 'qlever',
      url: 'https://qlever.geocodes-aws-dev.earthcube.org/graphspace/facetsearch',
      engine: 'qlever'
    }
  ];

  const testQueries = [
    { name: 'basic text search', query: 'water', expectedMinResults: 1 },
    { name: 'scientific terms', query: 'oceanography', expectedMinResults: 1 },
    { name: 'climate data', query: 'climate temperature', expectedMinResults: 1 }
  ];

  describe.each(testEndpoints)('$name engine', (endpoint) => {
    let testService;

    beforeAll(() => {
      testService = new SparqlTestService(endpoint.url, endpoint.engine);
    });

    test.each(testQueries)('should execute $name successfully', async (testQuery) => {
      const textFacetGenerator = new TextFacetGenerator(
        { field: 'fulltext', type: 'fulltext' },
        endpoint.engine
      );

      const textFragment = endpoint.engine === 'blazegraph'
        ? `?lit bds:search "${testQuery.query}" . ?lit bds:relevance ?score1 . ?g ?p ?lit .`
        : `?subj ?o ?item . ?text ql:contains-entity ?item . ?text ql:contains-word "${testQuery.query}"`;

      const fullQuery = `
        PREFIX schema: <http://schema.org/>
        PREFIX sschema: <https://schema.org/>
        ${endpoint.engine === 'blazegraph' ? 'PREFIX bds: <http://www.bigdata.com/rdf/search#>' : ''}
        ${endpoint.engine === 'qlever' ? 'PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin-functions/>' : ''}

        SELECT DISTINCT ?subj ?name ?description
        WHERE {
          ${textFragment}

          graph ?g {
            ?subj schema:name|sschema:name ?name .
            ?subj schema:description|sschema:description ?description .
          }
        }
        LIMIT 10
      `;

      const result = await testService.executeQuery(fullQuery, {
        measurePerformance: true
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.queryTime).toBeLessThan(10000);
      expect(result.results.length).toBeGreaterThanOrEqual(testQuery.expectedMinResults);

      if (result.results.length > 0) {
        expect(result.results[0]).toHaveProperty('subj');
        expect(result.results[0]).toHaveProperty('name');
        expect(result.results[0]).toHaveProperty('description');
      }
    });

    test('should handle keyword filtering correctly', async () => {
      const keywordFilter = new TextFacetGenerator(
        { field: 'kw', type: 'text' },
        endpoint.engine
      );

      const query = `
        PREFIX schema: <http://schema.org/>
        PREFIX sschema: <https://schema.org/>

        SELECT DISTINCT ?subj ?name ?kw
        WHERE {
          graph ?g {
            ?subj schema:name|sschema:name ?name .
          }

          ${keywordFilter.generateActiveFragment(['temperature', 'climate'])}
        }
        LIMIT 5
      `;

      const result = await testService.executeQuery(query);

      expect(result.success).toBe(true);

      if (result.results.length > 0) {
        result.results.forEach(item => {
          const keywords = item.kw?.value?.toLowerCase() || '';
          expect(
            keywords.includes('temperature') || keywords.includes('climate')
          ).toBe(true);
        });
      }
    });

    test('should handle depth range filtering correctly', async () => {
      const depthFilter = new RangeFacetGenerator(
        {
          field: 'depth',
          type: 'depthrange',
          depth_properties: ['depth', 'CmpDep']
        },
        endpoint.engine
      );

      const query = `
        PREFIX schema: <http://schema.org/>
        PREFIX sschema: <https://schema.org/>

        SELECT DISTINCT ?subj ?name ?minDepth ?maxDepth
        WHERE {
          graph ?g {
            ?subj schema:name|sschema:name ?name .
          }

          ${depthFilter.generateActiveFragment({ min: 0, max: 1000 })}
        }
        LIMIT 5
      `;

      const result = await testService.executeQuery(query);

      expect(result.success).toBe(true);

      if (result.results.length > 0) {
        result.results.forEach(item => {
          const minDepth = parseFloat(item.minDepth?.value || 0);
          const maxDepth = parseFloat(item.maxDepth?.value || 0);

          // Verify range overlap: item range intersects with search range [0, 1000]
          expect(minDepth <= 1000 && maxDepth >= 0).toBe(true);
        });
      }
    });
  });

  test('should produce consistent result structures across engines', async () => {
    const testQuery = 'ocean data';
    const results = {};

    for (const endpoint of testEndpoints) {
      const testService = new SparqlTestService(endpoint.url, endpoint.engine);

      const textFragment = endpoint.engine === 'blazegraph'
        ? `?lit bds:search "${testQuery}" . ?g ?p ?lit .`
        : `?subj ?o ?item . ?text ql:contains-entity ?item . ?text ql:contains-word "${testQuery}"`;

      const query = `
        PREFIX schema: <http://schema.org/>
        PREFIX sschema: <https://schema.org/>
        ${endpoint.engine === 'blazegraph' ? 'PREFIX bds: <http://www.bigdata.com/rdf/search#>' : ''}
        ${endpoint.engine === 'qlever' ? 'PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin-functions/>' : ''}

        SELECT (COUNT(DISTINCT ?subj) as ?count)
        WHERE {
          ${textFragment}
          ?subj schema:name|sschema:name ?name .
        }
      `;

      const result = await testService.executeQuery(query);
      results[endpoint.name] = parseInt(result.results[0]?.count?.value || 0);
    }

    // Results should be within reasonable variance (50% for different datasets)
    const counts = Object.values(results);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const variance = maxCount > 0 ? (maxCount - minCount) / maxCount : 0;

    expect(variance).toBeLessThan(0.8); // Allow 80% variance between engines
  });
});
```

### 5. Performance Testing Suite

```javascript
// src/__tests__/performance/sparql-performance.test.js
describe('SPARQL Query Performance Testing', () => {
  const performanceThresholds = {
    simple_text_search: 3000,    // 3 seconds
    single_facet_filter: 5000,   // 5 seconds
    multi_facet_filter: 8000,    // 8 seconds
    complex_range_filter: 10000  // 10 seconds
  };

  const testEndpoint = {
    url: 'https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/test/sparql',
    engine: 'blazegraph'
  };

  let testService;

  beforeAll(() => {
    testService = new SparqlTestService(testEndpoint.url, testEndpoint.engine);
  });

  test('simple text search performance', async () => {
    const query = `
      PREFIX schema: <http://schema.org/>
      PREFIX sschema: <https://schema.org/>
      PREFIX bds: <http://www.bigdata.com/rdf/search#>

      SELECT DISTINCT ?subj ?name WHERE {
        ?lit bds:search "ocean" .
        ?lit bds:relevance ?score1 .
        ?g ?p ?lit .

        graph ?g {
          ?subj schema:name|sschema:name ?name .
        }
      }
      ORDER BY DESC(?score1)
      LIMIT 50
    `;

    const result = await testService.executeQuery(query, { measurePerformance: true });

    expect(result.success).toBe(true);
    expect(result.queryTime).toBeLessThan(performanceThresholds.simple_text_search);
    expect(result.resultCount).toBeGreaterThan(0);
  });

  test('multi-facet filter performance', async () => {
    const query = `
      PREFIX schema: <http://schema.org/>
      PREFIX sschema: <https://schema.org/>
      PREFIX bds: <http://www.bigdata.com/rdf/search#>

      SELECT DISTINCT ?subj ?name ?pubname ?kw WHERE {
        ?lit bds:search "climate" .
        ?lit bds:relevance ?score1 .
        ?g ?p ?lit .

        graph ?g {
          ?subj schema:name|sschema:name ?name .
        }

        # Publisher filter
        ?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?pubname .
        FILTER(?pubname IN ("NOAA", "NASA", "USGS"))

        # Keyword filter
        ?subj schema:keywords|sschema:keywords ?kw .
        FILTER(CONTAINS(LCASE(?kw), "temperature") || CONTAINS(LCASE(?kw), "climate"))
      }
      ORDER BY DESC(?score1)
      LIMIT 50
    `;

    const result = await testService.executeQuery(query, { measurePerformance: true });

    expect(result.success).toBe(true);
    expect(result.queryTime).toBeLessThan(performanceThresholds.multi_facet_filter);
  });

  test('complex depth range filter performance', async () => {
    const query = `
      PREFIX schema: <http://schema.org/>
      PREFIX sschema: <https://schema.org/>
      PREFIX bds: <http://www.bigdata.com/rdf/search#>

      SELECT DISTINCT ?subj ?name ?minDepth ?maxDepth WHERE {
        ?lit bds:search "ocean" .
        ?lit bds:relevance ?score1 .
        ?g ?p ?lit .

        graph ?g {
          ?subj schema:name|sschema:name ?name .
        }

        # Depth range filter
        ?subj sschema:variableMeasured ?vm .
        ?vm a sschema:PropertyValue .
        ?vm sschema:name ?namedepth .
        FILTER (LCASE(?namedepth) IN ("depth", "cmpdep", "package_depth")) .
        ?vm sschema:maxValue ?maxDepth .
        ?vm sschema:minValue ?minDepth .
        FILTER (?minDepth <= 1000 && ?maxDepth >= 0)
      }
      ORDER BY DESC(?score1)
      LIMIT 50
    `;

    const result = await testService.executeQuery(query, { measurePerformance: true });

    expect(result.success).toBe(true);
    expect(result.queryTime).toBeLessThan(performanceThresholds.complex_range_filter);
  });

  test('concurrent query load testing', async () => {
    const concurrentQueries = 5;
    const queries = Array.from({ length: concurrentQueries }, (_, i) => `
      PREFIX schema: <http://schema.org/>
      PREFIX sschema: <https://schema.org/>
      PREFIX bds: <http://www.bigdata.com/rdf/search#>

      SELECT DISTINCT ?subj ?name WHERE {
        ?lit bds:search "data${i}" .
        ?g ?p ?lit .
        graph ?g {
          ?subj schema:name|sschema:name ?name .
        }
      }
      LIMIT 10
    `);

    const promises = queries.map(query =>
      testService.executeQuery(query, { measurePerformance: true })
    );

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.queryTime).toBeLessThan(15000); // 15 seconds under load
    });

    const avgResponseTime = results.reduce((sum, r) => sum + r.queryTime, 0) / results.length;
    expect(avgResponseTime).toBeLessThan(8000); // 8 second average
  });

  test('query optimization with LIMIT variations', async () => {
    const limits = [10, 50, 100, 500];
    const baseQuery = `
      PREFIX schema: <http://schema.org/>
      PREFIX sschema: <https://schema.org/>
      PREFIX bds: <http://www.bigdata.com/rdf/search#>

      SELECT DISTINCT ?subj ?name WHERE {
        ?lit bds:search "ocean" .
        ?lit bds:relevance ?score1 .
        ?g ?p ?lit .

        graph ?g {
          ?subj schema:name|sschema:name ?name .
        }
      }
      ORDER BY DESC(?score1)
      LIMIT {limit}
    `;

    const results = {};

    for (const limit of limits) {
      const query = baseQuery.replace('{limit}', limit);
      const result = await testService.executeQuery(query, { measurePerformance: true });

      expect(result.success).toBe(true);
      results[limit] = result.queryTime;
    }

    // Verify that larger limits don't dramatically increase query time
    expect(results[500]).toBeLessThan(results[10] * 3); // Should not be 3x slower
  });
});
```

## Performance Optimization

### 1. Query Optimization Strategies

#### A. SPARQL Query Patterns
```javascript
// Optimized query patterns for different scenarios
class QueryOptimizer {
  static optimizeForBlazegraph(query) {
    return query
      // Use bds:search for full-text instead of regex
      .replace(/FILTER\s*\(\s*REGEX\s*\([^)]+\)\s*\)/gi,
        (match) => this.convertRegexToBdsSearch(match))
      // Prefer VALUES over multiple FILTER clauses
      .replace(/FILTER\s*\(\s*\?var\s*=\s*"[^"]+"\s*\|\|\s*\?var\s*=\s*"[^"]+"\s*\)/gi,
        (match) => this.convertFilterToValues(match));
  }

  static optimizeForQLever(query) {
    return query
      // Use ql:contains-word for text search
      .replace(/bds:search/g, 'ql:contains-word')
      // Optimize joins with explicit variable ordering
      .replace(/\{\s*\?subj\s+\?p\s+\?o\s*\.\s*\}/g,
        '{ ?subj ?p ?o . } # Optimized for QLever');
  }

  static addPerformanceHints(query, engine) {
    switch (engine) {
      case 'blazegraph':
        return `# Query Optimizer Hints
${query}
# hint:Prior hint:runFirst true
# hint:Group hint:optimizer "NONE"`;

      case 'qlever':
        return `# QLever Optimizations
${query}`;

      default:
        return query;
    }
  }
}
```

#### B. Caching Strategy
```javascript
// Multi-level caching for SPARQL queries
class QueryCache {
  constructor() {
    this.resultCache = new LRUCache({ max: 1000, ttl: 300000 }); // 5 min
    this.facetCountCache = new LRUCache({ max: 500, ttl: 600000 }); // 10 min
    this.schemaCache = new LRUCache({ max: 100, ttl: 3600000 }); // 1 hour
  }

  generateCacheKey(query, facetState, engine) {
    const normalizedQuery = this.normalizeQuery(query);
    const facetKey = this.generateFacetStateKey(facetState);
    return `${engine}:${this.hashString(normalizedQuery)}:${facetKey}`;
  }

  normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ')
      .replace(/LIMIT\s+\d+/gi, '')
      .replace(/OFFSET\s+\d+/gi, '')
      .trim();
  }

  generateFacetStateKey(facetState) {
    const sortedEntries = Object.entries(facetState)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`);
    return this.hashString(sortedEntries.join('|'));
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  async getCachedResult(cacheKey, queryFunction) {
    const cached = this.resultCache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    const result = await queryFunction();
    if (result.success) {
      this.resultCache.set(cacheKey, result);
    }

    return { ...result, fromCache: false };
  }
}
```

### 2. Database Connection Optimization

```javascript
// Connection pooling and management
class SparqlConnectionManager {
  constructor() {
    this.connections = new Map();
    this.connectionPool = new Map();
    this.healthChecks = new Map();
  }

  async getConnection(endpoint, options = {}) {
    const connectionKey = this.generateConnectionKey(endpoint, options);

    if (!this.connections.has(connectionKey)) {
      await this.createConnection(connectionKey, endpoint, options);
    }

    return this.connections.get(connectionKey);
  }

  async createConnection(connectionKey, endpoint, options) {
    const connection = {
      endpoint,
      options,
      lastUsed: Date.now(),
      queryCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    };

    this.connections.set(connectionKey, connection);

    // Start health monitoring
    this.startHealthCheck(connectionKey);
  }

  startHealthCheck(connectionKey) {
    const healthCheckInterval = setInterval(async () => {
      const connection = this.connections.get(connectionKey);
      if (!connection) {
        clearInterval(healthCheckInterval);
        return;
      }

      try {
        const testQuery = 'SELECT (1 as ?test) WHERE { BIND(1 as ?test) }';
        const startTime = Date.now();
        await this.executeHealthCheck(connection.endpoint, testQuery);
        const responseTime = Date.now() - startTime;

        connection.lastHealthCheck = Date.now();
        connection.healthy = true;
        connection.lastResponseTime = responseTime;
      } catch (error) {
        connection.healthy = false;
        connection.lastError = error.message;
        console.warn(`Health check failed for ${connection.endpoint}: ${error.message}`);
      }
    }, 30000); // Check every 30 seconds

    this.healthChecks.set(connectionKey, healthCheckInterval);
  }

  async executeHealthCheck(endpoint, query) {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('queryLn', 'sparql');

    const response = await fetch(`${endpoint}?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/sparql-results+json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  generateConnectionKey(endpoint, options) {
    return `${endpoint}:${JSON.stringify(options)}`;
  }

  getConnectionStats() {
    const stats = {};
    for (const [key, connection] of this.connections) {
      stats[key] = {
        endpoint: connection.endpoint,
        queryCount: connection.queryCount,
        errorCount: connection.errorCount,
        avgResponseTime: connection.avgResponseTime,
        healthy: connection.healthy,
        lastUsed: connection.lastUsed
      };
    }
    return stats;
  }
}
```

## Implementation Timeline

### Phase 1: Core Infrastructure (Weeks 1-2)

#### Week 1: Query Builder Foundation
- **Day 1-2**: Create `SparqlQueryBuilder` class with template system
- **Day 3-4**: Implement engine adaptation layer for Blazegraph/QLever
- **Day 5**: Add basic fragment injection pipeline
- **Weekend**: Create unit tests for query building

#### Week 2: Facet Fragment Generators
- **Day 1-2**: Implement `TextFacetGenerator` with advanced filtering
- **Day 3-4**: Create `RangeFacetGenerator` for depth/temporal filtering
- **Day 5**: Implement `SpatialFacetGenerator` for geographic queries
- **Weekend**: Add `PropertyValueFacetGenerator` for variable measured

### Phase 2: Testing Infrastructure (Weeks 3-4)

#### Week 3: Live Database Testing
- **Day 1-2**: Set up `SparqlTestService` with retry logic and validation
- **Day 3-4**: Create cross-engine validation test suite
- **Day 5**: Implement performance testing framework
- **Weekend**: Add resilience and error handling tests

#### Week 4: Advanced Testing Features
- **Day 1-2**: Create integration test suite for end-to-end workflows
- **Day 3-4**: Implement load testing and concurrent query validation
- **Day 5**: Set up CI/CD pipeline with GitHub Actions
- **Weekend**: Create monitoring and alerting system

### Phase 3: Component Integration (Weeks 5-6)

#### Week 5: Facet Component Updates
- **Day 1-2**: Refactor `FacetText.vue` to use SPARQL generation
- **Day 3-4**: Update `RangeSliderDepth.vue` and `RangeSliderYear.vue`
- **Day 5**: Modify `GeoBoundingBoxPicker.vue` for spatial queries
- **Weekend**: Create comprehensive component tests

#### Week 6: Search Component Refactoring
- **Day 1-3**: Simplify `Search.vue` by removing client-side filtering
- **Day 4-5**: Implement query orchestration and caching
- **Weekend**: Integration testing and bug fixes

### Phase 4: Optimization and Deployment (Week 7)

#### Week 7: Performance Optimization
- **Day 1-2**: Query optimization and performance tuning
- **Day 3-4**: Cache implementation and validation
- **Day 5**: Documentation and deployment preparation
- **Weekend**: Final testing and quality assurance

## Risk Mitigation

### 1. Performance Risks

**Risk**: SPARQL queries may be slower than client-side filtering
**Mitigation**:
- Implement comprehensive caching at multiple levels
- Use query optimization techniques specific to each engine
- Provide fallback to client-side filtering for complex queries
- Monitor performance metrics and alert on regressions

### 2. Data Consistency Risks

**Risk**: Different results between engines or compared to current system
**Mitigation**:
- Implement cross-engine result validation in test suite
- Create data consistency checks comparing old vs new system
- Use feature flags for gradual rollout
- Maintain detailed logging for debugging inconsistencies

### 3. Database Availability Risks

**Risk**: SPARQL endpoints may be unavailable or slow
**Mitigation**:
- Implement robust retry logic with exponential backoff
- Add circuit breaker pattern for failing endpoints
- Provide graceful degradation to cached results
- Monitor endpoint health and automatically switch to backup endpoints

### 4. Query Complexity Risks

**Risk**: Complex facet combinations may generate inefficient queries
**Mitigation**:
- Implement query complexity analysis and optimization
- Set query timeout limits and complexity thresholds
- Provide query plan analysis for debugging
- Cache complex query results aggressively

## Success Metrics

### Performance Targets
- **Simple text search**: < 3 seconds (95th percentile)
- **Single facet filter**: < 5 seconds (95th percentile)
- **Multi-facet filter**: < 8 seconds (95th percentile)
- **Complex range filter**: < 10 seconds (95th percentile)

### Quality Targets
- **Query success rate**: > 99.5%
- **Result consistency**: < 2% variance between engines for same data
- **Cache hit rate**: > 80% for repeated queries
- **Error recovery**: 100% graceful handling without data loss

### User Experience Targets
- **Perceived performance**: Faster than current client-side filtering
- **Feature parity**: 100% functional equivalence with current system
- **Reliability**: < 0.1% query failures in production
- **Scalability**: Support for 10x larger datasets without performance degradation

## Monitoring and Observability

### 1. Query Performance Monitoring
```javascript
// Performance monitoring service
class QueryPerformanceMonitor {
  constructor() {
    this.metrics = {
      queryTimes: new Map(),
      errorRates: new Map(),
      cacheHitRates: new Map(),
      endpointHealth: new Map()
    };
  }

  recordQueryMetrics(queryType, duration, success, fromCache) {
    const key = `${queryType}_${success ? 'success' : 'error'}`;

    if (!this.metrics.queryTimes.has(key)) {
      this.metrics.queryTimes.set(key, []);
    }

    this.metrics.queryTimes.get(key).push({
      duration,
      timestamp: Date.now(),
      fromCache
    });

    // Keep only last 1000 entries
    const times = this.metrics.queryTimes.get(key);
    if (times.length > 1000) {
      times.splice(0, times.length - 1000);
    }
  }

  generatePerformanceReport() {
    const report = {
      queryPerformance: {},
      cacheEfficiency: {},
      errorRates: {},
      timestamp: Date.now()
    };

    // Calculate performance metrics
    for (const [key, times] of this.metrics.queryTimes) {
      const recentTimes = times.filter(t => Date.now() - t.timestamp < 3600000); // Last hour

      if (recentTimes.length > 0) {
        const durations = recentTimes.map(t => t.duration);
        const cachedCount = recentTimes.filter(t => t.fromCache).length;

        report.queryPerformance[key] = {
          count: recentTimes.length,
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          p95Duration: this.calculatePercentile(durations, 95),
          p99Duration: this.calculatePercentile(durations, 99),
          cacheHitRate: cachedCount / recentTimes.length
        };
      }
    }

    return report;
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

### 2. Alerting System
```javascript
// Alert configuration for performance monitoring
const alertThresholds = {
  queryTime: {
    warning: 5000,   // 5 seconds
    critical: 10000  // 10 seconds
  },
  errorRate: {
    warning: 0.01,   // 1%
    critical: 0.05   // 5%
  },
  cacheHitRate: {
    warning: 0.7,    // 70%
    critical: 0.5    // 50%
  }
};

class AlertManager {
  constructor(monitoringService) {
    this.monitoring = monitoringService;
    this.alerts = new Map();
    this.alertHandlers = [];
  }

  addAlertHandler(handler) {
    this.alertHandlers.push(handler);
  }

  checkAlerts() {
    const report = this.monitoring.generatePerformanceReport();

    // Check query performance alerts
    for (const [queryType, metrics] of Object.entries(report.queryPerformance)) {
      this.checkQueryPerformanceAlert(queryType, metrics);
    }
  }

  checkQueryPerformanceAlert(queryType, metrics) {
    const { p95Duration, errorRate, cacheHitRate } = metrics;

    // Check response time alerts
    if (p95Duration > alertThresholds.queryTime.critical) {
      this.triggerAlert('critical', `High query time for ${queryType}: ${p95Duration}ms`);
    } else if (p95Duration > alertThresholds.queryTime.warning) {
      this.triggerAlert('warning', `Elevated query time for ${queryType}: ${p95Duration}ms`);
    }

    // Check cache performance alerts
    if (cacheHitRate < alertThresholds.cacheHitRate.critical) {
      this.triggerAlert('critical', `Low cache hit rate for ${queryType}: ${cacheHitRate * 100}%`);
    }
  }

  triggerAlert(level, message) {
    const alert = {
      level,
      message,
      timestamp: Date.now(),
      id: this.generateAlertId()
    };

    this.alerts.set(alert.id, alert);

    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler failed:', error);
      }
    });
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

This comprehensive plan provides detailed technical specifications for implementing server-side SPARQL filtering with robust testing, performance optimization, and monitoring capabilities. The phased approach ensures systematic development with clear milestones and success criteria.