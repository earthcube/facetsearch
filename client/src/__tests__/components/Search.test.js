/**
 * Unit tests for Search.vue component facet counting logic
 * Tests the core methods: resetFacetCount, filter, and count calculation
 */

import { 
  basicMultiFacetDataset, 
  edgeCaseDataset, 
  mockFacetsConfig, 
  expectedCounts 
} from '../fixtures/mockDatasets';
import { 
  createMockSearchComponent, 
  assertFacetCounts 
} from '../fixtures/testHelpers';
const _ = require('underscore');

describe('Search.vue Facet Count Logic', () => {
  describe('resetFacetCount method', () => {
    test('should reset all facet counts to zero', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Set some initial counts
      component.facetStore.pubname.USGS.count = 5;
      component.facetStore.kw.water.count = 3;
      component.facetStore.placenames.Colorado.count = 2;

      // Reset counts
      component.resetFacetCount();

      // Verify all counts are reset to 0
      expect(component.facetStore.pubname.USGS.count).toBe(0);
      expect(component.facetStore.kw.water.count).toBe(0);
      expect(component.facetStore.placenames.Colorado.count).toBe(0);
    });

    test('should reset all facet isActive flags to false', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Set some initial active states
      component.facetStore.pubname.USGS.isActive = true;
      component.facetStore.kw.water.isActive = true;

      // Reset counts (which also resets isActive)
      component.resetFacetCount();

      // Verify all isActive flags are reset to false
      expect(component.facetStore.pubname.USGS.isActive).toBe(false);
      expect(component.facetStore.kw.water.isActive).toBe(false);
    });

    test('should handle empty facet store gracefully', () => {
      const component = createMockSearchComponent([], [], {});
      
      // Should not throw error with empty facet store
      expect(() => {
        component.resetFacetCount();
      }).not.toThrow();
    });
  });

  describe('filter method - count calculations', () => {
    test('should calculate correct counts with no filters applied', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {} // No filters
      );

      component.filter();

      // Verify counts match expected values for no filters
      assertFacetCounts(component.facetStore, expectedCounts.noFilters, false);
    });

    test('should calculate correct counts with single filter applied', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['USGS'] }
      );

      component.filter();

      // Should have 2 USGS datasets
      expect(component.facetStore.pubname.USGS.count).toBe(2);
      expect(component.currentResults.length).toBe(2);

      // Other publishers should show "+" when filters are active
      expect(component.facetStore.pubname.NOAA.count).toBe('+');
      expect(component.facetStore.pubname.NASA.count).toBe('+');

      // Keywords should reflect only what's in USGS datasets
      expect(component.facetStore.kw.water.count).toBe(1);
      expect(component.facetStore.kw.hydrology.count).toBe(1);
      expect(component.facetStore.kw.geology.count).toBe(1);
    });

    test('should calculate correct counts with multiple filters applied', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { 
          pubname: ['USGS'], 
          kw: ['water'] 
        }
      );

      component.filter();

      // Should have 1 dataset matching both USGS and water
      expect(component.currentResults.length).toBe(1);
      expect(component.facetStore.pubname.USGS.count).toBe(1);
      expect(component.facetStore.kw.water.count).toBe(1);

      // Other values should show "+"
      expect(component.facetStore.pubname.NOAA.count).toBe('+');
      expect(component.facetStore.kw.climate.count).toBe('+');
    });

    test('should handle array-based facet values correctly', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      component.filter();

      // Keywords are arrays - should count each occurrence
      expect(component.facetStore.kw.water.count).toBe(2); // In datasets 1 and 5
      expect(component.facetStore.kw.climate.count).toBe(2); // In datasets 2 and 4
    });

    test('should show "+" for zero counts when filters are active', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['NASA'] } // Only NASA datasets
      );

      component.filter();

      // NASA should have actual count
      expect(component.facetStore.pubname.NASA.count).toBe(1);

      // Others should show "+" because filters are active
      expect(component.facetStore.pubname.USGS.count).toBe('+');
      expect(component.facetStore.pubname.NOAA.count).toBe('+');

      // Keywords not in NASA datasets should show "+"
      expect(component.facetStore.kw.water.count).toBe('+');
      expect(component.facetStore.kw.geology.count).toBe('+');
    });
  });

  describe('Edge cases and array handling', () => {
    test('should handle datasets with empty keyword arrays', () => {
      const component = createMockSearchComponent(
        edgeCaseDataset,
        mockFacetsConfig,
        {}
      );

      component.filter();

      // Should not crash and should handle empty arrays gracefully
      expect(component.currentResults.length).toBe(3); // All datasets should be included
      
      // Empty keyword array should not contribute to counts
      expect(component.facetStore.kw.hasOwnProperty('undefined')).toBe(false);
      expect(component.facetStore.kw.hasOwnProperty('')).toBe(false);
    });

    test('should handle datasets with undefined facet fields', () => {
      const component = createMockSearchComponent(
        edgeCaseDataset,
        mockFacetsConfig,
        { kw: ['single_keyword'] } // Apply a filter to test undefined field handling
      );

      component.filter();

      // Should only include dataset with the matching keyword, filtering out those with missing kw field
      expect(component.currentResults.length).toBe(1);
      expect(component.currentResults[0].subj).toBe('dataset_single_values');
    });

    test('should handle single string values vs arrays consistently', () => {
      const component = createMockSearchComponent(
        edgeCaseDataset,
        mockFacetsConfig,
        {}
      );

      component.filter();

      // Single string values should be counted same as single-item arrays
      expect(component.facetStore.kw.single_keyword.count).toBe(1);
      expect(component.facetStore.placenames['Single Location'].count).toBe(1);
    });

    test('should handle filters with non-existent facet values', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['NonExistentPublisher'] }
      );

      component.filter();

      // Should result in no matches
      expect(component.currentResults.length).toBe(0);

      // All facet counts should be 0, but show "+" because filters are active
      expect(component.facetStore.pubname.USGS.count).toBe('+');
      expect(component.facetStore.pubname.NOAA.count).toBe('+');
    });

    test('should handle empty filter arrays', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: [] } // Empty filter array
      );

      component.filter();

      // Empty filter array should be treated as no filter
      expect(component.currentResults.length).toBe(basicMultiFacetDataset.length);
      assertFacetCounts(component.facetStore, expectedCounts.noFilters, false);
    });
  });

  describe('Performance and large datasets', () => {
    test('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        subj: `dataset_${i}`,
        pubname: `Publisher_${i % 10}`,
        kw: [`keyword_${i % 50}`, `keyword_${(i + 1) % 50}`],
        placenames: [`Location_${i % 20}`],
        resourceType: 'data',
        name: `Dataset ${i}`,
        description: `Description ${i}`,
        g: `urn:gleaner:milled:test:${i}`
      }));

      const component = createMockSearchComponent(
        largeDataset,
        mockFacetsConfig,
        { pubname: ['Publisher_0'] }
      );

      const startTime = Date.now();
      component.filter();
      const endTime = Date.now();

      // Should complete within reasonable time (100ms)
      expect(endTime - startTime).toBeLessThan(100);

      // Should have correct count (every 10th dataset has Publisher_0)
      expect(component.currentResults.length).toBe(100);
      expect(component.facetStore.pubname.Publisher_0.count).toBe(100);
    });
  });

  describe('Filter state consistency', () => {
    test('should maintain filter state after count calculations', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['USGS'], kw: ['water'] }
      );

      const originalFilters = JSON.parse(JSON.stringify(component.filters));
      component.filter();

      // Filters should remain unchanged after filtering
      expect(component.filters).toEqual(originalFilters);
    });

    test('should update currentResults to match applied filters', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['NOAA'] }
      );

      component.filter();

      // All current results should match the filter
      component.currentResults.forEach(item => {
        expect(item.pubname).toBe('NOAA');
      });

      expect(component.currentResults.length).toBe(2); // 2 NOAA datasets
    });

    test('should recalculate counts when filters change', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['USGS'] }
      );

      component.filter();
      const initialCount = component.facetStore.pubname.USGS.count;

      // Add another filter
      component.filters.kw = ['water'];
      component.filter();

      // Count should be recalculated and potentially different
      expect(component.facetStore.pubname.USGS.count).toBeLessThanOrEqual(initialCount);
    });
  });

  describe('Complex multi-facet scenarios', () => {
    test('should handle intersection of multiple facet types correctly', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { 
          pubname: ['USGS', 'NOAA'], 
          placenames: ['Colorado'] 
        }
      );

      component.filter();

      // Should only include datasets that match ANY publisher AND Colorado
      component.currentResults.forEach(item => {
        expect(['USGS', 'NOAA']).toContain(item.pubname);
        expect(item.placenames).toContain('Colorado');
      });

      expect(component.currentResults.length).toBe(2); // dataset1 (USGS+Colorado) and dataset3 (USGS+Colorado)
    });

    test('should calculate counts correctly for remaining facets after multiple filters', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { 
          pubname: ['USGS'], 
          placenames: ['Colorado'] 
        }
      );

      component.filter();

      // Keywords should only reflect what's available in the filtered results
      // Only dataset1 matches (USGS + Colorado), it has water, hydrology, rivers
      // dataset3 matches too (USGS + Colorado), it has geology, minerals
      expect(component.facetStore.kw.water.count).toBe(1); // from dataset1
      expect(component.facetStore.kw.hydrology.count).toBe(1); // from dataset1
      expect(component.facetStore.kw.rivers.count).toBe(1); // from dataset1
      expect(component.facetStore.kw.geology.count).toBe(1); // from dataset3
      expect(component.facetStore.kw.minerals.count).toBe(1); // from dataset3

      // Keywords not in Colorado+USGS datasets should show "+"
      expect(component.facetStore.kw.climate.count).toBe('+');
      expect(component.facetStore.kw.oceanography.count).toBe('+');
    });
  });
});