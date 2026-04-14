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
      error: null,
      lastQuery: null
    });

    this.debouncedExecuteQuery = _.debounce(this.executeQuery.bind(this), 300);
    this.setupWatchers();
  }

  setupWatchers() {
    watch(() => this.state.textQuery, () => this.debouncedExecuteQuery());
    watch(() => this.state.activeFilters, () => this.executeQuery(), { deep: true });
    watch(() => this.state.resourceType, () => this.executeQuery());
    watch(() => this.state.searchExactMatch, () => this.executeQuery());
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
      this.state.activeFilters[field] = value;
    }
  }

  clearFilter(field) {
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

  async executeQuery() {
    if (!this.shouldExecuteQuery()) {
      this.state.results = [];
      return;
    }

    this.state.isLoading = true;
    this.state.error = null;

    try {
      const params = this.searchParams.value;
      this.state.lastQuery = params;

      const results = await this.queryExecutor(params);
      this.state.results = results || [];

    } catch (error) {
      console.error('Query execution error:', error);
      this.state.error = error.message || 'Query execution failed';
      this.state.results = [];
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

    this.state.textQuery = (byKey.get('q') || [''])[0] || '';
    this.state.resourceType = (byKey.get('resourceType') || ['all'])[0] || 'all';
    const exArr = byKey.get('searchExactMatch');
    const ex = exArr && exArr[0];
    this.state.searchExactMatch =
      ex === undefined || ex === '' ? true : ex === 'true';

    this.state.activeFilters = {};

    for (const [key, arr] of byKey.entries()) {
      if (reserved.has(key) || arr.length === 0) continue;

      const facet = (this.config.FACETS || []).find((f) => f.field === key);
      const isRange =
        facet &&
        ['range', 'rangeyear', 'rangedepth'].includes(facet.type);

      if (isRange && arr.length >= 2) {
        const min = Number(arr[0]);
        const max = Number(arr[1]);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          this.state.activeFilters[key] = [min, max];
          continue;
        }
      }

      if (isRange && arr.length === 1 && arr[0].includes(',')) {
        const parts = arr[0].split(',').map((p) => p.trim());
        if (parts.length === 2) {
          const min = Number(parts[0]);
          const max = Number(parts[1]);
          if (!Number.isNaN(min) && !Number.isNaN(max)) {
            this.state.activeFilters[key] = [min, max];
            continue;
          }
        }
      }

      this.state.activeFilters[key] = [...arr];
    }
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
