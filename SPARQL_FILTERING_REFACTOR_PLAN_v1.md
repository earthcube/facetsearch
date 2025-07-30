# GeoCODES Faceted Search: SPARQL-Based Filtering Refactor Plan

## Executive Summary

This document outlines a comprehensive plan to refactor the GeoCODES Faceted Search application from **client-side post-query filtering** to **server-side SPARQL query-based filtering**. This architectural change moves filtering logic from Vue.js components to SPARQL query generation, enabling more efficient database queries and real-time faceted search.

## Current vs. Proposed Architecture

### Current Architecture (Client-Side Filtering)
```
User Search → Single SPARQL Query → All Results → Client-Side Filtering → Filtered Results
```

1. Execute broad SPARQL query with text search
2. Receive all matching results
3. Apply filters client-side in Search.vue
4. Display filtered subset

### Proposed Architecture (Server-Side SPARQL Filtering)
```
User Search → Base Query + Facet Filters → Dynamic SPARQL Generation → Filtered Results
```

1. Start with text search (no filters)
2. User applies facet filters
3. Each facet generates SPARQL query fragments
4. Combine fragments into optimized SPARQL query
5. Execute filtered query at database level

## Key Architectural Changes

### 1. Query Strategy Transformation
- **FROM**: Single broad query + client filtering
- **TO**: Dynamic query building with server-side filtering

### 2. Component Responsibilities
- **FROM**: Components manage UI state, Search.vue handles filtering
- **TO**: Components generate SPARQL fragments, manage their own query logic

### 3. Data Flow
- **FROM**: Large result set → client filtering → displayed results
- **TO**: Filter state → SPARQL generation → targeted query → relevant results

## SPARQL Query Architecture

### Base Query Structure
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX schema: <http://schema.org/>
PREFIX sschema: <https://schema.org/>

SELECT DISTINCT ?subj ?pubname ?placenames ?kw ?datep ?disurl 
       ?score ?name ?description ?resourceType ?type ?g
       ?maxlat ?minlat ?maxlon ?minlon ?maxDepth ?minDepth 
       ?temporalCoverage ?variableMeasured ?bbox
WHERE {
  # TEXT SEARCH (base query)
  ${textSearchFragment}
  
  # FACET FILTERS (dynamically added)
  ${facetFilters}
  
  # RESPONSE BODY (static)
  ${responseBodyFragment}
}
GROUP BY ?subj ?pubname ?placename ?datep ?url ?name ?description 
         ?type ?maxDepth ?minDepth ?temporalCoverage ?bbox ?g
ORDER BY DESC(?score)
LIMIT ${n}
```

### Query Fragment Generation by Facet Type

#### 1. Text Facets (Keywords, Publishers, Places)
**Component**: `FacetText.vue`

```sparql
# Keywords Filter
FILTER(?subj schema:keywords|sschema:keywords ?selectedKeyword)
VALUES ?selectedKeyword { "Temperature" "Ocean" "Climate" }

# Publisher Filter  
FILTER(?pub_name IN ("NOAA", "NASA", "USGS"))

# Place Names Filter
FILTER(?place_name IN ("Atlantic Ocean", "Pacific Ocean"))
```

**Generation Logic**:
```javascript
generateTextFilter(selectedValues) {
  if (!selectedValues.length) return '';
  
  const field = this.facetSetting.field;
  const values = selectedValues.map(v => `"${v}"`).join(' ');
  
  if (field === 'kw') {
    return `FILTER(?subj schema:keywords|sschema:keywords ?selectedKeyword)
            VALUES ?selectedKeyword { ${values} }`;
  } else if (field === 'pubname') {
    return `FILTER(?pub_name IN (${values}))`;
  } else if (field === 'placenames') {
    return `FILTER(?place_name IN (${values}))`;
  }
}
```

#### 2. Depth Range Filter
**Component**: `RangeSliderDepth.vue`

```sparql
# Depth Range Filter
OPTIONAL {?subj sschema:variableMeasured ?vm .
          ?vm a sschema:PropertyValue .
          ?vm sschema:name ?namedepth .
          FILTER (?namedepth IN ("depth", "CmpDep")) .
          ?vm sschema:maxValue ?maxDepth_d .
          ?vm sschema:minValue ?minDepth_d .
          FILTER(?minDepth_d >= ${minDepth} && ?maxDepth_d <= ${maxDepth})
}
```

**Generation Logic**:
```javascript
generateDepthFilter(minDepth, maxDepth) {
  return `
    OPTIONAL {?subj sschema:variableMeasured ?vm .
              ?vm a sschema:PropertyValue .
              ?vm sschema:name ?namedepth .
              FILTER (?namedepth IN ("depth", "CmpDep")) .
              ?vm sschema:maxValue ?maxDepth_d .
              ?vm sschema:minValue ?minDepth_d .
              FILTER(?minDepth_d >= ${minDepth} && ?maxDepth_d <= ${maxDepth})
    }`;
}
```

#### 3. Temporal Coverage Filter
**Component**: `RangeSliderYear.vue`

```sparql
# Temporal Coverage Filter
OPTIONAL {?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .
          FILTER(REGEX(?temporalCoverage, "${startYear}") || 
                 REGEX(?temporalCoverage, "${endYear}") ||
                 (xsd:integer(SUBSTR(?temporalCoverage, 1, 4)) >= ${startYear} &&
                  xsd:integer(SUBSTR(?temporalCoverage, 1, 4)) <= ${endYear}))
}
```

**Generation Logic**:
```javascript
generateTemporalFilter(startYear, endYear) {
  return `
    OPTIONAL {?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .
              FILTER((xsd:integer(SUBSTR(?temporalCoverage, 1, 4)) >= ${startYear} &&
                      xsd:integer(SUBSTR(?temporalCoverage, 1, 4)) <= ${endYear}) ||
                     REGEX(?temporalCoverage, "${startYear}|${endYear}"))
    }`;
}
```

#### 4. Spatial Coverage Filter
**Component**: `GeoBoundingBoxPicker.vue`

```sparql
# Spatial Bounding Box Filter
OPTIONAL {?subj schema:spatialCoverage/schema:geo/schema:latitude ?lat .
          ?subj schema:spatialCoverage/schema:geo/schema:longitude ?lon .
          FILTER(?lat >= ${minLat} && ?lat <= ${maxLat} &&
                 ?lon >= ${minLon} && ?lon <= ${maxLon})
}
```

**Generation Logic**:
```javascript
generateSpatialFilter(bounds) {
  const { minLat, maxLat, minLon, maxLon } = bounds;
  return `
    OPTIONAL {?subj schema:spatialCoverage/schema:geo/schema:latitude ?lat .
              ?subj schema:spatialCoverage/schema:geo/schema:longitude ?lon .
              FILTER(?lat >= ${minLat} && ?lat <= ${maxLat} &&
                     ?lon >= ${minLon} && ?lon <= ${maxLon})
    }`;
}
```

## Component Architecture Redesign

### 1. Enhanced Facet Components

Each facet component becomes responsible for:
- **SPARQL Fragment Generation**: Create query fragments for their filter type
- **Filter State Management**: Track active filter values
- **Query Coordination**: Communicate with parent when filters change

#### Base Facet Interface
```javascript
// Shared interface for all facet components
export const FacetMixin = {
  props: {
    facetSetting: { type: Object, required: true },
    queryEngine: { type: String, required: true } // 'blazegraph' or 'qlever'
  },
  
  methods: {
    // Each component must implement this
    generateSparqlFragment() {
      throw new Error('generateSparqlFragment must be implemented');
    },
    
    // Emit filter changes to parent
    emitFilterChange() {
      this.$emit('filter-changed', {
        field: this.facetSetting.field,
        fragment: this.generateSparqlFragment(),
        active: this.hasActiveFilters()
      });
    },
    
    // Check if component has active filters
    hasActiveFilters() {
      throw new Error('hasActiveFilters must be implemented');
    }
  }
};
```

### 2. Query Building Service

**New File**: `client/src/services/sparqlQueryBuilder.js`

```javascript
export class SparqlQueryBuilder {
  constructor(baseQuery, queryEngine) {
    this.baseQuery = baseQuery;
    this.queryEngine = queryEngine;
    this.facetFragments = new Map();
  }
  
  // Add/update facet filter fragment
  setFacetFragment(field, fragment) {
    if (fragment && fragment.trim()) {
      this.facetFragments.set(field, fragment);
    } else {
      this.facetFragments.delete(field);
    }
  }
  
  // Generate complete SPARQL query
  buildQuery(textQuery, limit = 10) {
    const textFragment = this.generateTextSearchFragment(textQuery);
    const facetFilters = Array.from(this.facetFragments.values()).join('\n');
    
    return this.baseQuery
      .replace('${textSearchFragment}', textFragment)
      .replace('${facetFilters}', facetFilters)
      .replace('${n}', limit);
  }
  
  generateTextSearchFragment(query) {
    if (this.queryEngine === 'blazegraph') {
      return `
        ?lit bds:search "${query}" .
        ?lit bds:relevance ?score1 .
        ?g ?p ?lit .
      `;
    } else if (this.queryEngine === 'qlever') {
      return `
        ?subj ?o ?item .
        ?text ql:contains-entity ?item .
        ?text ql:contains-word "${query}"
      `;
    }
  }
}
```

### 3. Refactored Search.vue

```javascript
// Simplified Search.vue - focuses on coordination
export default {
  name: "Search",
  
  data() {
    return {
      queryBuilder: null,
      currentQuery: '',
      isLoading: false,
      results: []
    };
  },
  
  created() {
    // Initialize query builder with base query template
    this.queryBuilder = new SparqlQueryBuilder(
      this.getBaseQueryTemplate(),
      this.FacetsConfig.QUERY_ENGINE
    );
  },
  
  methods: {
    // Handle facet filter changes
    onFacetFilterChanged(filterData) {
      this.queryBuilder.setFacetFragment(
        filterData.field, 
        filterData.fragment
      );
      
      // Debounce query execution
      this.debouncedSearch();
    },
    
    // Execute search with current filters
    async executeSearch() {
      this.isLoading = true;
      
      try {
        const sparqlQuery = this.queryBuilder.buildQuery(
          this.textQuery, 
          this.n
        );
        
        const results = await this.$store.dispatch('executeSparqlQuery', {
          query: sparqlQuery,
          endpoint: this.FacetsConfig.TRIPLESTORE_URL
        });
        
        this.results = results;
        this.updateFacetCounts();
        
      } catch (error) {
        this.handleQueryError(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    debouncedSearch: _.debounce(function() {
      this.executeSearch();
    }, 300)
  }
};
```

## Implementation Plan

### Phase 1: Infrastructure (2-3 weeks)

#### 1.1 Query Builder Service
- Create `SparqlQueryBuilder` class
- Implement template-based query generation
- Add support for both Blazegraph and QLever syntax
- Unit tests for query generation

#### 1.2 Base Query Templates
- Extract current queries into parameterized templates
- Create separate templates for each query engine
- Add placeholder injection system

#### 1.3 Enhanced Store Actions
- Add `executeSparqlQuery` action to Vuex store
- Implement query caching and debouncing
- Add error handling and retry logic

### Phase 2: Component Refactoring (3-4 weeks)

#### 2.1 FacetText.vue Enhancement
- Implement `generateSparqlFragment()` method
- Add support for multiple text filter types
- Handle different query engines (Blazegraph vs QLever)

#### 2.2 RangeSliderDepth.vue Enhancement
- Convert numeric range logic to SPARQL fragments
- Implement depth field mapping from configuration
- Add validation for depth values

#### 2.3 RangeSliderYear.vue Enhancement
- Convert temporal parsing to SPARQL date filtering
- Handle various date formats (ISO, year ranges, intervals)
- Implement temporal overlap logic in SPARQL

#### 2.4 GeoBoundingBoxPicker.vue Enhancement
- Convert coordinate filtering to SPARQL spatial queries
- Implement bounding box intersection logic
- Add support for different spatial data formats

### Phase 3: Search.vue Refactoring (1-2 weeks)

#### 3.1 Remove Client-Side Filtering
- Remove 300+ lines of filtering logic
- Simplify to query coordination and result management
- Implement facet communication system

#### 3.2 Query Orchestration
- Add facet filter change handling
- Implement debounced query execution
- Add loading states and error handling

### Phase 4: Testing & Optimization (2 weeks)

#### 4.1 Query Performance Testing
- Benchmark query performance vs. current system
- Optimize SPARQL queries for each engine
- Implement query result caching

#### 4.2 User Experience Testing
- Test real-time filtering responsiveness
- Validate all facet combinations work correctly
- Cross-browser compatibility testing

## Technical Considerations

### Query Engine Differences

#### Blazegraph Specifics
- Uses `bds:search` for full-text search
- Different date/time handling functions
- Specific optimization patterns

#### QLever Specifics  
- Uses `ql:contains-word` for text search
- Different spatial query syntax
- Optimized for large-scale queries

### Performance Optimizations

#### 1. Query Caching
```javascript
// Cache frequently used queries
const queryCache = new LRUCache({
  max: 100,
  maxAge: 1000 * 60 * 5 // 5 minutes
});
```

#### 2. Incremental Filtering
- Only rebuild changed query fragments
- Reuse stable query parts
- Minimize query complexity

#### 3. Result Streaming
- Implement pagination at SPARQL level
- Stream large result sets
- Progressive result loading

### Error Handling

#### Query Validation
- Validate SPARQL syntax before execution
- Sanitize user input in query fragments
- Handle malformed queries gracefully

#### Fallback Strategies
- Fallback to broader queries if specific filters fail
- Graceful degradation for unsupported filter combinations
- User-friendly error messages

## Benefits of SPARQL-Based Filtering

### 1. Performance Improvements
- **Reduced Data Transfer**: Only relevant results returned
- **Database-Level Optimization**: Leverage SPARQL engine optimizations
- **Faster Response Times**: No client-side processing of large datasets

### 2. Scalability
- **Large Datasets**: Handle millions of records efficiently
- **Complex Queries**: Database handles complex filtering logic
- **Resource Efficiency**: Lower client memory usage

### 3. Real-Time Filtering
- **Immediate Results**: No delay from client-side processing
- **Dynamic Queries**: Adapt to user selections instantly
- **Responsive UI**: Better user experience with faster filtering

### 4. Maintainability
- **Centralized Logic**: Query logic in database, not scattered in UI
- **Easier Debugging**: SPARQL queries can be tested independently
- **Better Separation**: Clear distinction between UI and data logic

## Migration Strategy

### 1. Dual Mode Operation
- Implement feature flag to switch between old/new systems
- Run both systems in parallel during testing
- Gradual rollout to user segments

### 2. Backward Compatibility
- Maintain existing URL parameter structure
- Support existing bookmark links
- Preserve user collection functionality

### 3. Data Validation
- Compare results between old and new systems
- Validate query correctness across all facet combinations
- Monitor performance metrics during migration

## Success Metrics

### Performance Targets
- **Query Response Time**: < 500ms for typical queries
- **Initial Load Time**: < 2 seconds for search interface
- **Filter Response Time**: < 200ms for facet updates

### Quality Targets
- **Result Accuracy**: 100% parity with current system
- **Feature Completeness**: All existing filters work correctly
- **Error Rate**: < 0.1% query failures

### User Experience Targets
- **Perceived Performance**: Faster filtering experience
- **System Reliability**: 99.9% uptime during migration
- **User Satisfaction**: No regression in user feedback

## Risk Assessment

### High Risk
1. **Query Performance**: SPARQL queries may be slower than client filtering
   - **Mitigation**: Extensive performance testing and query optimization

2. **Result Accuracy**: Different filtering logic may produce different results
   - **Mitigation**: Comprehensive result validation during parallel testing

### Medium Risk
1. **Complexity**: SPARQL query generation adds complexity
   - **Mitigation**: Thorough unit testing and documentation

2. **Database Load**: More frequent queries may impact database performance
   - **Mitigation**: Query caching and connection pooling

### Low Risk
1. **Browser Compatibility**: Modern JavaScript features
   - **Mitigation**: Babel transpilation and polyfills

## Conclusion

The migration to SPARQL-based filtering represents a fundamental architectural improvement that will:

- **Improve Performance**: Faster, more responsive filtering
- **Enhance Scalability**: Handle larger datasets efficiently  
- **Simplify Maintenance**: Cleaner separation of concerns
- **Enable Future Features**: Foundation for advanced query capabilities

The phased approach minimizes risk while providing clear milestones and the ability to validate improvements at each step.

**Recommended Timeline**: 8-10 weeks total implementation
**Resource Requirements**: 2-3 senior developers (1 frontend, 1-2 backend/SPARQL)
**Prerequisites**: SPARQL expertise, database performance testing tools

---

*This document should be reviewed by the development team, database administrators, and product stakeholders before implementation begins.*