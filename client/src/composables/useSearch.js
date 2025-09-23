import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { createSearchService } from '@/services/SearchService.js';

export function useSearch(config) {
  const searchService = createSearchService(config);
  const filterStateManager = searchService.getFilterStateManager();

  const state = filterStateManager.state;

  const isLoading = computed(() => state.isLoading);
  const results = computed(() => state.results);
  const error = computed(() => state.error);
  const textQuery = computed({
    get: () => state.textQuery,
    set: (value) => filterStateManager.setTextQuery(value)
  });
  const searchExactMatch = computed({
    get: () => state.searchExactMatch,
    set: (value) => filterStateManager.setSearchExactMatch(value)
  });
  const resourceType = computed({
    get: () => state.resourceType,
    set: (value) => filterStateManager.setResourceType(value)
  });
  const activeFilters = computed(() => state.activeFilters);
  const hasActiveFilters = computed(() => filterStateManager.hasActiveFilters.value);
  const activeFiltersDisplay = computed(() => filterStateManager.getActiveFiltersForDisplay());
  const filterCount = computed(() => filterStateManager.getFilterCount());

  const addFilter = (field, value) => {
    filterStateManager.addFilter(field, value);
  };

  const removeFilter = (field, value) => {
    filterStateManager.removeFilter(field, value);
  };

  const setFilter = (field, value) => {
    filterStateManager.setFilter(field, value);
  };

  const clearFilter = (field) => {
    filterStateManager.clearFilter(field);
  };

  const clearAllFilters = () => {
    filterStateManager.clearAllFilters();
  };

  const isFilterActive = (field, value) => {
    return filterStateManager.isFilterActive(field, value);
  };

  const executeSearch = async () => {
    await filterStateManager.executeQuery();
  };

  const updateFromUrl = (urlParams) => {
    filterStateManager.updateFromUrl(urlParams);
  };

  const getUrlParams = () => {
    return filterStateManager.getUrlParams();
  };

  const updateUrl = () => {
    const params = getUrlParams();
    const newUrl = `${window.location.pathname}${params ? '?' + params : ''}`;
    window.history.replaceState({}, '', newUrl);
  };

  watch(
    [textQuery, resourceType, searchExactMatch, activeFilters],
    () => {
      updateUrl();
    },
    { deep: true }
  );

  return {
    isLoading,
    results,
    error,
    textQuery,
    searchExactMatch,
    resourceType,
    activeFilters,
    hasActiveFilters,
    activeFiltersDisplay,
    filterCount,
    addFilter,
    removeFilter,
    setFilter,
    clearFilter,
    clearAllFilters,
    isFilterActive,
    executeSearch,
    updateFromUrl,
    getUrlParams,
    updateUrl,
    searchService,
    filterStateManager
  };
}

export function useFacetOptions(searchService, field) {
  const options = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const loadOptions = async (currentFilters = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const facetOptions = await searchService.getFacetOptions(field, currentFilters);
      options.value = facetOptions;
    } catch (err) {
      error.value = err.message;
      console.error(`Error loading options for ${field}:`, err);
    } finally {
      loading.value = false;
    }
  };

  return {
    options,
    loading,
    error,
    loadOptions
  };
}

export function useFacet(facetConfig, searchComposable) {
  const {
    activeFilters,
    addFilter,
    removeFilter,
    setFilter,
    clearFilter,
    isFilterActive,
    searchService
  } = searchComposable;

  const field = facetConfig.field;

  const activeValues = computed(() => {
    return activeFilters.value[field] || [];
  });

  const hasActiveValues = computed(() => {
    const values = activeValues.value;
    return Array.isArray(values) ? values.length > 0 : !!values;
  });

  const { options, loading: optionsLoading, loadOptions } = useFacetOptions(searchService, field);

  const toggleValue = (value) => {
    if (isFilterActive(field, value)) {
      removeFilter(field, value);
    } else {
      addFilter(field, value);
    }
  };

  const setValue = (value) => {
    setFilter(field, value);
  };

  const clearValues = () => {
    clearFilter(field);
  };

  const isValueActive = (value) => {
    return isFilterActive(field, value);
  };

  const loadOptionsForCurrentState = async () => {
    const currentFilters = { ...activeFilters.value };
    delete currentFilters[field];
    await loadOptions(currentFilters);
  };

  watch(
    () => {
      const otherFilters = { ...activeFilters.value };
      delete otherFilters[field];
      return otherFilters;
    },
    () => {
      loadOptionsForCurrentState();
    },
    { deep: true }
  );

  onMounted(() => {
    loadOptionsForCurrentState();
  });

  return {
    field,
    facetConfig,
    activeValues,
    hasActiveValues,
    options,
    optionsLoading,
    toggleValue,
    setValue,
    clearValues,
    isValueActive,
    loadOptions: loadOptionsForCurrentState
  };
}

export function useRangeFacet(facetConfig, searchComposable, minValue, maxValue) {
  const { activeFilters, setFilter, clearFilter } = searchComposable;
  const field = facetConfig.field;

  const activeRange = computed(() => {
    return activeFilters.value[field] || [minValue, maxValue];
  });

  const hasActiveRange = computed(() => {
    const range = activeRange.value;
    return Array.isArray(range) &&
           (range[0] !== minValue || range[1] !== maxValue);
  });

  const setRange = (range) => {
    if (range[0] === minValue && range[1] === maxValue) {
      clearFilter(field);
    } else {
      setFilter(field, range);
    }
  };

  const clearRange = () => {
    clearFilter(field);
  };

  return {
    field,
    facetConfig,
    activeRange,
    hasActiveRange,
    setRange,
    clearRange,
    minValue,
    maxValue
  };
}

export function useGeoFacet(facetConfig, searchComposable) {
  const { activeFilters, setFilter, clearFilter } = searchComposable;
  const field = facetConfig.field;

  const activeBounds = computed(() => {
    return activeFilters.value[field] || null;
  });

  const hasActiveBounds = computed(() => {
    return !!activeBounds.value;
  });

  const setBounds = (bounds) => {
    if (!bounds) {
      clearFilter(field);
    } else {
      setFilter(field, { bounds });
    }
  };

  const clearBounds = () => {
    clearFilter(field);
  };

  return {
    field,
    facetConfig,
    activeBounds,
    hasActiveBounds,
    setBounds,
    clearBounds
  };
}
