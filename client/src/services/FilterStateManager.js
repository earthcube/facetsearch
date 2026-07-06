import { reactive, computed, watch } from 'vue';
import _ from 'lodash';

export class FilterStateManager {
  constructor(config, queryExecutor) {
    this.config = config;
    this.queryExecutor = queryExecutor;

    this.state = reactive({
      textQuery: '',
      searchExactMatch: true,
      resourceType: 'all',
      activeFilters: {},
      isLoading: false,
      results: [],
      totalCount: 0,
      searchTotalCount: 0,
      error: null,
      lastQuery: null,
      lastQuerySignature: '',
      lastQueryAt: 0
    });

    this.debouncedExecuteQuery = _.debounce(this.executeQuery.bind(this), 300);
    this.isSyncingFromUrl = false;
    this.setupWatchers();
  }

  setupWatchers() {
    watch(() => this.state.textQuery, () => {
      if (this.isSyncingFromUrl) return;
      this.debouncedExecuteQuery();
    });
    watch(() => this.state.activeFilters, () => {
      if (this.isSyncingFromUrl) return;
      this.executeQuery();
    }, { deep: true });
    watch(() => this.state.resourceType, () => {
      if (this.isSyncingFromUrl) return;
      this.executeQuery();
    });
    watch(() => this.state.searchExactMatch, () => {
      if (this.isSyncingFromUrl) return;
      this.executeQuery();
    });
  }

  get hasActiveFilters() {
    return computed(() => {
      return Object.keys(this.state.activeFilters).some(key => {
        const value = this.state.activeFilters[key];
        return Array.isArray(value) ? value.length > 0 : !!value;
      });
    });
  }

  get searchParams() {
    return computed(() => ({
      textQuery: this.state.textQuery,
      searchExactMatch: this.state.searchExactMatch,
      resourceType: this.state.resourceType,
      filters: this.state.activeFilters,
      limit: Number(this.config?.LIMIT_DEFAULT ?? 10),
      offset: 0
    }));
  }

  addFilter(field, value) {
    if (!this.state.activeFilters[field]) {
      this.state.activeFilters[field] = [];
    }

    if (Array.isArray(this.state.activeFilters[field])) {
      if (!this.state.activeFilters[field].includes(value)) {
        this.state.activeFilters[field].push(value);
      }
    } else {
      this.state.activeFilters[field] = [this.state.activeFilters[field], value];
    }
  }

  removeFilter(field, value) {
    if (!this.state.activeFilters[field]) return;

    if (Array.isArray(this.state.activeFilters[field])) {
      const index = this.state.activeFilters[field].indexOf(value);
      if (index > -1) {
        this.state.activeFilters[field].splice(index, 1);

        if (this.state.activeFilters[field].length === 0) {
          delete this.state.activeFilters[field];
        }
      }
    } else if (this.state.activeFilters[field] === value) {
      delete this.state.activeFilters[field];
    }
  }

  setFilter(field, value) {
    if (value === null || value === undefined || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      this.clearFilter(field);
    } else {
      if (this.areFilterValuesEqual(this.state.activeFilters[field], value)) return;
      this.state.activeFilters[field] = value;
    }
  }

  clearFilter(field) {
    if (!(field in this.state.activeFilters)) return;
    delete this.state.activeFilters[field];
  }

  clearAllFilters() {
    this.state.activeFilters = {};
  }

  setTextQuery(query) {
    this.state.textQuery = query || '';
  }

  setResourceType(type) {
    this.state.resourceType = type || 'all';
  }

  setSearchExactMatch(exact) {
    this.state.searchExactMatch = !!exact;
  }

  hasActiveFacetFilters(filters) {
    if (!filters || typeof filters !== 'object') return false;
    return Object.keys(filters).some((key) => {
      const value = filters[key];
      return Array.isArray(value) ? value.length > 0 : !!value;
    });
  }

  isGeoFacetField(field) {
    const facet = (this.config?.FACETS || []).find((f) => f.field === field);
    return facet?.type === 'geo';
  }

  /**
   * Canonical geo-bounds object used throughout state/query code:
   * { north, south, east, west } with numeric finite values.
   */
  normalizeGeoBounds(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const north = Number(raw.north);
    const south = Number(raw.south);
    const east = Number(raw.east);
    const west = Number(raw.west);
    if (
      !Number.isFinite(north) ||
      !Number.isFinite(south) ||
      !Number.isFinite(east) ||
      !Number.isFinite(west)
    ) {
      return null;
    }

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    let n = clamp(north, -90, 90);
    let s = clamp(south, -90, 90);
    let e = clamp(east, -180, 180);
    let w = clamp(west, -180, 180);

    // Guardrail for inverted bounds.
    if (n < s) [n, s] = [s, n];
    if (e < w) [e, w] = [w, e];

    // Degenerate boxes are treated as empty.
    if (n === s || e === w) return null;

    return { north: n, south: s, east: e, west: w };
  }

  encodeGeoBoundsForUrl(bounds) {
    const b = this.normalizeGeoBounds(bounds);
    if (!b) return '';
    return `${b.north},${b.south},${b.east},${b.west}`;
  }

  decodeGeoBoundsFromUrl(value) {
    if (value === undefined || value === null) return null;
    const parts = String(value).split(',').map((p) => p.trim());
    if (parts.length !== 4) return null;
    return this.normalizeGeoBounds({
      north: parts[0],
      south: parts[1],
      east: parts[2],
      west: parts[3],
    });
  }

  async executeQuery() {
    if (!this.shouldExecuteQuery()) {
      this.state.results = [];
      this.state.totalCount = 0;
      this.state.searchTotalCount = 0;
      return;
    }

    const params = this.searchParams.value;
    const signature = this.buildQuerySignature(params);
    const now = Date.now();
    if (
      signature === this.state.lastQuerySignature &&
      now - this.state.lastQueryAt < 1000
    ) {
      return;
    }

    this.state.isLoading = true;
    this.state.error = null;

    const filtersActive = this.hasActiveFacetFilters(params.filters);
    const prevHadFilters = this.hasActiveFacetFilters(this.state.lastQuery?.filters);
    if (filtersActive && !prevHadFilters && this.state.totalCount > 0) {
      this.state.searchTotalCount = this.state.totalCount;
    }

    try {
      this.state.lastQuery = params;
      this.state.lastQuerySignature = signature;
      this.state.lastQueryAt = now;

      const outcome = await this.queryExecutor(params);
      if (Array.isArray(outcome)) {
        this.state.results = outcome;
        this.state.totalCount = outcome.length;
      } else {
        this.state.results = outcome?.results || [];
        this.state.totalCount =
          outcome?.totalCount ?? this.state.results.length;
        if (outcome?.totalCountPromise) {
          outcome.totalCountPromise.then((n) => {
            this.state.totalCount = n;
          });
        }
        if (outcome?.searchTotalCountPromise) {
          outcome.searchTotalCountPromise.then((n) => {
            this.state.searchTotalCount = n > 0 ? n : this.state.totalCount;
          });
        } else {
          this.state.searchTotalCount = 0;
        }
      }

    } catch (error) {
      console.error('Query execution error:', error);
      this.state.error = error.message || 'Query execution failed';
      this.state.results = [];
      this.state.totalCount = 0;
      this.state.searchTotalCount = 0;
    } finally {
      this.state.isLoading = false;
    }
  }

  shouldExecuteQuery() {
    return this.state.textQuery.trim() !== '' ||
           Object.keys(this.state.activeFilters).length > 0;
  }

  /**
   * @param {string | URLSearchParams | Record<string, unknown>} urlParams - route.query or search string
   */
  updateFromUrl(urlParams) {
    const reserved = new Set(['q', 'resourceType', 'searchExactMatch']);

    /** @type {Map<string, string[]>} */
    const byKey = new Map();
    const add = (k, v) => {
      if (v === undefined || v === null || v === '') return;
      const s = String(v);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(s);
    };

    if (typeof urlParams === 'string') {
      const s = urlParams.startsWith('?') ? urlParams.slice(1) : urlParams;
      const sp = new URLSearchParams(s);
      for (const [k, v] of sp.entries()) add(k, v);
    } else if (urlParams instanceof URLSearchParams) {
      for (const [k, v] of urlParams.entries()) add(k, v);
    } else if (urlParams && typeof urlParams === 'object') {
      for (const [k, raw] of Object.entries(urlParams)) {
        if (raw === undefined || raw === null) continue;
        if (Array.isArray(raw)) {
          for (const item of raw) add(k, item);
        } else {
          add(k, raw);
        }
      }
    }

    const nextTextQuery = (byKey.get('q') || [''])[0] || '';
    const nextResourceType = (byKey.get('resourceType') || ['all'])[0] || 'all';
    const exArr = byKey.get('searchExactMatch');
    const ex = exArr && exArr[0];
    const nextSearchExactMatch =
      ex === undefined || ex === '' ? true : ex === 'true';

    const nextActiveFilters = {};

    for (const [key, arr] of byKey.entries()) {
      if (reserved.has(key) || arr.length === 0) continue;

      const facet = (this.config.FACETS || []).find((f) => f.field === key);
      if (facet?.type === 'geo') {
        const decoded = this.decodeGeoBoundsFromUrl(arr[arr.length - 1]);
        if (decoded) {
          nextActiveFilters[key] = { bounds: decoded };
        }
        continue;
      }
      const isRange =
        facet &&
        ['range', 'rangeyear', 'rangedepth'].includes(facet.type);

      if (isRange && arr.length >= 2) {
        const min = Number(arr[0]);
        const max = Number(arr[1]);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          nextActiveFilters[key] = [min, max];
          continue;
        }
      }

      if (isRange && arr.length === 1 && arr[0].includes(',')) {
        const parts = arr[0].split(',').map((p) => p.trim());
        if (parts.length === 2) {
          const min = Number(parts[0]);
          const max = Number(parts[1]);
          if (!Number.isNaN(min) && !Number.isNaN(max)) {
            nextActiveFilters[key] = [min, max];
            continue;
          }
        }
      }

      nextActiveFilters[key] = [...arr];
    }

    const unchanged =
      this.state.textQuery === nextTextQuery &&
      this.state.resourceType === nextResourceType &&
      this.state.searchExactMatch === nextSearchExactMatch &&
      this.areFiltersEqual(this.state.activeFilters, nextActiveFilters);
    if (unchanged) {
      return;
    }

    this.isSyncingFromUrl = true;
    this.state.textQuery = nextTextQuery;
    this.state.resourceType = nextResourceType;
    this.state.searchExactMatch = nextSearchExactMatch;
    this.state.activeFilters = nextActiveFilters;
    this.isSyncingFromUrl = false;
    void this.executeQuery();
  }

  areFilterValuesEqual(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((v, i) => String(v) === String(b[i]));
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return String(a) === String(b);
  }

  areFiltersEqual(current, next) {
    const currentKeys = Object.keys(current || {}).sort();
    const nextKeys = Object.keys(next || {}).sort();
    if (currentKeys.length !== nextKeys.length) return false;
    for (let i = 0; i < currentKeys.length; i += 1) {
      const key = currentKeys[i];
      if (key !== nextKeys[i]) return false;
      if (!this.areFilterValuesEqual(current[key], next[key])) return false;
    }
    return true;
  }

  buildQuerySignature(params) {
    const filters = params?.filters || {};
    const orderedFilters = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, Array.isArray(v) ? [...v] : v]);
    return JSON.stringify({
      textQuery: params?.textQuery || '',
      searchExactMatch: !!params?.searchExactMatch,
      resourceType: params?.resourceType || 'all',
      limit: Number(params?.limit ?? 0),
      offset: Number(params?.offset ?? 0),
      filters: orderedFilters,
    });
  }

  getUrlParams() {
    const params = new URLSearchParams();

    if (this.state.textQuery) {
      params.set('q', this.state.textQuery);
    }

    if (this.state.resourceType && this.state.resourceType !== 'all') {
      params.set('resourceType', this.state.resourceType);
    }

    params.set(
      'searchExactMatch',
      this.state.searchExactMatch ? 'true' : 'false'
    );

    Object.entries(this.state.activeFilters).forEach(([key, values]) => {
      if (this.isGeoFacetField(key)) {
        const encoded = this.encodeGeoBoundsForUrl(values?.bounds ?? values);
        if (encoded) params.set(key, encoded);
        return;
      }

      if (Array.isArray(values)) {
        values.forEach((value) => params.append(key, value));
      } else if (values) {
        params.set(key, values);
      }
    });

    return params.toString();
  }

  getActiveFiltersForDisplay() {
    const display = {};
    Object.entries(this.state.activeFilters).forEach(([key, values]) => {
      if (this.isGeoFacetField(key)) {
        const b = this.normalizeGeoBounds(values?.bounds ?? values);
        if (b) {
          display[key] = [
            `N:${b.north.toFixed(2)} S:${b.south.toFixed(2)} E:${b.east.toFixed(2)} W:${b.west.toFixed(2)}`,
          ];
        }
        return;
      }

      if (Array.isArray(values) && values.length > 0) {
        display[key] = values;
      } else if (values) {
        display[key] = [values];
      }
    });
    return display;
  }

  getFilterCount() {
    return Object.keys(this.state.activeFilters).length;
  }

  isFilterActive(field, value) {
    const filterValues = this.state.activeFilters[field];
    if (!filterValues) return false;

    if (Array.isArray(filterValues)) {
      return filterValues.includes(value);
    }

    return filterValues === value;
  }
}

export function createFilterStateManager(config, queryExecutor) {
  return new FilterStateManager(config, queryExecutor);
}
