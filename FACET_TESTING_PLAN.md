# Testing Plan for Multi-Facet Count Verification

## Overview
This document outlines a comprehensive plan to add unit tests for verifying correct counts when multiple facets are selected in the FacetSearch application.

## Current System Analysis

### Data Flow Architecture
1. **Data Fetching**: `Search.vue:560-724` contains the main `getResults()` action that fetches data and stores it in `state.results`
2. **Filtering Logic**: `Search.vue:378-680` has the `filter()` method that:
   - Filters results based on active facets/filters (`currentResults`)
   - Resets facet counts (`resetFacetCount()`)
   - Recalculates counts for each facet based on filtered results
3. **Count Logic**: `Search.vue:658-670` iterates through facets and counts occurrences in `currentResults`
4. **State Management**: Uses Vuex store in `state.js` for managing search results and filters

### Key Components
- **Search.vue**: Main search component with filtering and counting logic
- **Facets.vue**: Container for all facet components
- **FacetText.vue**: Individual text-based facet component
- **state.js**: Vuex store managing application state

## Testing Infrastructure

### Available Framework
- **Framework**: Jest is already available (`@types/jest`, `@vue/vue3-jest` in package.json)
- **Vue Testing**: `@vue/test-utils` for component testing
- **Existing Test**: Basic test structure exists in `client/src/_test/state.js`

### Required Setup
- Configure Jest for Vue components
- Set up test utilities for Vuex store
- Create mock data fixtures

## Test Cases for Multi-Facet Count Scenarios

### 1. Unit Tests for Count Logic (`Search.vue`)

#### Core Counting Logic
```javascript
describe('Facet Count Logic', () => {
  test('should correctly count single facet values', () => {
    // Test basic counting when only one facet is applied
    // Verify facetStore[facet.field][val].count += 1 logic
  })
  
  test('should correctly count when multiple facets are selected', () => {
    // Test that counts reflect intersection of multiple filters
    // Ensure counts are accurate when filtering by multiple criteria
  })
  
  test('should show "+" for zero counts when filters are active', () => {
    // Test line 675: if (facet.count === 0 && filters.length) facet.count = "+";
    // Verify UI shows "+" when facet has no matches but other filters are active
  })
  
  test('should handle array-based facet values correctly', () => {
    // Test lines 661-665: handling of array values in facets
    // Verify val.forEach((facetitem) => { ... }) logic
  })
  
  test('should reset facet counts before recalculating', () => {
    // Test resetFacetCount() method execution
    // Ensure counts start at 0 before each calculation
  })
})
```

#### Edge Cases
```javascript
describe('Facet Count Edge Cases', () => {
  test('should handle undefined and empty values', () => {
    // Test line 666: val !== undefined && !_.isEmpty(val)
  })
  
  test('should handle missing facet fields gracefully', () => {
    // Test when item[facet.field] is undefined
  })
  
  test('should handle empty currentResults array', () => {
    // Test behavior when no results match filters
  })
})
```

### 2. Integration Tests for Filter Interactions

#### Multi-Facet Scenarios
```javascript
describe('Multi-Facet Filtering', () => {
  test('should maintain correct counts when adding second facet filter', () => {
    // 1. Apply first filter (e.g., publisher="USGS")
    // 2. Verify initial counts for all other facets
    // 3. Apply second filter (e.g., keywords="water")
    // 4. Verify counts update correctly for intersection
  })
  
  test('should update all facet counts when removing a filter', () => {
    // 1. Start with multiple active filters
    // 2. Remove one filter
    // 3. Verify all other facet counts update to reflect larger result set
  })
  
  test('should handle complex filter combinations', () => {
    // Test with 3+ simultaneous filters
    // Verify count accuracy with complex intersections
  })
  
  test('should maintain filter state consistency', () => {
    // Verify filters and currentResults stay in sync
    // Test toggleFilter() method behavior
  })
})
```

#### Range Filter Integration
```javascript
describe('Range Filter Count Integration', () => {
  test('should correctly count with numeric range filters', () => {
    // Test interaction between text facets and numeric ranges (depth, year)
    // Verify lines 420-490: isNumericRange filtering logic
  })
  
  test('should correctly count with date range filters', () => {
    // Test interaction between text facets and temporal ranges
    // Verify lines 491-519: isDateRange filtering logic
  })
})
```

### 3. State Management Tests

#### Vuex Store Operations
```javascript
describe('Vuex Store Facet Operations', () => {
  test('should update facetStore counts correctly', () => {
    // Test state mutations for facet counts
    // Verify store state changes propagate to components
  })
  
  test('should handle cache invalidation on filter changes', () => {
    // Test microCache behavior with filters
    // Verify cached results are invalidated appropriately
  })
  
  test('should maintain search state consistency', () => {
    // Test coordination between search results and facet state
    // Verify state.results and computed currentResults alignment
  })
})
```

### 4. Performance Tests

#### Large Dataset Handling
```javascript
describe('Performance with Large Datasets', () => {
  test('should handle 1000+ results efficiently', () => {
    // Test count calculation performance
    // Verify filter operations complete in reasonable time
  })
  
  test('should handle facets with many values', () => {
    // Test facets with 100+ unique values
    // Verify count accuracy and performance
  })
})
```

## Implementation Phases

### Phase 1: Setup Test Environment
**Timeline**: 1-2 days

**Tasks**:
- Configure Jest for Vue components
- Set up test utilities for Vuex store
- Create mock data fixtures representing realistic dataset scenarios
- Configure test file structure in `client/src/__tests__/`

**Deliverables**:
- `jest.config.js` configuration
- Mock data files with various facet combinations
- Test utility helpers for component setup

### Phase 2: Core Logic Tests
**Timeline**: 2-3 days

**Tasks**:
- Implement unit tests for `resetFacetCount()` method
- Test count calculation logic in `filter()` method
- Test edge cases (empty results, undefined values)
- Test array vs single value handling

**Deliverables**:
- `Search.test.js` with comprehensive unit tests
- Coverage for all counting logic branches
- Edge case validation

### Phase 3: Integration Tests
**Timeline**: 2-3 days

**Tasks**:
- Test complete filtering workflows
- Test multi-facet scenarios with realistic data
- Test range filter integration
- Test state management consistency

**Deliverables**:
- Integration test suite covering multi-facet interactions
- Performance benchmarks for large datasets
- State management validation tests

### Phase 4: Configuration & CI
**Timeline**: 1 day

**Tasks**:
- Add test scripts to package.json
- Configure test coverage reporting
- Integrate with existing development workflow
- Document test execution procedures

**Deliverables**:
- Updated package.json with test commands
- Coverage reporting configuration
- Documentation for running tests

## Key Test Data Scenarios

### 1. Basic Multi-Facet Dataset
```javascript
const mockDataset = [
  {
    subj: "dataset1",
    pubname: "USGS",
    kw: ["water", "hydrology"],
    placenames: ["Colorado", "Utah"],
    resourceType: "data"
  },
  {
    subj: "dataset2", 
    pubname: "NOAA",
    kw: ["climate", "temperature"],
    placenames: ["California"],
    resourceType: "data"
  },
  // ... more test data
];
```

### 2. Edge Case Scenarios
- Items with missing facet fields
- Items with empty arrays
- Items with single vs. multiple values
- Large datasets (1000+ items)

### 3. Filter Combinations to Test
1. **Single Filter**: Publisher = "USGS" → verify all other facet counts
2. **Two Filters**: Publisher = "USGS" AND Keywords contains "water" → verify intersection counts
3. **Three+ Filters**: Complex combinations with range filters
4. **Filter Removal**: Remove middle filter from chain, verify count updates

## Success Criteria

### Correctness
- All facet counts must accurately reflect the intersection of active filters
- Counts must update correctly when filters are added/removed
- Edge cases must be handled gracefully

### Performance  
- Count calculations must complete within 100ms for 1000+ results
- Memory usage should remain stable during filter operations

### Maintainability
- Tests should be easy to understand and modify
- Test data should be representative of real-world scenarios
- Tests should provide clear failure messages

## Risk Mitigation

### Potential Issues
1. **Complex Filter Logic**: The current filtering logic is complex - tests will help identify edge cases
2. **Performance**: Large datasets may cause slow test execution
3. **State Management**: Vuex state synchronization issues may surface

### Mitigation Strategies
1. **Incremental Testing**: Start with simple scenarios and build complexity
2. **Performance Monitoring**: Include performance assertions in tests  
3. **State Validation**: Add explicit state consistency checks

## Expected Benefits

1. **Bug Prevention**: Catch counting errors before they reach production
2. **Refactoring Safety**: Enable safe improvements to filtering logic
3. **Documentation**: Tests serve as executable documentation of expected behavior
4. **Regression Prevention**: Prevent future changes from breaking existing functionality

## File Structure
```
client/src/
├── __tests__/
│   ├── components/
│   │   ├── Search.test.js
│   │   ├── Facets.test.js
│   │   └── FacetText.test.js
│   ├── store/
│   │   └── state.test.js
│   ├── integration/
│   │   └── multi-facet.test.js
│   └── fixtures/
│       ├── mockDatasets.js
│       └── testHelpers.js
├── jest.config.js
└── package.json (updated with test scripts)
```

This comprehensive testing plan ensures thorough validation of the multi-facet counting logic, with particular focus on accuracy when multiple filters are applied simultaneously.