import {
  parseQuery,
  ensureParsedTerms,
  parsedHasTerms,
  parseQueryWithExactFlag,
  buildTextSearchBlazegraphGraph,
  buildTextSearchBlockQlever,
  indentSparqlLines,
} from '../utils/queryParser.js';

/**
 * SPARQL Query Builder Service
 * Dynamically constructs SPARQL queries based on active filters and search parameters
 */
export class SparqlQueryBuilder {
  constructor(config) {
    this.config = config;
    this.queryEngine = (config.QUERY_ENGINE || 'blazegraph').toLowerCase();
    this.prefixes = {
      schema: '<https://schema.org/>',
      sschema: '<https://schema.org/>',
      bds: '<http://www.bigdata.com/rdf/search#>',
      ql: '<http://qlever.cs.uni-freiburg.de/builtin-functions/>',
      xsd: '<http://www.w3.org/2001/XMLSchema#>',
      geo:  '<http://www.opengis.net/ont/geosparql#>',
       geof: '<http://www.opengis.net/def/function/geosparql/>',
       sf:   '<http://www.opengis.net/ont/sf#>'
    };
  }
    /**
     * Basic engine check
     * needs to be some utility code shared.
     */
    usesQLever() {
        return String(this.config?.QUERY_ENGINE || '').toLowerCase() === 'qlever';
    }
  resolveLimit(limit) {
    return limit != null && limit !== ''
      ? Number(limit)
      : Number(this.config?.LIMIT_DEFAULT ?? 10);
  }

  /**
   * Build complete SPARQL query from search parameters and filters
   */
  buildQuery(searchParams) {
    const { textQuery, searchExactMatch, resourceType, filters, limit, offset = 0 } = searchParams;
    const effectiveLimit = this.resolveLimit(limit);

    let query = this.buildPrefixes();
    query += this.buildSelectClause();
    query += this.buildWhereClause(textQuery, searchExactMatch, resourceType, filters, effectiveLimit, offset);
    query += this.buildGroupbyClause();
    query += this.buildOrderByClause();

    if (!this.usesQLever()) {
      query += this.buildLimitClause(effectiveLimit, offset);
    }

    return query;
  }

  /**
   * Total matches for the current search (without LIMIT).
   * @param {object} searchParams
   * @param {{ countDistinctSubjects?: boolean }} [options]
   *   - countDistinctSubjects false (default): distinct result rows (?g ?subj ?name ?description ?type), matches pre-filter search total
   *   - countDistinctSubjects true: distinct datasets (?subj), matches facet sidebar counts
   */
  buildCountQuery(searchParams, options = {}) {
    const { textQuery, searchExactMatch, resourceType, filters, limit } = searchParams;
    const countDistinctSubjects = options.countDistinctSubjects === true;

    let query = this.buildPrefixes();

    if (this.usesQLever()) {
      const body = this.buildFacetCountWhereBody(textQuery, searchExactMatch, resourceType, filters);
      query += 'SELECT (COUNT(DISTINCT ?subj) AS ?count) WHERE {\n';
      query += body;
      query += '}\n';
      return query;
    }

    const needsCardMetadata = this.filtersNeedCardMetadata(filters);
    const effectiveLimit = this.resolveLimit(limit);
    const whereClause = this.buildWhereClause(
      textQuery, searchExactMatch, resourceType, filters,
      effectiveLimit, 0, { skipCardMetadata: !needsCardMetadata }
    );
    const innerWhere = whereClause.slice('WHERE {\n'.length, -'\n}\n'.length);

    if (countDistinctSubjects) {
      query += 'SELECT (COUNT(DISTINCT ?subj) AS ?count) WHERE {\n';
      query += innerWhere;
      query += '}\n';
      return query;
    }

    query += 'SELECT (COUNT(*) AS ?count) WHERE {\n';
    query += '  {\n';
    query += '    SELECT DISTINCT ?g ?subj ?name ?description ?type\n';
    query += '    WHERE {\n';
    query += innerWhere;
    query += '    }\n';
    query += '  }\n';
    query += '}\n';
    return query;
  }

  /** True when active filters require OPTIONAL card fields (keywords, publisher, ranges, etc.). */
  filtersNeedCardMetadata(filters) {
    if (!filters || typeof filters !== 'object') return false;
    return Object.keys(filters).some((field) => {
      const cfg = this.getFacetConfig(field);
      if (!cfg) return false;
      if (cfg.type === 'geo') return false;
      return true;
    });
  }

  buildPrefixes() {
    return Object.entries(this.prefixes)
      .map(([prefix, uri]) => `PREFIX ${prefix}: ${uri}`)
      .join('\n') + '\n\n';
  }

    buildSelecMinMaxClause(_minMaxVars) {
// future
        return ''
    }
  buildSelectClause() {
    return (
      `SELECT ?g ?subj ?name ?description\n` +
      `  (SAMPLE(?datep_raw) AS ?datep)\n` +
      `  (GROUP_CONCAT(DISTINCT ?pubname_raw; SEPARATOR=", ") AS ?pubname)\n` +
      `  (SAMPLE(?temporalCoverage_raw) AS ?temporalCoverage)\n` +
      `  (GROUP_CONCAT(DISTINCT ?url1; SEPARATOR=", ") AS ?disurl)\n` +
      `  (GROUP_CONCAT(DISTINCT ?placename; SEPARATOR=", ") AS ?placenames)\n` +
      `  (GROUP_CONCAT(DISTINCT ?kwu; SEPARATOR=", ") AS ?kw)\n` +
      `  (GROUP_CONCAT(DISTINCT ?resourceType_u; SEPARATOR=", ") AS ?resourceType)\n` +
      `  (MAX(?maxDepth_raw) AS ?maxDepth)\n` +
      `  (MIN(?minDepth_raw) AS ?minDepth)\n`
    );
  }

  buildWhereClause(textQuery, searchExactMatch, resourceType, filters, limit = 10, offset = 0, options = {}) {
    const skipCardMetadata = options.skipCardMetadata === true;
    let whereClause = 'WHERE {\n';

    // QLever full-text must follow public/queries/qlever/sparql_query.rq: constrain ?subj as
    // Dataset, then ?subj ?o ?item + ql:contains-entity + ql:contains-word, then GRAPH ?g { name, desc }.
    const qleverFullText = this.usesQLever() && textQuery;
    const useDepthCandidateSubquery =
      this.usesQLever() &&
      qleverFullText &&
      this.filtersNeedDepthVariableMeasured(filters);
    const useTextCandidateSubquery =
      this.usesQLever() &&
      qleverFullText &&
      !useDepthCandidateSubquery &&
      this.qleverNeedsTextCandidateSubquery(textQuery, searchExactMatch);

    if (useDepthCandidateSubquery) {
      whereClause += this.buildQleverDepthCandidateSubquery(
        textQuery, searchExactMatch, resourceType, filters, limit, offset
      );
      if (!skipCardMetadata) {
        whereClause += this.buildOptionalProperties();
        whereClause += this.buildResourceTypeDecoration();
        whereClause += this.buildBindings();
      }
      whereClause += this.buildFilterFragments(filters, {
        rangePlacement: 'late',
        skipRangedepth: true,
      });
      whereClause += '}\n';
      return whereClause;
    }

    if (useTextCandidateSubquery) {
      whereClause += this.buildQleverTextCandidateSubquery(
        textQuery, searchExactMatch, resourceType, filters, limit, offset
      );
      if (!skipCardMetadata) {
        whereClause += this.buildOptionalProperties();
        whereClause += this.buildResourceTypeDecoration();
        whereClause += this.buildBindings();
      }
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'late' });
      whereClause += '}\n';
      return whereClause;
    }

    if (qleverFullText) {
      whereClause += this.buildQleverInlineTextSubquery(
        textQuery, searchExactMatch, resourceType, filters, limit, offset
      );
      whereClause += this.buildOptionalProperties();
      if (this.filtersNeedDepthVariableMeasured(filters)) {
        whereClause += this.buildOptionalDepthVariableMeasured();
      }
      whereClause += this.buildResourceTypeDecoration();
      whereClause += this.buildBindings();
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'late' });
      whereClause += '}\n';
      return whereClause;
    }

    if (this.isQleverBrowseMode(textQuery)) {
      whereClause += this.buildQleverBrowseSubquery(resourceType, filters, limit, offset);
      whereClause += `  GRAPH ?g {\n    ?subj schema:name|sschema:name ?name .\n    ?subj schema:description|sschema:description ?description .\n  }\n`;
      whereClause += this.buildOptionalProperties();
      whereClause += this.buildResourceTypeDecoration();
      whereClause += this.buildBindings();
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'late' });
      whereClause += '}\n';
      return whereClause;
    }

    // Blazegraph paths — outer LIMIT/OFFSET applied in buildQuery
    whereClause += this.buildFilterFragments(filters, { rangePlacement: 'early' });
    if (textQuery) {
      whereClause += this.buildTextSearchFragment(textQuery, searchExactMatch);
    }
    whereClause += this.buildBaseGraphPattern();
    whereClause += this.buildResourceTypeConstraints(resourceType);

    // Standalone range constraints once ?subj is narrowed (FILTER EXISTS — not late FILTER on OPTIONAL binds).
    whereClause += this.buildConstraintRangeFragments(filters);

    if (!skipCardMetadata) {
      whereClause += this.buildOptionalProperties();
      if (this.filtersNeedDepthVariableMeasured(filters)) {
        whereClause += this.buildOptionalDepthVariableMeasured();
      }
      whereClause += this.buildBindings();
    } else if (this.filtersNeedDepthVariableMeasured(filters)) {
      whereClause += this.buildOptionalDepthVariableMeasured();
    }
    // Range filters use ?temporalCoverage (OPTIONAL), ?datep (BIND), ?maxDepth/?minDepth (depth OPTIONAL); must run after those bind.
    whereClause += this.buildFilterFragments(filters, { rangePlacement: 'late' });

    whereClause += '}\n';
    return whereClause;
  }

  /**
   * Flat WHERE body for facet option count queries.
   * Never wraps in an inner SELECT/LIMIT subquery — facet counts must span all matching subjects,
   * not just the first page of results.
   */
  buildFacetCountWhereBody(textQuery, searchExactMatch, resourceType, filters) {
    if (this.usesQLever()) {
      if (textQuery) {
        let body = '';
        body += this.buildQleverSelectiveSubjectSubquery(resourceType, filters);
        body += this.buildTextSearchFragment(textQuery, searchExactMatch);
        body += this.buildFilterFragments(filters, { rangePlacement: 'late' });
        return body;
      }
      let body = '';
      body += this.buildQleverBrowseTypeValues();
      if (resourceType && resourceType !== 'all') {
        body += `  FILTER(?resourceType_u = "${this.escapeValue(resourceType)}")\n`;
      }
      body += this.buildFilterFragments(filters, { rangePlacement: 'early' });
      body += this.buildConstraintRangeFragments(filters);
      body += this.buildFilterFragments(filters, { rangePlacement: 'late' });
      return body;
    }

    const whereClause = this.buildWhereClause(
      textQuery, searchExactMatch, resourceType, filters
    );
    const prefix = 'WHERE {\n';
    const suffix = '\n}\n';
    if (whereClause.startsWith(prefix) && whereClause.endsWith(suffix)) {
      return whereClause.slice(prefix.length, -suffix.length);
    }
    return whereClause;
  }

  /** Inner WHERE body for facet option counts. */
  buildFacetOptionsWhereInner(textQuery, searchExactMatch, resourceType, filters) {
    return this.buildFacetCountWhereBody(textQuery, searchExactMatch, resourceType, filters);
  }

  /** Normalized bounds of the active geo facet filter, or null. */
  getActiveGeoBounds(filters) {
    if (!filters || typeof filters !== 'object') return null;
    for (const [field, values] of Object.entries(filters)) {
      const cfg = this.getFacetConfig(field);
      if (cfg?.type !== 'geo' || !values) continue;
      const b = this.normalizeGeoBounds(values?.bounds || values);
      if (b) return b;
    }
    return null;
  }

  /**
   * Lightweight per-dataset locations projection for the map explorer.
   * Inner subquery narrows candidate ?subj (type + text + filters, incl. the
   * bbox via buildGeoFilter) to at most `limit` subjects BEFORE walking their
   * geo nodes — a dataset can carry very many GeoCoordinates. The outer walk
   * re-applies the bbox so the SAMPLE point stays inside the viewport; lat and
   * lon are SAMPLEd independently, so the marker is a representative point
   * (each coordinate individually in-bbox), not necessarily one source point.
   */
  buildLocationsQuery(searchParams) {
    const { textQuery, searchExactMatch, resourceType, filters = {}, limit } = searchParams || {};
    const n = Number(limit);
    const effectiveLimit = Number.isFinite(n) && n > 0 ? Math.min(n, 5000) : 1000;
    const bounds = this.getActiveGeoBounds(filters);

    let inner = '';
    if (textQuery) {
      // Selective-subject subquery first, full text on the narrowed set after:
      // a flat join of text search with geo/range constraints takes QLever ~10x
      // longer (measured: 40s vs 4s on text + bbox + temporal).
      inner += this.buildQleverSelectiveSubjectSubquery(resourceType, filters);
      inner += this.buildTextSearchFragment(textQuery, searchExactMatch);
    } else {
      inner += this.buildSubjDatasetHead();
      inner += this.buildResourceTypeConstraints(resourceType);
      inner += this.buildFilterFragments(filters, { rangePlacement: 'early' });
      inner += this.buildConstraintRangeFragments(filters);
    }
    if (!bounds) {
      // No viewport yet: still require coordinates, so the candidate LIMIT is
      // spent only on datasets that can actually appear on the map.
      inner += `  ?subj schema:spatialCoverage|sschema:spatialCoverage ?spatialCov0 .
  ?spatialCov0 schema:geo|sschema:geo ?geo0 .
  ?geo0 schema:latitude|sschema:latitude ?lat0 .
`;
    }

    const outerBboxFilter = bounds
      ? `  FILTER(${this.buildGeoBoundsFilterExpr(bounds)}) .\n`
      : '';

    let query = this.buildPrefixes();
    query += `SELECT ?g ?subj (SAMPLE(?name_r) AS ?name) (SAMPLE(?lat) AS ?lat_s) (SAMPLE(?lon) AS ?lon_s)
WHERE {
  {
    SELECT DISTINCT ?subj WHERE {
${indentSparqlLines(inner, 4)}    }
    LIMIT ${effectiveLimit}
  }
  ?subj schema:spatialCoverage|sschema:spatialCoverage ?sc .
  ?sc schema:geo|sschema:geo ?geo .
  ?geo schema:latitude|sschema:latitude ?lat .
  ?geo schema:longitude|sschema:longitude ?lon .
${outerBboxFilter}  GRAPH ?g { ?subj schema:name|sschema:name ?name_r . }
}
GROUP BY ?g ?subj
`;
    return query;
  }

  /**
   * Innermost subquery: narrow ?subj with type + facet + range EXISTS constraints
   * before broad full-text expansion (earthcube/facetsearch#261).
   */
  buildQleverSelectiveSubjectSubquery(resourceType, filters, options = {}) {
    const { skipRangedepth = false } = options;
    let body = '';
    body += this.buildSubjDatasetHead();
    body += this.buildResourceTypeConstraints(resourceType);
    body += this.buildFilterFragments(filters, { rangePlacement: 'early' });
    body += this.buildConstraintRangeFragments(filters, { skipRangedepth });
    const inner = indentSparqlLines(body, 4);
    return `  {
    SELECT DISTINCT ?subj
    WHERE {
${inner}
    }
  }
`;
  }

  /**
   * QLever text search core: selective subjects first, then broad FTS, then GRAPH decoration.
   */
  buildQleverNestedTextSearchCore(textQuery, searchExactMatch, resourceType, filters, options = {}) {
    const { skipRangedepth = false, includeGraph = true } = options;
    let block = '';
    block += this.buildQleverSelectiveSubjectSubquery(resourceType, filters, { skipRangedepth });
    block += this.buildTextSearchFragment(textQuery, searchExactMatch);
    if (includeGraph) {
      block += this.buildGraphNameDescOnly();
      // Re-bind ?type for inner SELECT projection (type filter lives in selective subquery above).
      block += this.buildResourceTypeConstraints(resourceType);
    }
    return block;
  }

  /** Populate ?resourceType_u in the outer query for GROUP_CONCAT display. */
  buildResourceTypeDecoration() {
    return `  OPTIONAL {
    ?subj a ?t .
    VALUES (?t ?resourceType_u) {
      (schema:Dataset "data")
      (sschema:Dataset "data")
      (schema:SoftwareApplication "tool")
      (sschema:SoftwareApplication "tool")
      (schema:DataCatalog "DataCatalog")
      (sschema:DataCatalog "DataCatalog")
    }
  }

`;
  }

  /** Dataset type for ?subj (outside GRAPH), matches QLever sparql_query.rq */
  buildSubjDatasetHead() {
    return `  VALUES ?sosType {
    sschema:Dataset
    schema:Dataset
  }
  ?subj a ?sosType .
`;
  }

  /** Name + description only inside GRAPH ?g (type triples already in buildSubjDatasetHead) */
  buildGraphNameDescOnly() {
    return `  GRAPH ?g {
    ?subj schema:name|sschema:name ?name .
    ?subj schema:description|sschema:description ?description .
  }
`;
  }

  /**
   * Use structured token queries when: explicit ` or `, Exact match on, or multiple tokens (loose = OR tokens).
   * Single-token + Exact off keeps legacy one-string behavior (QLever phrase / Blazegraph matchAllTerms).
   */
  shouldUseStructuredTextSearch(textQuery, searchExactMatch) {
    const raw = String(textQuery || '').trim();
    if (!raw) return false;
    if (/\s+or\s+/i.test(raw)) return true;
    if (searchExactMatch) return true;
    const pq = parseQuery(raw);
    if (pq.AND.length > 1) return true;
    if (pq.OR_GROUPS && pq.OR_GROUPS.length > 0) return true;
    return false;
  }

  buildTextSearchFragment(textQuery, searchExactMatch) {
    const raw = String(textQuery || '').trim();
    if (!raw) return '';

    if (this.queryEngine === 'blazegraph') {
      if (this.shouldUseStructuredTextSearch(textQuery, searchExactMatch)) {
        let parsed = parseQueryWithExactFlag(raw, searchExactMatch);
        if (!parsedHasTerms(parsed)) parsed = ensureParsedTerms(raw, parsed);
        const block = buildTextSearchBlazegraphGraph(parsed);
        if (block) return `${block}\n`;
      }
      const q = this.escapeValue(raw);
      const exactStr = searchExactMatch ? 'true' : 'false';
      return `  ?lit bds:search "${q}" .
  ?lit bds:matchAllTerms "${exactStr}" .
  ?lit bds:relevance ?score1 .
  GRAPH ?g { ?subj ?p ?lit . }
`;
    }

    // QLever
    if (this.shouldUseStructuredTextSearch(textQuery, searchExactMatch)) {
      let parsed = parseQueryWithExactFlag(raw, searchExactMatch);
      if (!parsedHasTerms(parsed)) parsed = ensureParsedTerms(raw, parsed);
      const block = buildTextSearchBlockQlever(parsed);
      if (block) return `${indentSparqlLines(block, 2)}\n`;
    }

    const q = this.escapeValue(raw);
    return `  ?subj ?o ?item .
  ?text ql:contains-entity ?item .
  ?text ql:contains-word "${q}" .
`;
  }

  /**
   * @param {Record<string, unknown>} filters
   * @param {{ rangePlacement?: 'all' | 'early' | 'late'; skipRangedepth?: boolean }} [options]
   */
  buildFilterFragments(filters, options = {}) {
    const rangePlacement = options.rangePlacement ?? 'all';
    const skipRangedepth = options.skipRangedepth === true;
    const isRangeFacet = (type) =>
      type === 'range' || type === 'rangeyear' || type === 'rangedepth';

    if (!filters || Object.keys(filters).length === 0) {
      return '';
    }

    let fragments = '';

    Object.entries(filters).forEach(([field, values]) => {
      const facetConfig = this.getFacetConfig(field);
      if (!facetConfig || !values || (Array.isArray(values) && values.length === 0)) return;
      if (skipRangedepth && facetConfig.type === 'rangedepth') return;

      const range = isRangeFacet(facetConfig.type);
      if (rangePlacement === 'early' && range) return;
      if (rangePlacement === 'late' && !range) return;

      switch (facetConfig.type) {
        case 'text':
          fragments += this.buildTextFilter(field, Array.isArray(values) ? values : [values], facetConfig);
          break;
        case 'variablemeasured':
        case 'propertyvalue':
          fragments += this.buildPropertyValueNameFilter(field, Array.isArray(values) ? values : [values], facetConfig);
          break;
        case 'range':
        case 'rangeyear':
        case 'rangedepth':
          break;
        case 'geo':
          fragments += this.buildGeoFilter(field, values, facetConfig);
          break;
        default:
          fragments += this.buildGenericFilter(field, Array.isArray(values) ? values : [values], facetConfig);
      }
    });

    return fragments;
  }

  /**
   * Standalone range constraints (FILTER EXISTS) applied after ?subj is bound by text/graph.
   * Satisfies "filters as explicit, self-contained blocks" without a heavy required join before full-text.
   */
  buildConstraintRangeFragments(filters, { skipRangedepth = false } = {}) {
    if (!filters || Object.keys(filters).length === 0) {
      return '';
    }

    let fragments = '';
    Object.entries(filters).forEach(([field, values]) => {
      const facetConfig = this.getFacetConfig(field);
      if (!facetConfig || !values || (Array.isArray(values) && values.length === 0)) return;

      switch (facetConfig.type) {
        case 'range':
        case 'rangeyear':
          fragments += this.buildRangeFilterExists(field, values, facetConfig);
          break;
        case 'rangedepth':
          if (!skipRangedepth) fragments += this.buildDepthFilterExists(field, values, facetConfig);
          break;
        default:
          break;
      }
    });

    return fragments;
  }

  buildRangedepthFilterFragments(filters) {
    if (!filters || typeof filters !== 'object') return '';
    let fragments = '';
    Object.entries(filters).forEach(([field, values]) => {
      const facetConfig = this.getFacetConfig(field);
      if (!facetConfig || facetConfig.type !== 'rangedepth') return;
      if (!values || (Array.isArray(values) && values.length < 2)) return;
      fragments += this.buildDepthFilter(field, values, facetConfig);
    });
    return fragments;
  }

  /**
   * Structured multi-token QLever text (OR/AND branches) needs an inner candidate
   * subquery to avoid memory blow-ups (see earthcube/facetsearch#250).
   */
  qleverNeedsTextCandidateSubquery(textQuery, searchExactMatch) {
    return this.shouldUseStructuredTextSearch(textQuery, searchExactMatch);
  }

  /** QLever full-text core: selective subjects, then text + graph (no OPTIONAL explosion). */
  buildQleverFullTextCore(textQuery, searchExactMatch, resourceType, filters) {
    return this.buildQleverNestedTextSearchCore(
      textQuery, searchExactMatch, resourceType, filters, { skipRangedepth: true }
    );
  }

  /** QLever full-text + depth: nested text/graph, then OPTIONAL depth + overlap FILTER inside candidate subquery. */
  buildQleverFullTextCoreForDepthSubquery(textQuery, searchExactMatch, resourceType, filters) {
    let block = this.buildQleverFullTextCore(
      textQuery,
      searchExactMatch,
      resourceType,
      filters
    );
    block += this.buildDepthVariableMeasured({ required: false });
    block += this.buildRangedepthFilterFragments(filters);
    return block;
  }

  /** Inner SELECT DISTINCT: shrink ?subj set before optional explosion (QLever + multi-token text). */
  buildQleverTextCandidateSubquery(textQuery, searchExactMatch, resourceType, filters, limit, offset) {
    const core = this.buildQleverFullTextCore(
      textQuery,
      searchExactMatch,
      resourceType,
      filters
    );
    const inner = indentSparqlLines(core, 4);
    return `  {
    SELECT DISTINCT ?g ?subj ?name ?description ?type ?maxDepth_raw ?minDepth_raw
    WHERE {
${inner}
    }
    LIMIT ${limit}
    OFFSET ${offset}
  }
`;
  }

  /** Inner SELECT DISTINCT: shrink ?subj set before optional explosion (QLever + text + depth). */
  buildQleverDepthCandidateSubquery(textQuery, searchExactMatch, resourceType, filters, limit, offset) {
    const core = this.buildQleverFullTextCoreForDepthSubquery(
      textQuery,
      searchExactMatch,
      resourceType,
      filters
    );
    const inner = indentSparqlLines(core, 4);
    return `  {
    SELECT DISTINCT ?g ?subj ?name ?description ?type ?maxDepth_raw ?minDepth_raw
    WHERE {
${inner}
    }
    LIMIT ${limit}
    OFFSET ${offset}
  }
`;
  }

  /** Inner SELECT DISTINCT with pagination for single-token QLever text search. */
  buildQleverInlineTextSubquery(textQuery, searchExactMatch, resourceType, filters, limit, offset) {
    const core = this.buildQleverNestedTextSearchCore(
      textQuery, searchExactMatch, resourceType, filters, { skipRangedepth: true }
    );
    const inner = indentSparqlLines(core, 4);
    return `  {
    SELECT DISTINCT ?g ?subj ?name ?description ?type
    WHERE {
${inner}
    }
    LIMIT ${limit}
    OFFSET ${offset}
  }
`;
  }

  isQleverBrowseMode(textQuery) {
    return this.usesQLever() && !textQuery;
  }

  buildQleverBrowseTypeValues() {
    return `  VALUES (?type ?resourceType_u) {
    (schema:Dataset             "data")
    (schema:DataCatalog         "DataCatalog")
    (schema:SoftwareApplication "tool")
  }
  ?subj a ?type .\n`;
  }

  /** Inner SELECT DISTINCT with pagination for QLever browse (no text search). */
  buildQleverBrowseSubquery(resourceType, filters, limit, offset) {
    const typeFilter =
      resourceType && resourceType !== 'all'
        ? `      FILTER(?resourceType_u = "${this.escapeValue(resourceType)}")\n`
        : '';
    const textFilters = indentSparqlLines(
      this.buildFilterFragments(filters, { rangePlacement: 'early' }), 2
    );
    const rangeConstraints = indentSparqlLines(
      this.buildConstraintRangeFragments(filters, { skipRangedepth: true }), 2
    );
    const typeValues = indentSparqlLines(this.buildQleverBrowseTypeValues(), 2);
    return `  {
    SELECT DISTINCT ?subj ?resourceType_u
    WHERE {
${typeValues}${typeFilter}${textFilters}${rangeConstraints}    }
    LIMIT ${limit}
    OFFSET ${offset}
  }
`;
  }

  buildTextFilter(field, values, facetConfig) {
    const sparqlProperty = facetConfig.sparql_property || this.getDefaultSparqlProperty(field);

    // Multi-step paths (e.g. "schema:publisher/schema:name|schema:publisher/schema:legalName")
    // are split into two explicit triples so QLever avoids alternation-of-sequences in subqueries.
    if (sparqlProperty.includes('/')) {
      const alternatives = sparqlProperty.split('|').map(s => s.trim());
      const firstStep = alternatives[0].split('/')[0];
      const secondSteps = [...new Set(alternatives.map(alt => alt.split('/').slice(1).join('/')))];
      const nodeVar = `${field}_node`;
      const secondPath = secondSteps.join('|');
      if (values.length === 1) {
        return `  ?subj ${firstStep} ?${nodeVar} .\n  ?${nodeVar} ${secondPath} "${this.escapeValue(values[0])}" .\n`;
      }
      const varName = `${field}_fv`;
      const inList = values.map(v => `"${this.escapeValue(v)}"`).join(', ');
      return `  ?subj ${firstStep} ?${nodeVar} .\n  ?${nodeVar} ${secondPath} ?${varName} .\n  FILTER(?${varName} IN (${inList})) .\n`;
    }

    if (values.length === 1) {
      return `  ?subj ${sparqlProperty} "${this.escapeValue(values[0])}" .\n`;
    }
    const varName = `${field}_fv`;
    const inList = values.map(v => `"${this.escapeValue(v)}"`).join(', ');
    return `  ?subj ${sparqlProperty} ?${varName} .\n  FILTER(?${varName} IN (${inList})) .\n`;
  }

  buildRangeFilterExists(field, values, _facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const fMin = Math.min(Number(values[0]), Number(values[1]));
    const fMax = Math.max(Number(values[0]), Number(values[1]));
    if (!Number.isFinite(fMin) || !Number.isFinite(fMax)) return '';

    if (field === 'datep' || field === 'datePublished') {
      return `  FILTER EXISTS {
    ?subj schema:datePublished|sschema:datePublished|schema:dateCreated|sschema:dateCreated|schema:dateModified|sschema:dateModified ?datep_f .
    FILTER(xsd:integer(SUBSTR(STR(?datep_f), 1, 4)) >= ${fMin} &&
           xsd:integer(SUBSTR(STR(?datep_f), 1, 4)) <= ${fMax})
  } .\n`;
    }

    // schema:temporalCoverage is often an ISO interval ("2015-01-01/2018-12-31").
    // True overlap test (dataset start <= filter max && dataset end >= filter min),
    // like the depth facet, so a 1990-2020 dataset matches a 2010-2015 filter.
    // Open ends ("2015-01-01/.." or "../2020") fail the xsd:integer cast, leaving
    // the year unbound; COALESCE substitutes an unbounded sentinel on that side.
    return `  FILTER EXISTS {
    ?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage_f .
    BIND(STR(?temporalCoverage_f) AS ?tc_str)
    BIND(IF(CONTAINS(?tc_str, "/"), STRBEFORE(?tc_str, "/"), ?tc_str) AS ?tc_startStr)
    BIND(IF(CONTAINS(?tc_str, "/"), STRAFTER(?tc_str, "/"), "") AS ?tc_endStr)
    BIND(xsd:integer(SUBSTR(?tc_startStr, 1, 4)) AS ?tc_startYear)
    BIND(xsd:integer(SUBSTR(?tc_endStr, 1, 4)) AS ?tc_endYear)
    BIND(COALESCE(?tc_startYear, 0) AS ?tc_s)
    BIND(IF(CONTAINS(?tc_str, "/"), COALESCE(?tc_endYear, 9999), COALESCE(?tc_endYear, ?tc_startYear)) AS ?tc_e)
    FILTER((BOUND(?tc_startYear) || BOUND(?tc_endYear)) && ?tc_s <= ${fMax} && ?tc_e >= ${fMin})
  } .\n`;
  }

  /**
   * QLever-only word completion for the landing search box.
   * Wildcard ql:contains-word binds the matched word to the special variable
   * ?ql_matchingword_<textVar>_<token>, so the prefix must stay [a-z0-9]
   * (also prevents SPARQL injection). Returns null when unsupported.
   */
  buildAutocompleteQuery(prefix, limit = 10) {
    const p = String(prefix || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (p.length < 3 || !this.usesQLever()) return null;
    return `${this.buildPrefixes()}SELECT ?word (COUNT(?text) AS ?count) WHERE {
  ?text ql:contains-word "${p}*" .
  BIND(?ql_matchingword_text_${p} AS ?word)
}
GROUP BY ?word
ORDER BY DESC(?count)
LIMIT ${Number(limit) > 0 ? Number(limit) : 10}
`;
  }

  /**
   * Depth overlap after buildOptionalDepthVariableMeasured (?minDepth / ?maxDepth bound).
   * Uses ABS so UI positive depths match RDF values stored as negative meters.
   */
  buildDepthFilter(_field, values, _facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const fMin = Math.min(Number(values[0]), Number(values[1]));
    const fMax = Math.max(Number(values[0]), Number(values[1]));
    if (!Number.isFinite(fMin) || !Number.isFinite(fMax)) return '';

    return `  FILTER(
    BOUND(?maxDepth_raw) && BOUND(?minDepth_raw) &&
    IF(ABS(xsd:float(?minDepth_raw)) < ABS(xsd:float(?maxDepth_raw)), ABS(xsd:float(?maxDepth_raw)), ABS(xsd:float(?minDepth_raw))) >= ${fMin} &&
    IF(ABS(xsd:float(?minDepth_raw)) < ABS(xsd:float(?maxDepth_raw)), ABS(xsd:float(?minDepth_raw)), ABS(xsd:float(?maxDepth_raw))) <= ${fMax}
  ) .\n`;
  }

  buildDepthFilterExists(_field, values, _facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const fMin = Math.min(Number(values[0]), Number(values[1]));
    const fMax = Math.max(Number(values[0]), Number(values[1]));
    if (!Number.isFinite(fMin) || !Number.isFinite(fMax)) return '';

    return `  FILTER EXISTS {
    ?subj schema:variableMeasured|sschema:variableMeasured ?vm_depth .
    VALUES ?depthType { schema:PropertyValue sschema:PropertyValue }
    ?vm_depth a ?depthType .
    ?vm_depth schema:name|sschema:name ?depthPropertyName .
    FILTER(
      CONTAINS(LCASE(STR(?depthPropertyName)), "depth") ||
      LCASE(STR(?depthPropertyName)) = "cmpdep"
    ) .
    ?vm_depth schema:maxValue|sschema:maxValue ?maxDepth_f .
    ?vm_depth schema:minValue|sschema:minValue ?minDepth_f .
    BIND(ABS(xsd:float(?minDepth_f)) AS ?absMinDepth)
    BIND(ABS(xsd:float(?maxDepth_f)) AS ?absMaxDepth)
    BIND(IF(?absMinDepth < ?absMaxDepth, ?absMinDepth, ?absMaxDepth) AS ?dsDepthShallow)
    BIND(IF(?absMinDepth < ?absMaxDepth, ?absMaxDepth, ?absMinDepth) AS ?dsDepthDeep)
    FILTER(?dsDepthDeep >= ${fMin} && ?dsDepthShallow <= ${fMax})
  } .\n`;
  }

  buildGeoFilter(_field, values, _facetConfig) {
    // Accept either { bounds: {...} } or direct { north, south, east, west }.
    const b = this.normalizeGeoBounds(values?.bounds || values);
    if (!b) return '';
// SEE WIKI https://github.com/earthcube/facetsearch/wiki/spatial
    // BIND("POLYGON((28 -145, 40 -145, 40 -116, 28 -116, 28 -145))"^^geo:wktLiteral as ?geom1)
    // long-lat (X-Y) order (same as inserted data)
    // return `  ?subj geo:hasGeometry ?geom .
    //   ?geom geo:asWKT ?wkt .
    // BIND("POLYGON((${b.west} ${b.south}, ${b.west} ${b.north} ,${b.east} ${b.north} , ${b.east} ${b.south}, ${b.west} ${b.south}))"^^geo:wktLiteral as ?geom1) .
    // FILTER(geof:distance(?wkt,?bbox) <= 180)
    // `;
    // geof:sfContainsideal query, but not yet supported
    // return `     ?geom geo:asWKT ?wkt .
    // BIND("POLYGON((${b.west} ${b.south}, ${b.west} ${b.north} ,${b.east} ${b.north} , ${b.east} ${b.south}, ${b.west} ${b.south}))"^^geo:wktLiteral as ?geom1) .
    // FILTER (geof:sfContains(?geom1, ?wkt)) .
    // `;

    //there can be 1000 points.  use the Inserted WKT method above
    return `  ?subj schema:spatialCoverage|sschema:spatialCoverage ?spatialCov .
      ?spatialCov schema:geo|sschema:geo ?geo .
      ?geo schema:latitude|sschema:latitude ?lat .
      ?geo schema:longitude|sschema:longitude ?lon .
      FILTER(${this.buildGeoBoundsFilterExpr(b)}) .
    `;
  }

  /** Boolean bbox expression over ?lat/?lon for already-normalized bounds. */
  buildGeoBoundsFilterExpr(b) {
    const latFilter = `?lat >= ${b.south} && ?lat <= ${b.north}`;
    let lonFilter;
    if (b.west > b.east) {
      // Dateline-crossing box: the region wraps around ±180°.
      // Split into two longitude ranges so the SPARQL filter is correct.
      lonFilter = `((?lon >= ${b.west} && ?lon <= 180) || (?lon >= -180 && ?lon <= ${b.east}))`;
    } else {
      lonFilter = `?lon >= ${b.west} && ?lon <= ${b.east}`;
    }
    return `${latFilter} && ${lonFilter}`;
  }

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
    if (n < s) [n, s] = [s, n];
    // Do NOT swap east/west: when west > east the box crosses the dateline and
    // buildGeoFilter will emit a split longitude filter.
    if (n === s || e === w) return null;
    return { north: n, south: s, east: e, west: w };
  }

  /**
   * Generic filter for any schema property that points to a PropertyValue node,
   * matching on schema:name using CONTAINS (case-insensitive).
   *
   * The SPARQL property path is taken from facetConfig.sparql_property; it defaults
   * to schema:variableMeasured so that "variableMeasured" facets work out of the box.
   * Other PropertyValue relationships (e.g. schema:measurementTechnique) can be
   * supported by adding a new facet entry in config with the desired sparql_property.
   *
   * Values are sanitized via escapeValue (backslash and double-quote escaping).
   */
  buildPropertyValueNameFilter(field, values, facetConfig) {
    if (!Array.isArray(values) || values.length === 0) return '';
    const pvProperty =
      facetConfig?.sparql_property || 'schema:variableMeasured|sschema:variableMeasured';
    const nodeVar = `${field}_pv`;
    const typeVar = `${field}_pvType`;
    const nameVar = `${field}_pvName`;
    const containsExprs = values
      .map(v => `CONTAINS(LCASE(STR(?${nameVar})), LCASE("${this.escapeValue(v)}"))`)
      .join(' || ');
    return `  ?subj ${pvProperty} ?${nodeVar} .
  VALUES ?${typeVar} { schema:PropertyValue sschema:PropertyValue }
  ?${nodeVar} a ?${typeVar} .
  ?${nodeVar} schema:name|sschema:name ?${nameVar} .
  FILTER(${containsExprs}) .\n`;
  }

  /**
   * Triple pattern that binds ?value to distinct PropertyValue names for facet option lists.
   * Uses facetConfig.sparql_property (defaults to schema:variableMeasured).
   */
  buildPropertyValueNamePattern(field, facetConfig) {
    const pvProperty =
      facetConfig?.sparql_property || 'schema:variableMeasured|sschema:variableMeasured';
    const nodeVar = `${field}_pv_opt`;
    const typeVar = `${field}_pvType_opt`;
    return `  ?subj ${pvProperty} ?${nodeVar} .
  VALUES ?${typeVar} { schema:PropertyValue sschema:PropertyValue }
  ?${nodeVar} a ?${typeVar} .
  ?${nodeVar} schema:name|sschema:name ?value .\n`;
  }

  buildGenericFilter(field, values, facetConfig) {
    const sparqlProperty = facetConfig.sparql_property || this.getDefaultSparqlProperty(field);
    if (!Array.isArray(values) || values.length === 0) return '';
    const varName = `${field}_value`;
    const inList = values.map(v => `"${this.escapeValue(v)}"`).join(', ');
    return `  ?subj ${sparqlProperty} ?${varName} .
  FILTER(?${varName} IN (${inList})) .
`;
  }

  buildBaseGraphPattern() {
    return `  GRAPH ?g {
    VALUES ?sosType {
      sschema:Dataset
      schema:Dataset
    }
    ?subj a ?sosType .
    ?subj schema:name|sschema:name ?name .
    ?subj schema:description|sschema:description ?description .
  }
`;
  }

  buildResourceTypeConstraints(resourceType) {
    let constraints = `  VALUES (?type ?resourceType_u) {
    (schema:Dataset "data")
    (sschema:Dataset "data")
    (schema:SoftwareApplication "tool")
    (sschema:SoftwareApplication "tool")
    (schema:DataCatalog "DataCatalog")
    (sschema:DataCatalog "DataCatalog")
  }
  ?subj a ?type .
`;
    if (resourceType && resourceType !== 'all') {
      constraints += `  FILTER(?resourceType_u = "${this.escapeValue(resourceType)}") .\n`;
    }
    return constraints;
  }

  buildOptionalProperties() {
    return `  OPTIONAL {?subj sschema:distribution/sschema:url|sschema:subjectOf/sschema:url|schema:distribution/schema:url|schema:subjectOf/schema:url ?url1 .}
  OPTIONAL {?subj schema:datePublished|sschema:datePublished ?datep1 .}
  OPTIONAL {?subj schema:dateCreated|sschema:dateCreated ?datec .}
  OPTIONAL {?subj schema:dateModified|sschema:dateModified ?datem .}
  OPTIONAL {?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage_raw .}
  OPTIONAL {?subj schema:publisher/schema:name|sschema:publisher/sschema:name|schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?pub_name .}
  OPTIONAL {?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name ?place_name .}
  OPTIONAL {?subj schema:keywords|sschema:keywords ?kwu .}

`;
  }

  /**
   * True when a rangedepth facet is active with min/max (enables QLever candidate subquery path).
   */
  filtersNeedDepthVariableMeasured(filters) {
    if (!filters || typeof filters !== 'object') return false;
    return Object.entries(filters).some(([field, values]) => {
      const cfg = this.getFacetConfig(field);
      return (
        cfg?.type === 'rangedepth' &&
        Array.isArray(values) &&
        values.length >= 2
      );
    });
  }

  /**
   * Depth from schema:variableMeasured / PropertyValue (aligned with public/queries/qlever/sparql_query.rq).
   * Uses CONTAINS(LCASE(name),"depth") plus cmpdep so the pattern stays short vs a long IN list.
   */
  buildDepthVariableMeasured({ required = false } = {}) {
    const inner = `    ?subj schema:variableMeasured|sschema:variableMeasured ?vm .
    VALUES ?depthType { schema:PropertyValue sschema:PropertyValue }
    ?vm a ?depthType .
    ?vm schema:name|sschema:name ?propertyName .
    FILTER(
      CONTAINS(LCASE(STR(?propertyName)), "depth") ||
      LCASE(STR(?propertyName)) = "cmpdep"
    ) .
    ?vm schema:maxValue|sschema:maxValue ?maxDepth_d .
    ?vm schema:minValue|sschema:minValue ?minDepth_d .
    BIND(COALESCE(?maxDepth_d) AS ?maxDepth_raw)
    BIND(COALESCE(?minDepth_d) AS ?minDepth_raw)`;
    return required
      ? `${inner}\n\n`
      : `  OPTIONAL {\n${inner}\n  }\n\n`;
  }

  buildOptionalDepthVariableMeasured() {
    return this.buildDepthVariableMeasured({ required: false });
  }

  buildBindings() {
    return `

  BIND (COALESCE(?datec,?datem,?datep1) AS ?datep_raw)
  BIND (IF(BOUND(?pub_name), ?pub_name, "No Publisher") AS ?pubname_raw)
  BIND (IF(BOUND(?place_name), ?place_name, "No Placenames") AS ?placename)
`;
  }

  buildOrderByClause() {
    return '';
  }
  buildGroupbyClause() {
    return `GROUP BY ?g ?subj ?name ?description\n`;
  }
  buildLimitClause(limit, offset) {
    return `LIMIT ${limit}\nOFFSET ${offset}\n`;
  }

  getFacetConfig(field) {
    return (this.config.FACETS || []).find(f => f.field === field);
  }

  /**
   * Build a triple pattern binding `?value` for a facet property.
   * Multi-step paths (containing `/`) are expanded into intermediate node triples,
   * matching the same expansion used in buildTextFilter.
   */
  buildFacetPropertyPattern(field, sparqlProperty) {
    if (sparqlProperty.includes('/')) {
      const alternatives = sparqlProperty.split('|').map(s => s.trim());
      const firstStep = alternatives[0].split('/')[0];
      const secondSteps = [...new Set(alternatives.map(alt => alt.split('/').slice(1).join('/')))];
      const nodeVar = `${field}_node`;
      const secondPath = secondSteps.join('|');
      return `  ?subj ${firstStep} ?${nodeVar} .\n  ?${nodeVar} ${secondPath} ?value .\n`;
    }
    return `  ?subj ${sparqlProperty} ?value .\n`;
  }

  getDefaultSparqlProperty(field) {
    const mapping = {
      kw: 'schema:keywords|sschema:keywords',
      keywords: 'schema:keywords|sschema:keywords',
      resourceType: 'a',
      placenames: 'schema:spatialCoverage/schema:name',
      pubname: 'schema:publisher/schema:name|schema:publisher/schema:legalName',
      datep: 'schema:datePublished|sschema:datePublished'
    };
    return mapping[field] || `schema:${field}|sschema:${field}`;
  }

  escapeValue(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  /** Escape a string for safe use inside a SPARQL REGEX(...) pattern argument. */
  escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * A source's Nabu release catalog, addressed by its named graph URN.
   *
   * The URN is the catalog's identity, not the source slug: every release
   * catalog uses the same subject IRI (urn:gleaner.io:eco:datacatalog), so the
   * graph is the only thing telling iris's catalog apart from wodb's.
   */
  buildCatalogByGraphQuery(graphUri) {
    let query = this.buildPrefixes();
    query += `SELECT DISTINCT ?g ?subj ?name ?description ?dateCreated ?organization ?publisher ?provider
WHERE {
  BIND(<${graphUri}> AS ?g)
  GRAPH ?g {
    VALUES ?catType { schema:DataCatalog sschema:DataCatalog }
    ?subj a ?catType .
    OPTIONAL { ?subj schema:name|sschema:name ?name }
    OPTIONAL { ?subj schema:description|sschema:description ?description }
    OPTIONAL { ?subj schema:dateCreated|sschema:dateCreated ?dateCreated }
    OPTIONAL { ?subj schema:sourceOrganization/schema:name ?organization }
    OPTIONAL { ?subj schema:publisher/schema:name ?publisher }
    OPTIONAL { ?subj schema:provider/schema:name ?provider }
  }
}
LIMIT 20
`;
    return query;
  }

  /**
   * Every Nabu release catalog, one row per source. Callers map the source slug
   * out of ?g to turn a slug into the URN the catalog page is addressed by.
   *
   * The anchored shape matters: the per-dataset :data: graphs also carry
   * `a schema:DataCatalog` (the publisher's own declared catalog), and an
   * unanchored match would pull in thousands of them.
   */
  buildCatalogListQuery() {
    let query = this.buildPrefixes();
    query += `SELECT DISTINCT ?g ?dateCreated WHERE {
  GRAPH ?g {
    VALUES ?catType { schema:DataCatalog sschema:DataCatalog }
    ?subj a ?catType .
    OPTIONAL { ?subj schema:dateCreated|sschema:dateCreated ?dateCreated }
  }
  FILTER(REGEX(STR(?g), "^urn:gleaner\\\\.io:.*:[^:]+:datacatalog:[0-9a-f]{64}$"))
}
LIMIT 500
`;
    return query;
  }

  /**
   * One page of the Datasets a catalog document lists.
   *
   * A release document does not embed its Datasets: it holds `schema:dataset`
   * pointers whose objects are the per-dataset harvest graph URNs. So the page is
   * cut from those pointers (cheap, catalog-graph only) and each pointed-at graph
   * is then joined for the record's own name/description/url/keywords. That join is
   * OPTIONAL so a pointer to a graph that was never harvested still yields a row,
   * keeping page length consistent with the pointer count.
   *
   * DISTINCT matters: schema: and sschema: expand to the same IRI, so the
   * alternation would otherwise return every pointer twice and short the page.
   *
   * ?g is the harvest graph URN, which is also the route id for /dataset/:id.
   */
  buildCatalogDatasetsQuery(graphUri, { limit = 10, offset = 0 } = {}) {
    let query = this.buildPrefixes();
    query += `SELECT ?g ?subj
  (SAMPLE(?nameU) AS ?name)
  (SAMPLE(?descriptionU) AS ?description)
  (SAMPLE(?urlU) AS ?url)
  (GROUP_CONCAT(DISTINCT ?kwu; SEPARATOR=", ") AS ?kw)
WHERE {
  {
    SELECT DISTINCT ?g WHERE {
      GRAPH <${graphUri}> {
        ?cat schema:dataset|sschema:dataset ?g .
      }
    }
    ORDER BY ?g
    LIMIT ${Number(limit)}
    OFFSET ${Number(offset)}
  }
  OPTIONAL {
    GRAPH ?g {
      VALUES ?sosType { schema:Dataset sschema:Dataset }
      ?subj a ?sosType .
      OPTIONAL { ?subj schema:name|sschema:name ?nameU . }
      OPTIONAL { ?subj schema:description|sschema:description ?descriptionU . }
      OPTIONAL { ?subj schema:url|sschema:url ?urlU . }
      OPTIONAL { ?subj schema:keywords|sschema:keywords ?kwu . }
    }
  }
}
GROUP BY ?g ?subj
ORDER BY ?g
`;
    return query;
  }

  /**
   * Total Datasets a catalog document lists. Counts the `schema:dataset` pointers
   * in the catalog graph, so it stays consistent with the page query above and
   * never touches the per-dataset graphs.
   */
  buildCatalogDatasetsCountQuery(graphUri) {
    let query = this.buildPrefixes();
    query += `SELECT (COUNT(DISTINCT ?ds) AS ?count) WHERE {
  GRAPH <${graphUri}> {
    ?cat schema:dataset|sschema:dataset ?ds .
  }
}
`;
    return query;
  }
}

// Factory function to create query builder with config
export function createSparqlQueryBuilder(config) {
  return new SparqlQueryBuilder(config);
}
