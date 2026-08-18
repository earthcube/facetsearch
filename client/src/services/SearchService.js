// client/src/services/SearchService.js
import axios from 'axios';
import { default as LRUCache } from 'lru-cache';
import { createSparqlQueryBuilder } from './SparqlQueryBuilder.js';
import { createFilterStateManager } from './FilterStateManager.js';

/**
 * Route/API id for datasets: prefer named graph URN (GeoCodes) over subject IRIs
 * such as https://gleaner.io/xid/... Tool rows keep ?subj for /tool/:t.
 */
export function datasetRouteIdFromBinding(row) {
  const subj = row.subj != null ? String(row.subj) : '';
  const rt = row.resourceType_u || row.resourceType;
  if (rt === 'tool') return subj;

  const g = row.g != null ? String(row.g) : '';
  if (g.startsWith('urn:')) return g;
  if (subj.startsWith('urn:')) return subj;
  return subj || g || '';
}

/** Split SPARQL GROUP_CONCAT values the same way as state.js flattenSparqlResults. */
export function splitSparqlGroupConcat(value) {
  if (value == null || value === '') return null;
  const regex = /,(?![^(]*\)) /;
  const elements = String(value).split(regex);
  if (elements.length === 1 && elements[0].trim() === '') {
    return null;
  }
  return elements;
}

/**
 * Main Search Service (QLever-first)
 * - Builds SPARQL from active filters
 * - For QLever: try GET first, POST fallback
 * - For Blazegraph/Fuseki: POST first
 * - Normalizes results to a simple array of objects
 * - Provides facet option utilities (getFacetOptions)
 */
export class SearchService {
  constructor(config) {
    this.config = config;
    // Optional: sanity log; comment out if too noisy
    // console.info('[SearchService] Engine:', this.config?.QUERY_ENGINE, 'Endpoint:', this.config?.TRIPLESTORE_URL);

    this.queryBuilder = createSparqlQueryBuilder(config);

    this.autocompleteCache = new LRUCache({ max: 200, ttl: 5 * 60_000 });

    // Filter state manager wires executeQuery
    this.filterStateManager = createFilterStateManager(
      config,
      this.executeQuery.bind(this)
    );
  }

  /** Call when store FacetsConfig is replaced so LIMIT_DEFAULT and endpoints stay current. */
  setConfig(config) {
    const hadFacets = Array.isArray(this.config?.FACETS) && this.config.FACETS.length > 0;
    this.config = config;
    this.queryBuilder.config = config;
    this.filterStateManager.config = config;
    // Re-run only when we transition from no facets -> facets AND a query already ran.
    // This avoids duplicate initial requests while still recovering from pre-config searches.
    const hasFacets = Array.isArray(config?.FACETS) && config.FACETS.length > 0;
    const hadPriorQuery = this.filterStateManager.state.lastQuery != null;
    if (!hadFacets && hasFacets && hadPriorQuery && this.filterStateManager.shouldExecuteQuery()) {
      void this.filterStateManager.executeQuery();
    }
  }

  /**
   * Execute a search with the current filters and parameters
   */
  hasActiveFacetFilters(filters) {
    if (!filters || typeof filters !== 'object') return false;
    return Object.keys(filters).some((key) => {
      const value = filters[key];
      return Array.isArray(value) ? value.length > 0 : !!value;
    });
  }

  async executeQuery(searchParams) {
    try {
      const sparqlQuery = this.queryBuilder.buildQuery(searchParams);
      const response = await this.sendToTriplestoreWithFallback(sparqlQuery);
      const results = this.processResults(response);

      const countDistinctSubjects = this.hasActiveFacetFilters(searchParams.filters);

      const totalCountPromise = this.fetchTotalCount(searchParams, {
        countDistinctSubjects,
      })
        .then((n) => (n > 0 ? n : results.length))
        .catch((err) => {
          console.warn('Search count query failed:', err?.message || err);
          return results.length;
        });

      let searchTotalCountPromise = null;
      if (this.hasActiveFacetFilters(searchParams.filters)) {
        searchTotalCountPromise = this.fetchTotalCount(
          { ...searchParams, filters: {} },
          { countDistinctSubjects: false }
        ).catch((err) => {
          console.warn('Search unfiltered count query failed:', err?.message || err);
          return 0;
        });
      }

      return {
        results,
        totalCount: results.length,
        totalCountPromise,
        searchTotalCountPromise,
      };
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  }

  async fetchTotalCount(searchParams, options = {}) {
    const countQuery = this.queryBuilder.buildCountQuery(searchParams, options);
    const countResponse = await this.sendToTriplestoreWithFallback(countQuery);
    return this.processCountResult(countResponse);
  }

  /**
   * Sends query to TRIPLESTORE_URL
   * - QLever: GET first (reliable), then POST fallback
   * - Blazegraph/Fuseki: POST first
   */
  async sendToTriplestoreWithFallback(query) {
    const endpoint = this.config.TRIPLESTORE_URL;
    let timeout = this.parseTimeout(this.config.BLAZEGRAPH_TIMEOUT) || 20000;


    if (this.usesQLever()) {
        timeout = `${timeout}ms`
      try {
        return await this.sendDirectGET(endpoint, query, timeout);
      } catch (err) {
        console.warn('QLever GET failed; trying POST fallback:', err?.message || err);
        return await this.sendDirectPOST(endpoint, query, timeout);
      }
    }

    // Blazegraph/Fuseki
    return await this.sendDirectPOST(endpoint, query, timeout);
  }

  /**
   * POST to the SPARQL endpoint
   */
  async sendDirectPOST(endpoint, query, timeoutMs) {
    const axiosTimeoutMs = Math.max(timeoutMs + 30_000, 120_000);
    const response = await axios.post(
      endpoint,
      new URLSearchParams({
        query,
        format: 'json',
        timeout: String(timeoutMs),
      }),
      {
        timeout: axiosTimeoutMs,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json',
        },
      }
    );
    return response.data;
  }

  /**
   * GET to the SPARQL endpoint (QLever-friendly)
   */
  async sendDirectGET(endpoint, query, timeoutMs) {
    const url = new URL(endpoint);
    url.searchParams.set('query', query);
    const axiosTimeoutMs = Math.max(timeoutMs + 30_000, 120_000);
    const response = await axios.get(url.toString(), {
      timeout: axiosTimeoutMs,
      headers: { 'Accept': 'application/sparql-results+json' },
    });
    return response.data;
  }

  /**
   * Basic engine check
   */
  usesQLever() {
    return String(this.config?.QUERY_ENGINE || '').toLowerCase() === 'qlever';
  }

  /**
   * Parse timeout values like 20 or "20s" into milliseconds
   */
  parseTimeout(val) {
    if (typeof val === 'number') return val * 1000;
    if (typeof val === 'string') {
      const m = val.match(/^(\d+)\s*s$/i);
      if (m) return parseInt(m[1], 10) * 1000;
      const n = Number(val);
      if (!isNaN(n)) return n * 1000;
    }
    return undefined;
  }

  /**
   * Normalize SPARQL JSON results to a flat array of objects
   */
  processCountResult(response) {
    const raw = response?.results?.bindings?.[0]?.count?.value;
    const n = parseInt(raw ?? '0', 10);
    return Number.isNaN(n) ? 0 : n;
  }

  processResults(response) {
    if (!response || !response.results || !response.results.bindings) {
      return [];
    }
    return response.results.bindings.map(binding => {
      const out = {};
      for (const key of Object.keys(binding)) {
        if (binding[key] && binding[key].value !== undefined) {
          out[key] = binding[key].value;
        }
      }
      // Convenience fields used by UI (dataset links use graph URN when available)
      out.id = datasetRouteIdFromBinding(out);
      if (out.resourceType_u !== undefined && out.resourceType === undefined) {
        out.resourceType = out.resourceType_u;
      }
      if (out.kw !== undefined) {
        out.kw = splitSparqlGroupConcat(out.kw);
      }
      if (out.placenames !== undefined) {
        out.placenames = splitSparqlGroupConcat(out.placenames);
      }
      if (out.disurl !== undefined) {
        out.disurl = splitSparqlGroupConcat(out.disurl);
      }
      return out;
    });
  }

  // -------------------------
  // Autocomplete (landing keyword entry; QLever word index only)
  // -------------------------

  /**
   * Word completions for a typed prefix, ranked by corpus frequency.
   * Returns [] when the prefix is too short or the engine is not QLever.
   */
  async getAutocompleteSuggestions(prefix) {
    const query = this.queryBuilder.buildAutocompleteQuery(prefix);
    if (!query) return [];
    const cacheKey = query;
    const cached = this.autocompleteCache.get(cacheKey);
    if (cached) return cached;
    const data = await this.sendToTriplestoreWithFallback(query);
    const bindings = data?.results?.bindings || [];
    const suggestions = bindings
      .map((b) => ({
        word: b.word?.value ?? '',
        count: parseInt(b.count?.value ?? '0', 10) || 0,
      }))
      .filter((s) => s.word.trim().length > 0);
    this.autocompleteCache.set(cacheKey, suggestions);
    return suggestions;
  }

  // -------------------------
  // Facet Options (for FacetText2 / useFacetOptions)
  // -------------------------

  /**
   * Fetch facet options (distinct values + counts) for a given field.
   * searchContext: { filters, textQuery, searchExactMatch, resourceType }
   *   filters = other active facet filters (excluding this field)
   */
  async getFacetOptions(field, searchContext = {}) {
    const query = this.buildFacetOptionsQuery(field, searchContext);
    const data = await this.sendToTriplestoreWithFallback(query);
    return this.processFacetOptions(data);
  }

  /**
   * Build a SPARQL query that returns distinct values and their counts for a facet
   */
  buildFacetOptionsQuery(field, searchContext = {}) {
    const facetConfig = (this.config.FACETS || []).find(f => f.field === field);
    if (!facetConfig) {
      return `
${this.queryBuilder.buildPrefixes()}
SELECT ?value (0 as ?count) WHERE { FILTER(false) } LIMIT 0
`;
    }

    const {
      filters: currentFilters = {},
      textQuery = '',
      searchExactMatch = false,
      resourceType = '',
    } = searchContext;

    // Exclude this facet's own filters to avoid self-filtering options
    const filtersCopy = { ...(currentFilters || {}) };
    delete filtersCopy[field];

    let q = '';
    q += this.queryBuilder.buildPrefixes();
    q += `SELECT ?value (COUNT(DISTINCT ?subj) AS ?count)
WHERE {
`;
    q += this.queryBuilder.buildFacetOptionsWhereInner(
      textQuery,
      searchExactMatch,
      resourceType,
      filtersCopy
    );
    if (facetConfig.type === 'variablemeasured' || facetConfig.type === 'propertyvalue') {
      q += this.queryBuilder.buildPropertyValueNamePattern(field, facetConfig);
    } else {
      const sparqlProperty =
        facetConfig.sparql_property ||
        this.queryBuilder.getDefaultSparqlProperty(field);
      q += this.queryBuilder.buildFacetPropertyPattern(field, sparqlProperty);
    }
    q += `}
GROUP BY ?value
ORDER BY DESC(?count) ?value
LIMIT 200
`;
    return q;
  }

  /**
   * Normalize facet options for UI (value,label,count)
   */
  processFacetOptions(response) {
    const bindings = response?.results?.bindings || [];
    return bindings
      .map(b => {
        const value = b.value?.value ?? '';
        const count = parseInt(b.count?.value ?? '0', 10);
        return {
          value,
          label: value,
          count: isNaN(count) ? 0 : count
        };
      })
      .filter(opt => opt.value.trim().length > 0);
  }

  // -------------------------
  // DataCatalog (per-source, SPARQL-paginated)
  // -------------------------

  /**
   * The release catalog held in a named graph. Returns [] when that graph holds
   * no DataCatalog.
   */
  async getCatalogByGraph(graphUri) {
    const query = this.queryBuilder.buildCatalogByGraphQuery(graphUri);
    const response = await this.sendToTriplestoreWithFallback(query);
    return this.processResults(response);
  }

  /** Every Nabu release catalog, for turning a source slug into its URN. */
  async getCatalogList() {
    const query = this.queryBuilder.buildCatalogListQuery();
    const response = await this.sendToTriplestoreWithFallback(query);
    return this.processResults(response);
  }

  /** One page of Datasets embedded in a catalog document (named graph IRI). */
  async getCatalogDatasetsPage(graphUri, { limit = 10, offset = 0 } = {}) {
    const query = this.queryBuilder.buildCatalogDatasetsQuery(graphUri, { limit, offset });
    const response = await this.sendToTriplestoreWithFallback(query);
    return this.processResults(response);
  }

  /** Total Dataset count for a catalog document (named graph IRI). */
  async getCatalogDatasetsCount(graphUri) {
    const query = this.queryBuilder.buildCatalogDatasetsCountQuery(graphUri);
    const response = await this.sendToTriplestoreWithFallback(query);
    return this.processCountResult(response);
  }

  // -------------------------
  // Expose helpers
  // -------------------------

  getFilterStateManager() {
    return this.filterStateManager;
  }

  getQueryBuilder() {
    return this.queryBuilder;
  }
}

// Factory
export function createSearchService(config) {
  return new SearchService(config);
}
