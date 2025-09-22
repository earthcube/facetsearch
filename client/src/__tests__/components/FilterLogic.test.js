/**
 * Unit tests for filter toggle logic and multi-facet interactions
 * Tests the toggleFilter method and complex filtering scenarios
 */

import { 
  basicMultiFacetDataset, 
  mockFacetsConfig,
  rangeFilterDataset
} from '../fixtures/mockDatasets';
import { createMockSearchComponent } from '../fixtures/testHelpers';

describe('Filter Logic and Toggle Behavior', () => {
  describe('toggleFilter method', () => {
    test('should add filter value when not present', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Initially no filters
      expect(component.filters.pubname).toBeUndefined();

      // Toggle filter on
      component.toggleFilter('pubname', 'USGS');

      expect(component.filters.pubname).toEqual(['USGS']);
      expect(component.currentResults.length).toBe(2); // 2 USGS datasets
    });

    test('should remove filter value when already present', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['USGS'] }
      );

      // Initially has USGS filter
      expect(component.filters.pubname).toEqual(['USGS']);
      expect(component.currentResults.length).toBe(2);

      // Toggle filter off
      component.toggleFilter('pubname', 'USGS');

      expect(component.filters.pubname).toEqual([]);
      expect(component.currentResults.length).toBe(basicMultiFacetDataset.length); // All datasets
    });

    test('should handle multiple values in same facet', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['USGS'] }
      );

      // Add second publisher
      component.toggleFilter('pubname', 'NOAA');

      expect(component.filters.pubname).toEqual(['USGS', 'NOAA']);
      expect(component.currentResults.length).toBe(4); // 2 USGS + 2 NOAA datasets

      // All results should be from either publisher
      component.currentResults.forEach(item => {
        expect(['USGS', 'NOAA']).toContain(item.pubname);
      });
    });

    test('should recalculate all facet counts after toggle', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Get initial counts
      const initialUSGSCount = component.facetStore.pubname.USGS.count;
      
      // Apply filter
      component.toggleFilter('pubname', 'NASA');

      // USGS count should show "+" now (since NASA filter is active)
      expect(component.facetStore.pubname.USGS.count).toBe('+');
      expect(component.facetStore.pubname.NASA.count).toBe(1);
    });

    test('should handle toggling filters in different facets', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Apply publisher filter
      component.toggleFilter('pubname', 'USGS');
      expect(component.currentResults.length).toBe(2);

      // Apply keyword filter
      component.toggleFilter('kw', 'water');
      expect(component.currentResults.length).toBe(1); // Only dataset1 has both USGS and water

      // Apply location filter
      component.toggleFilter('placenames', 'Colorado');
      expect(component.currentResults.length).toBe(1); // dataset1 also has Colorado

      // Remove keyword filter
      component.toggleFilter('kw', 'water');
      expect(component.currentResults.length).toBe(2); // Back to USGS datasets in Colorado
    });
  });

  describe('Multi-facet filter combinations', () => {
    test('should handle AND logic within same facet (OR) and between facets (AND)', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Add multiple publishers (OR logic within facet)
      component.toggleFilter('pubname', 'USGS');
      component.toggleFilter('pubname', 'NOAA');
      expect(component.currentResults.length).toBe(4); // 2 USGS + 2 NOAA

      // Add keyword filter (AND logic between facets)
      component.toggleFilter('kw', 'water');
      expect(component.currentResults.length).toBe(2); // Only datasets with water from USGS or NOAA

      // Verify results match criteria
      component.currentResults.forEach(item => {
        expect(['USGS', 'NOAA']).toContain(item.pubname);
        expect(item.kw).toContain('water');
      });
    });

    test('should progressively narrow results as more filters are applied', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      const initialCount = component.currentResults.length;

      // Apply first filter
      component.toggleFilter('pubname', 'USGS');
      const afterPublisher = component.currentResults.length;
      expect(afterPublisher).toBeLessThanOrEqual(initialCount);

      // Apply second filter
      component.toggleFilter('kw', 'water');
      const afterKeyword = component.currentResults.length;
      expect(afterKeyword).toBeLessThanOrEqual(afterPublisher);

      // Apply third filter
      component.toggleFilter('placenames', 'Colorado');
      const afterLocation = component.currentResults.length;
      expect(afterLocation).toBeLessThanOrEqual(afterKeyword);
    });

    test('should expand results when filters are removed', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { 
          pubname: ['USGS'], 
          kw: ['water'], 
          placenames: ['Colorado'] 
        }
      );

      const initialCount = component.currentResults.length;

      // Remove location filter
      component.toggleFilter('placenames', 'Colorado');
      const afterRemovingLocation = component.currentResults.length;
      expect(afterRemovingLocation).toBeGreaterThanOrEqual(initialCount);

      // Remove keyword filter
      component.toggleFilter('kw', 'water');
      const afterRemovingKeyword = component.currentResults.length;
      expect(afterRemovingKeyword).toBeGreaterThanOrEqual(afterRemovingLocation);

      // Remove publisher filter
      component.toggleFilter('pubname', 'USGS');
      const finalCount = component.currentResults.length;
      expect(finalCount).toBe(basicMultiFacetDataset.length); // All datasets
    });
  });

  describe('Count accuracy in complex scenarios', () => {
    test('should show accurate counts for each facet value after multiple filters', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['USGS', 'NOAA'] } // Multiple publishers
      );

      // Get current results (should be 4: 2 USGS + 2 NOAA)
      expect(component.currentResults.length).toBe(4);

      // Check keyword counts reflect only what's in USGS+NOAA datasets
      const waterCount = component.facetStore.kw.water.count;
      const climateCount = component.facetStore.kw.climate.count;
      const oceanographyCount = component.facetStore.kw.oceanography.count;

      expect(waterCount).toBe(2); // dataset1 and dataset5
      expect(climateCount).toBe(1); // dataset2 only (dataset4 is NASA)
      expect(oceanographyCount).toBe(1); // dataset5

      // Keywords not in USGS/NOAA datasets should show "+"
      expect(component.facetStore.kw.satellite.count).toBe('+');
      expect(component.facetStore.kw['remote sensing'].count).toBe('+');
    });

    test('should handle zero results scenario correctly', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { 
          pubname: ['USGS'], 
          kw: ['satellite'] // USGS datasets don't have satellite keyword
        }
      );

      expect(component.currentResults.length).toBe(0);

      // All facet counts should be 0 but show "+" because filters are active
      Object.keys(component.facetStore.pubname).forEach(publisher => {
        expect(component.facetStore.pubname[publisher].count).toBe('+');
      });

      Object.keys(component.facetStore.kw).forEach(keyword => {
        expect(component.facetStore.kw[keyword].count).toBe('+');
      });
    });

    test('should update counts immediately when filters change', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Get baseline counts
      const baselineWaterCount = component.facetStore.kw.water.count;

      // Apply filter that should change water count
      component.toggleFilter('pubname', 'NASA'); // NASA datasets don't have water

      // Water count should now be 0 (shown as "+")
      expect(component.facetStore.kw.water.count).toBe('+');

      // Remove NASA filter
      component.toggleFilter('pubname', 'NASA');

      // Water count should return to baseline
      expect(component.facetStore.kw.water.count).toBe(baselineWaterCount);
    });
  });

  describe('Filter persistence and state management', () => {
    test('should maintain filter state across multiple operations', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Build up complex filter state
      component.toggleFilter('pubname', 'USGS');
      component.toggleFilter('pubname', 'NOAA');
      component.toggleFilter('kw', 'water');
      component.toggleFilter('placenames', 'Colorado');

      const expectedFilters = {
        pubname: ['USGS', 'NOAA'],
        kw: ['water'],
        placenames: ['Colorado']
      };

      expect(component.filters).toEqual(expectedFilters);

      // State should remain consistent after filter operations
      component.filter(); // Manual re-filter
      expect(component.filters).toEqual(expectedFilters);
    });

    test('should handle filter initialization correctly', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        { pubname: ['USGS'] } // Pre-initialized filter
      );

      expect(component.filters.pubname).toEqual(['USGS']);
      expect(component.currentResults.length).toBe(2);

      // Should be able to add to existing filter
      component.toggleFilter('pubname', 'NOAA');
      expect(component.filters.pubname).toEqual(['USGS', 'NOAA']);
    });
  });

  describe('Array-based facet value interactions', () => {
    test('should handle filtering by array-based facet values', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Filter by keyword (which are arrays in datasets)
      component.toggleFilter('kw', 'hydrology');

      // Should find dataset1 which has hydrology in its keywords array
      expect(component.currentResults.length).toBe(1);
      expect(component.currentResults[0].subj).toBe('dataset1');
      expect(component.currentResults[0].kw).toContain('hydrology');
    });

    test('should handle multiple keyword filters correctly', () => {
      const component = createMockSearchComponent(
        basicMultiFacetDataset,
        mockFacetsConfig,
        {}
      );

      // Apply multiple keyword filters (OR logic within facet)
      component.toggleFilter('kw', 'water');
      component.toggleFilter('kw', 'climate');

      // Should find datasets that have either water OR climate
      const expectedDatasets = basicMultiFacetDataset.filter(item => 
        item.kw.includes('water') || item.kw.includes('climate')
      );

      expect(component.currentResults.length).toBe(expectedDatasets.length);
      
      component.currentResults.forEach(item => {
        const hasWater = item.kw.includes('water');
        const hasClimate = item.kw.includes('climate');
        expect(hasWater || hasClimate).toBe(true);
      });
    });
  });
});