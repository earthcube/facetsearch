import { createStore } from 'vuex';
import _ from 'underscore';

/**
 * Creates a mock Vuex store with facet search functionality for testing
 */
export function createMockStore(initialState = {}) {
  const defaultState = {
    results: [],
    searchExactMatch: false,
    microCache: new Map(),
    FacetsConfig: null,
    esTemplateOptions: { interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g },
    q: '',
    rt: 'all',
    ...initialState
  };

  return createStore({
    state: defaultState,
    mutations: {
      setResults(state, results) {
        state.results = results;
      },
      setFacetsConfig(state, config) {
        state.FacetsConfig = config;
      },
      addtoMicroCache(state, { key, value }) {
        state.microCache.set(key, value);
      },
      setTextQuery(state, query) {
        state.q = query;
      }
    },
    getters: {
      FacetsConfig: (state) => state.FacetsConfig,
      hasMicroCache: (state) => (key) => state.microCache.has(key),
      getMicroCache: (state) => (key) => state.microCache.get(key)
    },
    actions: {
      async getResults({ commit }, queryObject) {
        // Mock implementation for testing
        const mockResults = queryObject.mockResults || [];
        commit('setResults', mockResults);
      }
    }
  });
}

/**
 * Creates a simple mock wrapper for component testing without Vue Test Utils
 */
export function createSearchWrapper(options = {}) {
  const {
    store = createMockStore(),
    facets = [],
    items = [],
  } = options;

  return {
    store,
    facets,
    items,
    // Add any other mock properties needed for testing
  };
}

/**
 * Initializes facet store structure based on items and facet configuration
 */
export function initializeFacetStore(items, facets) {
  const facetStore = {};
  
  facets.forEach(facet => {
    facetStore[facet.field] = {};
    
    items.forEach(item => {
      const val = item[facet.field];
      if (_.isArray(val)) {
        val.forEach(facetitem => {
          if (!_.isEmpty(facetitem) && !facetStore[facet.field][facetitem]) {
            facetStore[facet.field][facetitem] = {
              count: 0,
              isActive: false,
              value: facetitem
            };
          }
        });
      } else if (val !== undefined && !_.isEmpty(val)) {
        if (!facetStore[facet.field][val]) {
          facetStore[facet.field][val] = {
            count: 0,
            isActive: false,
            value: val
          };
        }
      }
    });
  });

  return facetStore;
}

/**
 * Simulates the filter application logic from Search.vue
 */
export function applyFilters(items, filters) {
  return _.select(items, function (item) {
    let filtersApply = true;
    
    _.each(filters, function (filter, facet) {
      const thisFacet = item[facet];
      
      // Skip items that don't have the required facet field
      if (thisFacet === undefined || thisFacet === null) {
        filtersApply = false;
        return false; // Skip to next item
      }

      // Handle array-based filters (OR logic within facet)
      if (_.isArray(filter) && filter.length > 0) {
        let matchFound = false;
        filter.forEach(filterValue => {
          if (_.isArray(thisFacet)) {
            if (thisFacet.includes(filterValue)) {
              matchFound = true;
            }
          } else if (thisFacet === filterValue) {
            matchFound = true;
          }
        });
        if (!matchFound) {
          filtersApply = false;
          return false; // Skip to next item
        }
      }
    });

    return filtersApply;
  });
}

/**
 * Calculates expected facet counts for filtered results
 */
export function calculateFacetCounts(filteredResults, facets) {
  const counts = {};
  
  facets.forEach(facet => {
    counts[facet.field] = {};
    
    filteredResults.forEach(item => {
      const val = item[facet.field];
      if (_.isArray(val)) {
        val.forEach(facetitem => {
          if (!_.isEmpty(facetitem)) {
            counts[facet.field][facetitem] = (counts[facet.field][facetitem] || 0) + 1;
          }
        });
      } else if (val !== undefined && !_.isEmpty(val)) {
        counts[facet.field][val] = (counts[facet.field][val] || 0) + 1;
      }
    });
  });

  return counts;
}

/**
 * Asserts that facet store counts match expected counts
 */
export function assertFacetCounts(facetStore, expectedCounts, hasActiveFilters = false) {
  Object.keys(expectedCounts).forEach(facetField => {
    Object.keys(expectedCounts[facetField]).forEach(facetValue => {
      const expected = expectedCounts[facetField][facetValue];
      const actual = facetStore[facetField][facetValue]?.count;
      
      if (expected === 0 && hasActiveFilters) {
        // Should show "+" when count is 0 but filters are active
        expect(actual).toBe('+');
      } else {
        expect(actual).toBe(expected);
      }
    });
  });
}

/**
 * Creates a mock component instance with the Search.vue methods for testing
 */
export function createMockSearchComponent(items = [], facets = [], filters = {}) {
  const facetStore = initializeFacetStore(items, facets);
  
  const component = {
    items,
    facets,
    filters,
    facetStore,
    currentResults: [],
    
    // Mock the resetFacetCount method
    resetFacetCount() {
      _.each(this.facetStore, function (items, facetname) {
        _.each(items, function (value, itemname) {
          this.facetStore[facetname][itemname].count = 0;
          this.facetStore[facetname][itemname].isActive = false;
        }, this);
      }, this);
    },

    // Mock the filter method (simplified version)
    filter() {
      // Apply filters to get current results
      this.currentResults = applyFilters(this.items, this.filters);
      
      // Reset counts
      this.resetFacetCount();
      
      // Recalculate counts based on filtered results
      _.each(this.facets, function (facet) {
        _.each(this.currentResults, function (item) {
          const val = item[facet.field];
          if (_.isArray(val)) {
            val.forEach((facetitem) => {
              if (!_.isEmpty(facetitem) && this.facetStore[facet.field][facetitem]) {
                this.facetStore[facet.field][facetitem].count += 1;
              }
            });
          } else if (val !== undefined && !_.isEmpty(val) && this.facetStore[facet.field][val]) {
            this.facetStore[facet.field][val].count += 1;
          }
        }, this);
      }, this);

      // Add "+" for zero counts when filters are active
      const hasActiveFilters = Object.keys(this.filters).some(key => this.filters[key] && this.filters[key].length > 0);
      if (hasActiveFilters) {
        // Apply "+" to ALL facet values that have count 0 when ANY filters are active
        _.each(this.facetStore, function (facetItems, facetField) {
          _.each(facetItems, function (facet) {
            if (facet.count === 0) {
              facet.count = "+";
            }
          }, this);
        }, this);
      }
    },

    // Mock the toggleFilter method
    toggleFilter(key, value) {
      if (!this.filters[key]) {
        this.filters[key] = [];
      }
      
      const index = this.filters[key].indexOf(value);
      if (index > -1) {
        this.filters[key].splice(index, 1);
      } else {
        this.filters[key].push(value);
      }
      
      // Re-filter after toggle
      this.filter();
    }
  };

  // Initialize the component by running filter if there are initial filters
  component.filter();
  
  return component;
}

/**
 * Utility to wait for Vue reactivity updates
 */
export async function waitForUpdate() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

export default {
  createMockStore,
  createSearchWrapper,
  initializeFacetStore,
  applyFilters,
  calculateFacetCounts,
  assertFacetCounts,
  createMockSearchComponent,
  waitForUpdate
};