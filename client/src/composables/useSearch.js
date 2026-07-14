import { ref, computed, onMounted, onBeforeUnmount, watch, unref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createSearchService } from '@/services/SearchService.js';

/**
 * Build a vue-router query object from URLSearchParams string, preserving duplicate keys as string[].
 * Object.fromEntries(URLSearchParams) drops the second value for the same key (breaks range sliders).
 */
function searchParamsStringToRouterQuery(paramString) {
  if (!paramString) return {};
  const sp = new URLSearchParams(paramString);
  /** @type {Record<string, string | string[]>} */
  const q = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    q[key] = all.length === 1 ? all[0] : all;
  }
  return q;
}

function routeQueryToSearchParamsString(query) {
  const sp = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, raw]) => {
    if (raw === undefined || raw === null || raw === '') return;
    if (Array.isArray(raw)) {
      raw.forEach((item) => sp.append(key, String(item)));
    } else {
      sp.set(key, String(raw));
    }
  });
  return sp.toString();
}

/** Pass the `config` computed ref from useConfig() so LIMIT_DEFAULT updates when FacetsConfig changes. */
export function useSearch(configOrRef) {
  const router = useRouter();
  const route = useRoute();
  const initial = unref(configOrRef) ?? {};
  const searchService = createSearchService(initial);
  const filterStateManager = searchService.getFilterStateManager();

  watch(
    () => unref(configOrRef),
    (cfg) => {
      if (cfg) searchService.setConfig(cfg);
    }
  );

  const state = filterStateManager.state;

  const isLoading = computed(() => state.isLoading);
  const results = computed(() => state.results);
  const totalCount = computed(() => state.totalCount);
  const searchTotalCount = computed(() => state.searchTotalCount);
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
  const currentPage = computed(() => state.page || 1);
  const pageSize = computed(() => state.limit || Number(unref(configOrRef)?.LIMIT_DEFAULT || 10));
  const pageSizeOptions = computed(() => {
    const fromConfig = unref(configOrRef)?.LIMIT_OPTIONS;
    if (Array.isArray(fromConfig) && fromConfig.length > 0) return fromConfig.map((v) => Number(v));
    return [10, 50, 100];
  });
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

  const setPage = (page) => {
    filterStateManager.setPage(page);
  };

  const setPageSize = (limit) => {
    filterStateManager.setLimit(limit);
  };

  const updateFromUrl = (urlParams) => {
    filterStateManager.updateFromUrl(urlParams);
  };

  const getUrlParams = () => {
    return filterStateManager.getUrlParams();
  };

  const updateUrl = () => {
    const params = getUrlParams();
    const currentParams = routeQueryToSearchParamsString(route.query);
    if (currentParams === params) return;
    const query = searchParamsStringToRouterQuery(params);
    router.replace({ query });
  };

  watch(
    [textQuery, resourceType, searchExactMatch, activeFilters, currentPage, pageSize],
    () => {
      updateUrl();
    },
    { deep: true }
  );

  return {
    isLoading,
    results,
    totalCount,
    searchTotalCount,
    error,
    textQuery,
    searchExactMatch,
    resourceType,
    activeFilters,
    currentPage,
    pageSize,
    pageSizeOptions,
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
    setPage,
    setPageSize,
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
  let loadGeneration = 0;

  const loadOptions = async (searchContext = {}) => {
    const generation = ++loadGeneration;
    loading.value = true;
    error.value = null;

    try {
      const facetOptions = await searchService.getFacetOptions(field, searchContext);
      if (generation !== loadGeneration) return;
      options.value = facetOptions;
    } catch (err) {
      if (generation !== loadGeneration) return;
      error.value = err.message;
      console.error(`Error loading options for ${field}:`, err);
    } finally {
      if (generation === loadGeneration) {
        loading.value = false;
      }
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
    textQuery,
    searchExactMatch,
    resourceType,
    addFilter,
    removeFilter,
    setFilter,
    clearFilter,
    isFilterActive,
    searchService,
    filterStateManager,
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

  const filtersKey = (obj) => {
    const ordered = Object.entries(obj || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, Array.isArray(v) ? [...v] : v]);
    return JSON.stringify(ordered);
  };

  const lastLoadedKey = ref('');
  let reloadTimer = null;

  const buildSearchContext = () => {
    const currentFilters = { ...activeFilters.value };
    delete currentFilters[field];
    return {
      filters: currentFilters,
      textQuery: textQuery.value,
      searchExactMatch: searchExactMatch.value,
      resourceType: resourceType.value,
    };
  };

  const optionsLoadKey = (context) => {
    return JSON.stringify({
      filters: filtersKey(context.filters),
      textQuery: context.textQuery || '',
      searchExactMatch: !!context.searchExactMatch,
      resourceType: context.resourceType || '',
    });
  };

  const loadOptionsForCurrentState = async (force = false) => {
    const searchContext = buildSearchContext();
    const key = optionsLoadKey(searchContext);
    if (!force && key === lastLoadedKey.value) return;
    lastLoadedKey.value = key;
    await loadOptions(searchContext);
  };

  const scheduleOptionsReload = (force = false) => {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      void loadOptionsForCurrentState(force);
    }, 120);
  };

  watch(
    () => optionsLoadKey(buildSearchContext()),
    () => {
      scheduleOptionsReload(false);
    }
  );

  // Reload facet counts after the main search finishes (avoids stale pre-search responses).
  watch(
    () => filterStateManager.state.lastQueryAt,
    () => {
      if (!filterStateManager.state.lastQuerySignature) return;
      scheduleOptionsReload(true);
    }
  );

  onMounted(() => {
    const ctx = buildSearchContext();
    const hasQuery = String(ctx.textQuery || '').trim() !== '';
    const hasFilters = Object.keys(ctx.filters || {}).length > 0;
    if (!hasQuery && !hasFilters) return;
    void loadOptionsForCurrentState(false);
  });

  onBeforeUnmount(() => {
    if (reloadTimer) clearTimeout(reloadTimer);
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

export function useRangeFacet(
  facetConfig,
  searchComposable,
  minValue,
  maxValue,
  options = {}
) {
  const { activeFilters, setFilter, clearFilter } = searchComposable;
  const field = facetConfig.field;
  const fullRangeSlop = options.fullRangeSlop ?? 0;

  const isEffectivelyFullRange = (range) => {
    if (!Array.isArray(range) || range.length < 2) return false;
    const [lo, hi] = range;
    return (
      Math.abs(lo - minValue) <= fullRangeSlop &&
      Math.abs(hi - maxValue) <= fullRangeSlop
    );
  };

  const activeRange = computed(() => {
    return activeFilters.value[field] || [minValue, maxValue];
  });

  const hasActiveRange = computed(() => {
    const range = activeRange.value;
    if (!Array.isArray(range)) return false;
    if (isEffectivelyFullRange(range)) return false;
    return range[0] !== minValue || range[1] !== maxValue;
  });

  const setRange = (range) => {
    if (!Array.isArray(range) || range.length < 2) return;
    if (range[0] === minValue && range[1] === maxValue) {
      clearFilter(field);
    } else if (isEffectivelyFullRange(range)) {
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

  const normalizeBounds = (bounds) => {
    if (!bounds || typeof bounds !== 'object') return null;
    const north = Number(bounds.north);
    const south = Number(bounds.south);
    const east = Number(bounds.east);
    const west = Number(bounds.west);
    if (
      !Number.isFinite(north) ||
      !Number.isFinite(south) ||
      !Number.isFinite(east) ||
      !Number.isFinite(west)
    ) {
      return null;
    }
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    let n = clamp(north, -90, 90);
    let s = clamp(south, -90, 90);
    let e = clamp(east, -180, 180);
    let w = clamp(west, -180, 180);
    if (n < s) [n, s] = [s, n];
    if (e < w) [e, w] = [w, e];
    if (n === s || e === w) return null;
    return { north: n, south: s, east: e, west: w };
  };

  const activeBounds = computed(() => {
    return activeFilters.value[field] || null;
  });

  const hasActiveBounds = computed(() => {
    return !!activeBounds.value;
  });

  const setBounds = (bounds) => {
    const normalized = normalizeBounds(bounds);
    if (!normalized) {
      clearFilter(field);
    } else {
      setFilter(field, { bounds: normalized });
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
