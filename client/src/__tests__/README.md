# FacetSearch Test Suite

## Overview
This directory contains unit and integration tests for the FacetSearch application, with a specific focus on testing facet counting logic when multiple filters are applied.

## Directory Structure
```
__tests__/
├── README.md              # This file
├── setup.js              # Jest setup and global mocks
├── components/           # Component-specific tests
├── store/               # Vuex store tests
├── integration/         # Integration tests
└── fixtures/            # Test data and helpers
    ├── mockDatasets.js  # Mock data for testing
    ├── testHelpers.js   # Utility functions for tests
    └── *.test.js        # Test files
```

## Running Tests

### All Tests
```bash
yarn test
```

### Watch Mode (for development)
```bash
yarn test:watch
```

### Coverage Report
```bash
yarn test:coverage
```

### Specific Test Files
```bash
yarn test src/__tests__/fixtures/basic-setup.test.js
```

## Test Configuration

### Jest Configuration
- **Config File**: `jest.config.cjs`
- **Test Environment**: jsdom (for DOM APIs)
- **Test Pattern**: `**/__tests__/**/*.test.js` and `**/__tests__/**/*.spec.js`
- **Module Resolution**: Supports `@/` alias for `src/` directory

### Babel Configuration
- **Config File**: `babel.config.cjs`
- **Presets**: Vue CLI Babel preset with Node.js targeting for tests
- **Module Transformation**: CommonJS modules for Jest compatibility

## Mock Data

### Available Datasets
1. **basicMultiFacetDataset** - 5 datasets with various facet combinations
2. **edgeCaseDataset** - Datasets with missing/empty fields for edge case testing
3. **largeDataset** - 100 datasets for performance testing
4. **rangeFilterDataset** - Datasets with numeric ranges for range filter testing

### Facet Configuration
- **mockFacetsConfig** - Matches the structure expected by the application
- Includes text facets (Publisher, Keywords, Spatial Coverage) and range facets (Depth)

### Expected Count Scenarios
- **noFilters** - Expected counts when no filters are applied
- **usgsFilter** - Expected counts with single publisher filter
- **usgsAndWaterFilter** - Expected counts with multiple filters

## Test Helpers

### Key Functions
- `createMockStore()` - Creates Vuex store for testing
- `createMockSearchComponent()` - Creates mock Search component with core methods
- `initializeFacetStore()` - Initializes facet store structure
- `applyFilters()` - Simulates filter application logic
- `calculateFacetCounts()` - Calculates expected facet counts
- `assertFacetCounts()` - Assertion helper for count verification

## Writing Tests

### Basic Test Structure
```javascript
import { basicMultiFacetDataset, mockFacetsConfig } from '../fixtures/mockDatasets';
import { createMockSearchComponent } from '../fixtures/testHelpers';

describe('Facet Count Logic', () => {
  test('should count correctly with single filter', () => {
    const component = createMockSearchComponent(
      basicMultiFacetDataset,
      mockFacetsConfig,
      { pubname: ['USGS'] }
    );
    
    component.filter();
    
    expect(component.facetStore.pubname.USGS.count).toBe(2);
  });
});
```

### Testing Multi-Facet Scenarios
1. **Setup** - Create component with test data and initial filters
2. **Action** - Apply additional filters using `toggleFilter()`
3. **Verify** - Check that counts update correctly across all facets

### Edge Case Testing
- Test with empty arrays and undefined values
- Test with single string values vs arrays
- Test performance with large datasets

## Phase 1 Completion Status

✅ **Completed Tasks:**
1. Created test directory structure
2. Configured Jest with proper CommonJS/ESM compatibility
3. Set up Babel configuration for test environment
4. Created comprehensive mock datasets
5. Implemented test helper utilities
6. Added npm scripts for running tests
7. Verified basic test setup is working

## Next Phases

### Phase 2: Core Logic Tests
- Unit tests for `resetFacetCount()` method
- Unit tests for count calculation in `filter()` method
- Edge case validation tests

### Phase 3: Integration Tests
- Multi-facet filter interaction tests
- State management consistency tests
- Performance tests with large datasets

### Phase 4: CI Integration
- Coverage reporting
- Test performance monitoring
- Integration with existing development workflow

## Troubleshooting

### Common Issues
1. **Vue/Module Import Errors**: The project uses ES modules (`type: "module"` in package.json), so Jest config uses `.cjs` extension
2. **Transform Errors**: `transformIgnorePatterns` is configured to transform Vue and related modules
3. **Mock Issues**: Keep mocks simple and focused on the specific functionality being tested

### Test Environment
- Tests run in Node.js environment with jsdom for DOM APIs
- Vue components should be tested using simplified mock implementations
- Complex Vue component testing will require additional setup in future phases