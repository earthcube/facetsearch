/**
 * Server-side facet search over the QLever SPARQL endpoint.
 *
 * Query construction is delegated to the vendored copy of the client's SparqlQueryBuilder
 * (see mcp/vendor/README.md), so MCP clients get the same SPARQL the facet UI sends.
 * Transport and result normalization follow client/src/services/SearchService.js.
 */
const axios = require('axios');
const { getFacetsConfig } = require('./facetsConfig');
const {
  buildSpatialBoundsQuery,
  buildSpatialDetailQuery,
  processSpatialCoverage,
} = require('./spatialCoverage');

let queryBuilderModulePromise = null;

/** The vendored builder is ESM; load it once from CommonJS. */
function loadQueryBuilderModule() {
  if (!queryBuilderModulePromise) {
    queryBuilderModulePromise = import('./vendor/services/SparqlQueryBuilder.js');
  }
  return queryBuilderModulePromise;
}

/** Parse timeout values like 20 or "20s" into milliseconds. */
function parseTimeout(val) {
  if (typeof val === 'number') return val * 1000;
  if (typeof val === 'string') {
    const m = val.match(/^(\d+)\s*s$/i);
    if (m) return parseInt(m[1], 10) * 1000;
    const n = Number(val);
    if (!Number.isNaN(n)) return n * 1000;
  }
  return undefined;
}

/** Split SPARQL GROUP_CONCAT values the same way the client does. */
function splitGroupConcat(value) {
  if (value == null || value === '') return null;
  const elements = String(value).split(/,(?![^(]*\)) /);
  if (elements.length === 1 && elements[0].trim() === '') return null;
  return elements;
}

/** Datasets are addressed by their named graph URN; tools keep the subject IRI. */
function datasetRouteId(row) {
  const subj = row.subj != null ? String(row.subj) : '';
  const rt = row.resourceType_u || row.resourceType;
  if (rt === 'tool') return subj;
  const g = row.g != null ? String(row.g) : '';
  if (g.startsWith('urn:')) return g;
  if (subj.startsWith('urn:')) return subj;
  return subj || g || '';
}

class FacetSearchService {
  constructor(config = getFacetsConfig()) {
    this.config = config;
  }

  usesQLever() {
    return String(this.config.QUERY_ENGINE || '').toLowerCase() === 'qlever';
  }

  async getQueryBuilder() {
    if (!this.queryBuilder) {
      const { createSparqlQueryBuilder } = await loadQueryBuilderModule();
      this.queryBuilder = createSparqlQueryBuilder(this.config);
    }
    this.queryBuilder.config = this.config;
    return this.queryBuilder;
  }

  /** QLever answers GET reliably; POST is the fallback (and the default elsewhere). */
  async sendQuery(query) {
    const endpoint = this.config.TRIPLESTORE_URL;
    const timeoutMs = parseTimeout(this.config.BLAZEGRAPH_TIMEOUT) || 20000;

    if (this.usesQLever()) {
      try {
        return await this.sendGET(endpoint, query, `${timeoutMs}ms`);
      } catch (err) {
        return await this.sendPOST(endpoint, query, timeoutMs);
      }
    }
    return await this.sendPOST(endpoint, query, timeoutMs);
  }

  async sendGET(endpoint, query, timeout) {
    const url = new URL(endpoint);
    url.searchParams.set('query', query);
    const response = await axios.get(url.toString(), {
      timeout: Math.max(parseInt(timeout, 10) + 30000, 120000),
      headers: { Accept: 'application/sparql-results+json' },
    });
    return response.data;
  }

  async sendPOST(endpoint, query, timeoutMs) {
    const response = await axios.post(
      endpoint,
      new URLSearchParams({ query, format: 'json', timeout: String(timeoutMs) }),
      {
        timeout: Math.max(timeoutMs + 30000, 120000),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/sparql-results+json',
        },
      }
    );
    return response.data;
  }

  processResults(response) {
    const bindings = response && response.results && response.results.bindings;
    if (!Array.isArray(bindings)) return [];
    return bindings.map((binding) => {
      const out = {};
      for (const key of Object.keys(binding)) {
        if (binding[key] && binding[key].value !== undefined) {
          out[key] = binding[key].value;
        }
      }
      out.id = datasetRouteId(out);
      if (out.resourceType_u !== undefined && out.resourceType === undefined) {
        out.resourceType = out.resourceType_u;
      }
      for (const field of ['kw', 'placenames', 'disurl']) {
        if (out[field] !== undefined) out[field] = splitGroupConcat(out[field]);
      }
      return out;
    });
  }

  processCount(response) {
    const raw =
      response &&
      response.results &&
      response.results.bindings &&
      response.results.bindings[0] &&
      response.results.bindings[0].count &&
      response.results.bindings[0].count.value;
    const n = parseInt(raw != null ? raw : '0', 10);
    return Number.isNaN(n) ? 0 : n;
  }

  /**
   * One page of results, shaped like a row of the UI result list.
   * Spatial coverage is not projected by the facet query, so it is fetched for the
   * page's subjects in a follow-up query and attached to each row.
   */
  async search(searchParams, options = {}) {
    const builder = await this.getQueryBuilder();
    const sparql = builder.buildQuery(searchParams);
    const response = await this.sendQuery(sparql);
    const results = this.processResults(response);

    if (options.includeSpatialCoverage !== false) {
      const bySubject = await this.spatialCoverageFor(results.map((r) => r.subj));
      for (const row of results) {
        row.spatialCoverage = bySubject.get(row.subj) || null;
      }
    }

    return { sparql, results };
  }

  /**
   * Place names, point bounds and shapes of schema:spatialCoverage for the given subjects.
   * A lookup failure leaves results without spatial coverage rather than failing the search.
   * @param {string[]} subjects - subject IRIs
   * @returns {Promise<Map<string, object>>}
   */
  async spatialCoverageFor(subjects) {
    const boundsQuery = buildSpatialBoundsQuery(subjects);
    const detailQuery = buildSpatialDetailQuery(subjects);
    if (!boundsQuery || !detailQuery) return new Map();
    try {
      const [bounds, detail] = await Promise.all([
        this.sendQuery(boundsQuery),
        this.sendQuery(detailQuery),
      ]);
      return processSpatialCoverage(bounds, detail);
    } catch (err) {
      return new Map();
    }
  }

  /**
   * Total matches for a search.
   * countDistinctSubjects mirrors the UI: distinct datasets once facets are applied.
   */
  async count(searchParams, options = {}) {
    const builder = await this.getQueryBuilder();
    const sparql = builder.buildCountQuery(searchParams, options);
    const response = await this.sendQuery(sparql);
    return { sparql, count: this.processCount(response) };
  }

  /**
   * Distinct values and counts for one facet, excluding that facet's own filters,
   * the same way the sidebar builds its option lists.
   */
  async facetValues(field, searchContext = {}, limit = 200) {
    const builder = await this.getQueryBuilder();
    const facetConfig = (this.config.FACETS || []).find((f) => f.field === field);
    if (!facetConfig) {
      throw new Error(`Unknown facet field: ${field}`);
    }

    const {
      filters = {},
      textQuery = '',
      searchExactMatch = false,
      resourceType = '',
    } = searchContext;
    const otherFilters = Object.assign({}, filters);
    delete otherFilters[field];

    let sparql = builder.buildPrefixes();
    sparql += 'SELECT ?value (COUNT(DISTINCT ?subj) AS ?count)\nWHERE {\n';
    sparql += builder.buildFacetOptionsWhereInner(
      textQuery,
      searchExactMatch,
      resourceType,
      otherFilters
    );
    if (facetConfig.type === 'variablemeasured' || facetConfig.type === 'propertyvalue') {
      sparql += builder.buildPropertyValueNamePattern(field, facetConfig);
    } else {
      const sparqlProperty =
        facetConfig.sparql_property || builder.getDefaultSparqlProperty(field);
      sparql += builder.buildFacetPropertyPattern(field, sparqlProperty);
    }
    sparql += `}\nGROUP BY ?value\nORDER BY DESC(?count) ?value\nLIMIT ${limit}\n`;

    const response = await this.sendQuery(sparql);
    const bindings = (response && response.results && response.results.bindings) || [];
    const values = bindings
      .map((b) => {
        const value = (b.value && b.value.value) || '';
        const count = parseInt((b.count && b.count.value) || '0', 10);
        return { value, count: Number.isNaN(count) ? 0 : count };
      })
      .filter((opt) => opt.value.trim().length > 0);
    return { sparql, values };
  }
}

module.exports = { FacetSearchService, datasetRouteId, splitGroupConcat, parseTimeout };
