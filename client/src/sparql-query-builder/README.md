# SPARQL Query Builder Module

A standalone TypeScript module for building and executing dynamic SPARQL queries with faceted search capabilities. Supports both Blazegraph and QLever query engines.

## Features

- **Multi-Engine Support**: Works with both Blazegraph and QLever SPARQL endpoints
- **Faceted Search**: Dynamic facet filtering with text, range, and spatial facets
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **Configuration-Based**: YAML configuration files for easy setup
- **Fragment Injection**: Modular query building with fragment injection pipeline
- **Optimized Queries**: Engine-specific query optimizations

## Quick Start

### Installation

```typescript
import { SparqlQueryModule } from './sparql-query-builder';
```

### Basic Usage

```typescript
// Create module with configuration
const module = await SparqlQueryModule.create('/config/config_qlever.yaml');

// Execute a simple text search
const results = await module.executeTextSearch('nitrogen');
console.log(`Found ${results.resultCount} results in ${results.queryTime}ms`);

// Add filters
module.addTextFilter('kw', ['chemistry', 'oceanography']);
module.addRangeFilter('minDepth', 0, 1000);

// Execute with filters
const filteredResults = await module.executeTextSearch('nitrogen');
```

### Advanced Usage

```typescript
// Create with custom configuration
const module = await SparqlQueryModule.create('/path/to/config.yaml');

// Build custom query
const query = module.buildTextSearch('climate data', {
  limit: 100,
  orderBy: 'DESC(?score)',
  selectFields: '?subj ?name ?description ?kw'
});

// Execute custom query
const results = await module.executeQuery(query);

// Check module statistics
const stats = module.getQueryStats();
console.log(`Active filters: ${stats.activeFilters}`);
```

## Configuration

The module uses YAML configuration files compatible with the existing FacetSearch application:

```yaml
COMMUNITY: geocodesall
TRIPLESTORE_URL: https://qlever.geocodes-aws-dev.earthcube.org/graphspace/facetsearch
QUERY_ENGINE: qlever

FACETS:
  - field: kw
    title: Keywords
    type: text
    sort: asc
    open: true

  - field: minDepth
    title: Depth Range
    type: rangedepth
    range_fields: [minDepth, maxDepth]
    depth_properties: [depth, CmpDep, package_depth]

  - field: spatialCoverage
    title: Spatial Filter
    type: geo
```

## Supported Facet Types

### Text Facets
- **Keywords** (`kw`): Search within dataset keywords
- **Publishers** (`pubname`): Filter by data publishers
- **Place Names** (`placenames`): Geographic place name filtering
- **Resource Type** (`resourceType`): Filter by data/tool/project type

### Range Facets
- **Depth Range** (`rangedepth`): Filter by depth measurements
- **Year Range** (`rangeyear`): Filter by publication/creation years
- **Temporal Coverage** (`temporal`): Filter by temporal coverage

### Spatial Facets
- **Bounding Box** (`geo`): Geographic bounding box filtering

## API Reference

### SparqlQueryModule

#### Core Methods
- `executeTextSearch(query, options?)`: Execute text search
- `buildTextSearch(query, options?)`: Build text search query
- `buildQuery(options?)`: Build query with current facet state
- `executeQuery(query)`: Execute custom SPARQL query

#### Filter Management
- `addTextFilter(field, values)`: Add text facet filter
- `addRangeFilter(field, min, max)`: Add range facet filter
- `addSpatialFilter(field, bounds)`: Add spatial facet filter
- `removeFilter(field)`: Remove specific filter
- `clearFilters()`: Clear all filters

#### Information Methods
- `getConfig()`: Get configuration
- `getFacetConfig(field)`: Get facet configuration
- `getActiveFilters()`: Get active filter fields
- `getQueryStats()`: Get module statistics

### Query Options

```typescript
interface QueryOptions {
  limit?: number;        // Result limit (default: 50)
  offset?: number;       // Result offset (default: 0)
  selectFields?: string; // Custom SELECT fields
  groupBy?: boolean;     // Enable GROUP BY (default: true)
  orderBy?: string;      // ORDER BY clause (default: 'DESC(?score)')
  engine?: QueryEngine;  // Override engine
}
```

### Filter Values

```typescript
// Text filters
module.addTextFilter('kw', ['nitrogen', 'chemistry']);

// Range filters
module.addRangeFilter('minDepth', 0, 1000);

// Spatial filters
module.addSpatialFilter('spatialCoverage', {
  minLat: 30, maxLat: 50,
  minLon: -130, maxLon: -60
});
```

## Engine Support

### QLever
- Uses `ql:contains-word` for text search
- Optimized for large-scale knowledge graphs
- Full-text search with entity recognition

### Blazegraph
- Uses `bds:search` for text search
- Relevance scoring with `bds:relevance`
- Query hints for optimization

## Testing

Run the comprehensive test suite:

```typescript
import { runModuleTest } from './sparql-query-builder/__tests__/module-test';

const testResult = await runModuleTest();
console.log(`Tests ${testResult.success ? 'passed' : 'failed'}`);
```

## Architecture

The module follows the Fragment Injection Pipeline architecture:

1. **Configuration Reader**: Loads and validates YAML configuration
2. **Query Builder**: Orchestrates query construction with template system
3. **Engine Adapter**: Handles engine-specific optimizations
4. **Facet Generators**: Generate SPARQL fragments for different facet types
5. **Module Facade**: Provides simple interface for external use

## Error Handling

The module provides comprehensive error handling with custom error types:

- `SparqlQueryError`: Query generation or execution errors
- `ConfigurationError`: Configuration loading or validation errors
- `FacetGenerationError`: Facet fragment generation errors

## Performance

- Query execution timeouts (30 seconds default)
- Engine-specific optimizations
- Query validation and compatibility checking
- Performance metrics in query results

## Integration

The module is designed to be standalone but can be easily integrated into existing applications:

```typescript
// In Vue.js application
import { SparqlQueryModule } from '@/sparql-query-builder';

export default {
  async created() {
    this.sparqlModule = await SparqlQueryModule.create('/config/config.yaml');
  },

  methods: {
    async search(query) {
      const results = await this.sparqlModule.executeTextSearch(query);
      this.searchResults = results.results;
    }
  }
}
```