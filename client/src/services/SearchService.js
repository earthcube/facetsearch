// client/src/services/SearchService.js
import axios from 'axios';
import { createSparqlQueryBuilder } from './SparqlQueryBuilder.js';
import { createFilterStateManager } from './FilterStateManager.js';

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

    // Filter state manager wires executeQuery
    this.filterStateManager = createFilterStateManager(
      config,
      this.executeQuery.bind(this)
    );
  }

  /**
   * Execute a search with the current filters and parameters
   */
  async executeQuery(searchParams) {
    try {
      const sparqlQuery = this.queryBuilder.buildQuery(searchParams);
      const response = await this.sendToTriplestoreWithFallback(sparqlQuery);
      return this.processResults(response);
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
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
    const response = await axios.post(
      endpoint,
      new URLSearchParams({
        query,
        format: 'json',
        timeout: String(timeoutMs),
      }),
      {
        timeout: timeoutMs,
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
    const response = await axios.get(url.toString(), {
      timeout: timeoutMs,
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
      // Convenience fields used by UI
      out.id = out.subj;
      out.keywords = out.kwu ? out.kwu.split(',').map(k => k.trim()) : [];
      out.resourceType = out.resourceType_u;
      return out;
    });
  }

  // -------------------------
  // Facet Options (for FacetText2 / useFacetOptions)
  // -------------------------

  /**
   * Fetch facet options (distinct values + counts) for a given field
   * currentFilters: other active filters (excluding this field)
   */
  async getFacetOptions(field, currentFilters = {}) {
    const query = this.buildFacetOptionsQuery(field, currentFilters);
    const data = await this.sendToTriplestoreWithFallback(query);
    return this.processFacetOptions(data);
  }

  /**
   * Build a SPARQL query that returns distinct values and their counts for a facet
   */
  buildFacetOptionsQuery(field, currentFilters) {
    const facetConfig = (this.config.FACETS || []).find(f => f.field === field);
    if (!facetConfig) {
      return `
${this.queryBuilder.buildPrefixes()}
SELECT ?value (0 as ?count) WHERE { FILTER(false) } LIMIT 0
`;
    }

    const sparqlProperty =
      facetConfig.sparql_property ||
      this.queryBuilder.getDefaultSparqlProperty(field);

    // Exclude this facet's own filters to avoid self-filtering options
    const filtersCopy = { ...(currentFilters || {}) };
    delete filtersCopy[field];

    let q = '';
    q += this.queryBuilder.buildPrefixes();
    q += `SELECT DISTINCT ?value (COUNT(*) AS ?count)
WHERE {
`;
    // Other active filters
    q += this.queryBuilder.buildFilterFragments(filtersCopy);
    // Base graph pattern (subject, name, description in a graph)
    q += this.queryBuilder.buildBaseGraphPattern();
    // The facet value triple pattern
    q += `  ?subj ${sparqlProperty} ?value .
}
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
