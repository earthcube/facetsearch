/**
 * Basic setup test to verify Jest configuration is working
 */
import { createMockStore, createMockSearchComponent } from './testHelpers';
import { basicMultiFacetDataset, mockFacetsConfig } from './mockDatasets';

describe('Test Setup Verification', () => {
  test('should load mock data correctly', () => {
    expect(basicMultiFacetDataset).toBeDefined();
    expect(basicMultiFacetDataset.length).toBe(5);
    expect(basicMultiFacetDataset[0].subj).toBe('dataset1');
  });

  test('should load facet configuration correctly', () => {
    expect(mockFacetsConfig).toBeDefined();
    expect(mockFacetsConfig.length).toBe(5);
    expect(mockFacetsConfig[0].field).toBe('pubname');
  });

  test('should create mock store correctly', () => {
    const store = createMockStore({
      results: basicMultiFacetDataset
    });
    
    expect(store.state.results).toEqual(basicMultiFacetDataset);
    expect(typeof store.commit).toBe('function');
    expect(typeof store.dispatch).toBe('function');
  });

  test('should create mock search component correctly', () => {
    const component = createMockSearchComponent(
      basicMultiFacetDataset,
      mockFacetsConfig,
      {}
    );

    expect(component.items).toEqual(basicMultiFacetDataset);
    expect(component.facets).toEqual(mockFacetsConfig);
    expect(typeof component.filter).toBe('function');
    expect(typeof component.toggleFilter).toBe('function');
  });

  test('should initialize facet store structure', () => {
    const component = createMockSearchComponent(
      basicMultiFacetDataset,
      mockFacetsConfig,
      {}
    );

    expect(component.facetStore).toBeDefined();
    expect(component.facetStore.pubname).toBeDefined();
    expect(component.facetStore.pubname['USGS']).toBeDefined();
    // Count will be calculated during initialization, so should be > 0
    expect(component.facetStore.pubname['USGS'].count).toBe(2);
    expect(component.facetStore.pubname['USGS'].isActive).toBe(false);
  });
});

describe('Underscore.js Integration', () => {
  test('should have underscore.js available', () => {
    const _ = require('underscore');
    expect(typeof _.each).toBe('function');
    expect(typeof _.select).toBe('function');
    expect(typeof _.isArray).toBe('function');
  });
});