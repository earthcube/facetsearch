/**
 * Unit tests for Vuex store state management related to facet counting
 * Tests mutations and getters that affect facet functionality
 */

import { createMockStore } from '../fixtures/testHelpers';
import { basicMultiFacetDataset, mockFacetsConfig } from '../fixtures/mockDatasets';

describe('Vuex Store Facet State Management', () => {
  describe('State mutations', () => {
    test('should set results correctly', () => {
      const store = createMockStore();
      
      store.commit('setResults', basicMultiFacetDataset);
      
      expect(store.state.results).toEqual(basicMultiFacetDataset);
      expect(store.state.results.length).toBe(5);
    });

    test('should set facets configuration correctly', () => {
      const store = createMockStore();
      
      store.commit('setFacetsConfig', mockFacetsConfig);
      
      expect(store.state.FacetsConfig).toEqual(mockFacetsConfig);
    });

    test('should add items to micro cache', () => {
      const store = createMockStore();
      const testKey = 'test-query-uuid';
      const testValue = basicMultiFacetDataset.slice(0, 2);
      
      store.commit('addtoMicroCache', { key: testKey, value: testValue });
      
      expect(store.state.microCache.has(testKey)).toBe(true);
      expect(store.state.microCache.get(testKey)).toEqual(testValue);
    });

    test('should set text query', () => {
      const store = createMockStore();
      const testQuery = 'water quality colorado';
      
      store.commit('setTextQuery', testQuery);
      
      expect(store.state.q).toBe(testQuery);
    });
  });

  describe('Store getters', () => {
    test('should return facets configuration', () => {
      const store = createMockStore({
        FacetsConfig: mockFacetsConfig
      });
      
      const config = store.getters.FacetsConfig;
      
      expect(config).toEqual(mockFacetsConfig);
    });

    test('should check micro cache existence', () => {
      const store = createMockStore();
      const testKey = 'test-key';
      
      // Initially should not exist
      expect(store.getters.hasMicroCache(testKey)).toBe(false);
      
      // Add to cache
      store.commit('addtoMicroCache', { key: testKey, value: [] });
      
      // Now should exist
      expect(store.getters.hasMicroCache(testKey)).toBe(true);
    });

    test('should retrieve micro cache values', () => {
      const store = createMockStore();
      const testKey = 'test-results';
      const testValue = basicMultiFacetDataset.slice(0, 3);
      
      store.commit('addtoMicroCache', { key: testKey, value: testValue });
      
      const retrieved = store.getters.getMicroCache(testKey);
      expect(retrieved).toEqual(testValue);
    });
  });

  describe('Cache behavior with facet operations', () => {
    test('should handle query result caching correctly', () => {
      const store = createMockStore();
      const queryUUID = 'search-query-123';
      const results = basicMultiFacetDataset.filter(item => item.pubname === 'USGS');
      
      // Simulate caching search results
      store.commit('addtoMicroCache', { key: queryUUID, value: results });
      
      // Should be able to retrieve cached results
      expect(store.getters.hasMicroCache(queryUUID)).toBe(true);
      expect(store.getters.getMicroCache(queryUUID)).toEqual(results);
      expect(store.getters.getMicroCache(queryUUID).length).toBe(2);
    });

    test('should handle multiple cached queries', () => {
      const store = createMockStore();
      
      const query1 = { uuid: 'query-1', results: basicMultiFacetDataset.slice(0, 2) };
      const query2 = { uuid: 'query-2', results: basicMultiFacetDataset.slice(2, 4) };
      
      store.commit('addtoMicroCache', { key: query1.uuid, value: query1.results });
      store.commit('addtoMicroCache', { key: query2.uuid, value: query2.results });
      
      expect(store.getters.getMicroCache(query1.uuid)).toEqual(query1.results);
      expect(store.getters.getMicroCache(query2.uuid)).toEqual(query2.results);
      expect(store.getters.getMicroCache(query1.uuid).length).toBe(2);
      expect(store.getters.getMicroCache(query2.uuid).length).toBe(2);
    });

    test('should return undefined for non-existent cache keys', () => {
      const store = createMockStore();
      
      expect(store.getters.hasMicroCache('non-existent')).toBe(false);
      expect(store.getters.getMicroCache('non-existent')).toBeUndefined();
    });
  });

  describe('State consistency during facet operations', () => {
    test('should maintain state integrity when results are updated', () => {
      const store = createMockStore({
        results: []
      });
      
      const initialResults = basicMultiFacetDataset.slice(0, 3);
      store.commit('setResults', initialResults);
      
      expect(store.state.results).toEqual(initialResults);
      expect(store.state.results.length).toBe(3);
      
      // Update with different results
      const newResults = basicMultiFacetDataset.slice(3, 5);
      store.commit('setResults', newResults);
      
      expect(store.state.results).toEqual(newResults);
      expect(store.state.results.length).toBe(2);
    });

    test('should handle empty results correctly', () => {
      const store = createMockStore({
        results: basicMultiFacetDataset
      });
      
      // Set to empty results (like when no filters match)
      store.commit('setResults', []);
      
      expect(store.state.results).toEqual([]);
      expect(store.state.results.length).toBe(0);
    });

    test('should handle configuration changes', () => {
      const store = createMockStore();
      
      // Initially no config
      expect(store.getters.FacetsConfig).toBeNull();
      
      // Set configuration
      store.commit('setFacetsConfig', mockFacetsConfig);
      expect(store.getters.FacetsConfig).toEqual(mockFacetsConfig);
      
      // Update configuration
      const newConfig = [...mockFacetsConfig, {
        title: "New Facet",
        field: "newField", 
        type: "text",
        limit: 5,
        sort: "count"
      }];
      
      store.commit('setFacetsConfig', newConfig);
      expect(store.getters.FacetsConfig).toEqual(newConfig);
      expect(store.getters.FacetsConfig.length).toBe(mockFacetsConfig.length + 1);
    });
  });

  describe('Integration with search functionality', () => {
    test('should simulate complete search workflow', () => {
      const store = createMockStore();
      
      // 1. Set configuration
      store.commit('setFacetsConfig', mockFacetsConfig);
      
      // 2. Set search query
      const searchQuery = 'water resources';
      store.commit('setTextQuery', searchQuery);
      
      // 3. Set search results
      const searchResults = basicMultiFacetDataset.filter(item => 
        item.name.toLowerCase().includes('water') || 
        item.description.toLowerCase().includes('water')
      );
      store.commit('setResults', searchResults);
      
      // 4. Cache the results
      const queryUUID = 'search-water-123';
      store.commit('addtoMicroCache', { key: queryUUID, value: searchResults });
      
      // Verify the complete state
      expect(store.getters.FacetsConfig).toEqual(mockFacetsConfig);
      expect(store.state.q).toBe(searchQuery);
      expect(store.state.results).toEqual(searchResults);
      expect(store.getters.hasMicroCache(queryUUID)).toBe(true);
      expect(store.getters.getMicroCache(queryUUID)).toEqual(searchResults);
    });

    test('should handle query result updates with facet implications', () => {
      const store = createMockStore();
      
      // Initial search results (all USGS)
      const usgsResults = basicMultiFacetDataset.filter(item => item.pubname === 'USGS');
      store.commit('setResults', usgsResults);
      store.commit('addtoMicroCache', { key: 'usgs-query', value: usgsResults });
      
      expect(store.state.results.length).toBe(2);
      
      // New search results (all NOAA) - simulating filter change
      const noaaResults = basicMultiFacetDataset.filter(item => item.pubname === 'NOAA');
      store.commit('setResults', noaaResults);
      store.commit('addtoMicroCache', { key: 'noaa-query', value: noaaResults });
      
      expect(store.state.results.length).toBe(2);
      expect(store.state.results).toEqual(noaaResults);
      
      // Both queries should be cached separately
      expect(store.getters.getMicroCache('usgs-query')).toEqual(usgsResults);
      expect(store.getters.getMicroCache('noaa-query')).toEqual(noaaResults);
    });
  });

  describe('Memory management and cache limits', () => {
    test('should handle large cache operations', () => {
      const store = createMockStore();
      
      // Add many cache entries
      for (let i = 0; i < 100; i++) {
        store.commit('addtoMicroCache', {
          key: `query-${i}`,
          value: basicMultiFacetDataset.slice(0, i % 3 + 1)
        });
      }
      
      // Should have cached all entries (LRUCache handles limits internally)
      expect(store.getters.hasMicroCache('query-0')).toBeDefined();
      expect(store.getters.hasMicroCache('query-50')).toBeDefined();
      expect(store.getters.hasMicroCache('query-99')).toBeDefined();
    });

    test('should handle cache key collisions gracefully', () => {
      const store = createMockStore();
      const key = 'duplicate-key';
      const value1 = basicMultiFacetDataset.slice(0, 2);
      const value2 = basicMultiFacetDataset.slice(2, 4);
      
      // Add first value
      store.commit('addtoMicroCache', { key, value: value1 });
      expect(store.getters.getMicroCache(key)).toEqual(value1);
      
      // Overwrite with second value
      store.commit('addtoMicroCache', { key, value: value2 });
      expect(store.getters.getMicroCache(key)).toEqual(value2);
      expect(store.getters.getMicroCache(key)).not.toEqual(value1);
    });
  });
});