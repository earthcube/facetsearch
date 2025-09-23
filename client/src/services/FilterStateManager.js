import { reactive, computed, watch } from 'vue';
import _ from 'lodash';

export class FilterStateManager {
  constructor(config, queryExecutor) {
    this.config = config;
    this.queryExecutor = queryExecutor;

    this.state = reactive({
      textQuery: '',
      searchExactMatch: false,
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
      limit: this.config.LIMIT_DEFAULT || 10,
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

  updateFromUrl(urlParams) {
    const params = new URLSearchParams(urlParams);

    this.state.textQuery = params.get('q') || '';
    this.state.resourceType = params.get('resourceType') || 'all';
    this.state.searchExactMatch = params.get('searchExactMatch') === 'true';

    this.state.activeFilters = {};

    for (const [key, value] of params.entries()) {
      if (key !== 'q' && key !== 'resourceType' && key !== 'searchExactMatch') {
        if (this.state.activeFilters[key]) {
          if (!Array.isArray(this.state.activeFilters[key])) {
            this.state.activeFilters[key] = [this.state.activeFilters[key]];
          }
          this.state.activeFilters[key].push(value);
        } else {
          this.state.activeFilters[key] = [value];
        }
      }
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

    if (this.state.searchExactMatch) {
      params.set('searchExactMatch', 'true');
    }

    Object.entries(this.state.activeFilters).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        values.forEach(value => params.append(key, value));
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
