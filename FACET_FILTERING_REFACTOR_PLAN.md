# GeoCODES Faceted Search: Filter Refactoring Plan

## Executive Summary

This document outlines a comprehensive plan to refactor the GeoCODES Faceted Search application's filtering architecture from a centralized approach to a distributed facet-based filtering system. The goal is to move filtering complexity from `Search.vue` to individual facet components, making the system more modular, maintainable, and extensible.

## Current Architecture Analysis

### Current State
- **Centralized Filtering**: All filtering logic resides in `client/src/components/facetsearch/Search.vue` (~800 lines)
- **Complex Filter Method**: The `filter()` method (lines 377-659) handles all facet types with nested conditionals
- **Mixed Concerns**: Search.vue manages both UI coordination and complex filtering business logic
- **Tight Coupling**: Facet components are tightly coupled to Search.vue through injection dependencies

### Current Facet Components
1. **FacetText.vue** - Text-based facets (keywords, publishers, places)
2. **RangeSliderYear.vue** - Temporal coverage filtering with date range logic
3. **RangeSliderDepth.vue** - Depth range filtering with numeric range logic
4. **GeoBoundingBoxPicker.vue** - Spatial filtering with coordinate-based logic

### Current Filter Types
- **Text Filters**: Array-based intersection filtering
- **Range Filters**: Numeric/date range overlap checking
- **Spatial Filters**: Coordinate-based bounding box filtering

## Proposed Architecture

### New Distributed Filtering System

#### Core Principle
Each facet component becomes responsible for:
1. **Self-contained filtering logic**
2. **Data processing and validation**
3. **Filter state management**
4. **Communication with parent via standardized interface**

#### Component Responsibilities

##### 1. Search.vue (Coordinator)
- **Reduced Responsibility**: Orchestration and result aggregation only
- **Filter Aggregation**: Collect filters from all facet components
- **Result Management**: Apply aggregated filters to dataset
- **State Coordination**: Manage overall search state and URL updates

##### 2. Individual Facet Components
- **Self-Filtering**: Each component implements its own filtering logic
- **Data Validation**: Validate and process facet-specific data
- **Filter Generation**: Generate standardized filter objects
- **State Management**: Manage internal component state

#### New Interface Contract

```javascript
// Standardized Filter Interface
interface FacetFilter {
  field: string           // facet field name
  type: 'text' | 'range' | 'spatial' | 'temporal'
  active: boolean         // whether filter is currently active
  value: any             // filter value (varies by type)
  metadata?: object      // additional filter metadata
}

// Text Filter Example
{
  field: 'keywords',
  type: 'text',
  active: true,
  value: ['Temperature', 'Ocean'],
  metadata: { operator: 'intersection' }
}

// Range Filter Example  
{
  field: 'depth',
  type: 'range',
  active: true,
  value: { min: -1000, max: 0 },
  metadata: { 
    minField: 'minDepth', 
    maxField: 'maxDepth',
    unit: 'meters'
  }
}
```

## Migration Plan

### Phase 1: Infrastructure Setup
**Estimated Duration**: 1-2 weeks

#### 1.1 Create Filter Utilities
- **FilterUtils.js**: Common filtering utilities and validators
- **FilterTypes.js**: Type definitions and interfaces
- **RangeCalculator.js**: Range overlap calculation logic

#### 1.2 Implement Event System
- **Filter Change Events**: Standardized events for filter updates
- **Validation Pipeline**: Input validation and sanitization
- **Error Handling**: Consistent error handling across components

#### 1.3 Update Base Configuration
- **Extended Facet Config**: Add filtering metadata to configuration
- **Migration Helpers**: Utilities to migrate existing filter state

### Phase 2: Component Refactoring
**Estimated Duration**: 2-3 weeks

#### 2.1 FacetText.vue Enhancement
**Current**: Basic text filtering through parent injection
**Target**: Self-contained text filtering with intersection logic

```javascript
// New Methods to Implement
- processTextFilter(selectedValues)
- validateTextInput(input)
- generateTextFilter()
- applyTextFilter(items, filter)
```

#### 2.2 RangeSliderYear.vue Enhancement  
**Current**: Range calculation via parent method
**Target**: Self-contained temporal range filtering

```javascript
// New Methods to Implement
- parseTemporalCoverage(coverage)
- calculateDateRangeOverlap(itemRange, filterRange)
- generateTemporalFilter()
- applyTemporalFilter(items, filter)
```

#### 2.3 RangeSliderDepth.vue Enhancement
**Current**: Numeric range filtering via parent
**Target**: Self-contained depth range filtering

```javascript
// New Methods to Implement  
- calculateNumericRangeOverlap(itemRange, filterRange)
- validateDepthRange(range)
- generateDepthFilter()
- applyDepthFilter(items, filter)
```

#### 2.4 GeoBoundingBoxPicker.vue Enhancement
**Current**: Coordinate filtering via parent
**Target**: Self-contained spatial filtering

```javascript
// New Methods to Implement
- calculateBoundingBoxIntersection(itemBounds, filterBounds)
- validateCoordinates(bounds)
- generateSpatialFilter()
- applySpatialFilter(items, filter)
```

### Phase 3: Search.vue Simplification
**Estimated Duration**: 1-2 weeks

#### 3.1 Remove Complex Filter Logic
- **Extract**: Move ~300 lines of filtering logic to components
- **Simplify**: Reduce filter() method to aggregation and coordination
- **Clean**: Remove type-specific filtering conditionals

#### 3.2 Implement Aggregation System
```javascript
// New Simplified Filter Method
filter() {
  const activeFilters = this.collectActiveFilters()
  const filteredResults = this.applyAggregatedFilters(this.items, activeFilters)
  this.updateResults(filteredResults)
  this.updateFacetCounts(filteredResults)
}

collectActiveFilters() {
  return this.facetComponents
    .map(component => component.getActiveFilter())
    .filter(filter => filter.active)
}
```

#### 3.3 Update State Management
- **Centralized State**: Maintain filter state collection
- **URL Synchronization**: Update URL parameters based on active filters
- **History Management**: Browser history integration

### Phase 4: Testing and Validation
**Estimated Duration**: 1 week

#### 4.1 Unit Testing
- **Component Tests**: Test each facet component's filtering logic
- **Integration Tests**: Test filter aggregation and coordination
- **Edge Case Testing**: Boundary conditions and error scenarios

#### 4.2 User Acceptance Testing
- **Functional Testing**: Verify all existing functionality works
- **Performance Testing**: Ensure no performance regressions
- **Cross-browser Testing**: Compatibility across target browsers

## Technical Implementation Details

### New File Structure
```
client/src/components/facetsearch/
├── filters/
│   ├── FilterUtils.js          # Common filtering utilities
│   ├── FilterTypes.js          # Type definitions
│   ├── RangeCalculator.js      # Range calculation logic
│   └── SpatialCalculator.js    # Spatial intersection logic
├── mixins/
│   └── FacetFilterMixin.js     # Common facet functionality
├── FacetText.vue               # Enhanced text filtering
├── RangeSliderYear.vue         # Enhanced temporal filtering  
├── RangeSliderDepth.vue        # Enhanced depth filtering
├── GeoBoundingBoxPicker.vue    # Enhanced spatial filtering
└── Search.vue                  # Simplified coordinator
```

### Configuration Updates
```yaml
# Extended facet configuration
FACETS:
  - field: keywords
    title: Keywords
    type: text
    sort: asc
    open: true
    filtering:
      operator: intersection
      caseSensitive: false
      
  - field: depth  
    title: Depth Range
    type: depthrange
    sort: asc
    open: true
    filtering:
      minField: minDepth
      maxField: maxDepth
      unit: meters
      defaultRange: [-5000, 0]
```

### Data Flow Architecture
```
User Interaction → Facet Component → Filter Generation → Search Coordinator → Result Update → UI Refresh
     ↑                                                                                              ↓
URL State ←← URL Update ←← State Management ←← Filter Aggregation ←← Filter Collection ←← Facet State
```

## Benefits of New Architecture

### 1. Modularity
- **Separation of Concerns**: Each component handles its specific filtering logic
- **Reusability**: Components can be easily reused in other contexts
- **Maintainability**: Changes to one filter type don't affect others

### 2. Extensibility  
- **New Filter Types**: Easy to add new facet types without modifying Search.vue
- **Custom Logic**: Each facet can implement specialized filtering algorithms
- **Configuration Driven**: New facets can be added via configuration

### 3. Testability
- **Unit Testing**: Individual filter logic can be tested in isolation
- **Mocking**: Components can be easily mocked for testing
- **Debugging**: Issues can be isolated to specific components

### 4. Performance
- **Selective Processing**: Only active filters perform processing
- **Caching**: Individual components can cache their results
- **Lazy Evaluation**: Filters only execute when needed

## Risk Assessment and Mitigation

### High Risk Items
1. **Data Consistency**: Filter state synchronization between components
   - **Mitigation**: Centralized state management with validation
   
2. **Performance Impact**: Multiple filter processing cycles  
   - **Mitigation**: Debounced updates and result caching

3. **Breaking Changes**: Existing URL parameters and bookmarks
   - **Mitigation**: Backward compatibility layer during migration

### Medium Risk Items
1. **Complex Range Logic**: Temporal and depth range calculations
   - **Mitigation**: Comprehensive unit testing and validation

2. **Browser Compatibility**: New JavaScript features
   - **Mitigation**: Babel transpilation and polyfills

### Low Risk Items
1. **UI Changes**: Minor visual inconsistencies
   - **Mitigation**: CSS regression testing and design review

## Success Metrics

### Code Quality Metrics
- **Lines of Code**: Reduce Search.vue from ~800 to ~400 lines
- **Cyclomatic Complexity**: Reduce complexity score by 60%
- **Test Coverage**: Achieve 90%+ coverage on filtering logic

### Performance Metrics
- **Filter Response Time**: Maintain <100ms filter application
- **Memory Usage**: No significant increase in memory footprint
- **Bundle Size**: Minimal impact on JavaScript bundle size

### User Experience Metrics
- **Functionality**: 100% feature parity with current system
- **Compatibility**: Support for existing bookmarks and URLs
- **Error Handling**: Graceful degradation for edge cases

## Conclusion

This refactoring plan transforms the GeoCODES Faceted Search from a monolithic filtering system to a modular, component-based architecture. The distributed approach will improve maintainability, testability, and extensibility while preserving all existing functionality.

The phased approach minimizes risk while providing clear milestones for progress tracking. The new architecture positions the application for future enhancements and easier integration of additional facet types.

**Recommended Timeline**: 6-8 weeks total implementation time
**Resource Requirements**: 1-2 senior frontend developers
**Testing Requirements**: Comprehensive unit and integration testing suite

---

*This document should be reviewed and approved by the development team before implementation begins.*