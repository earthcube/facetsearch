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
  /**
   * Build complete SPARQL query from search parameters and filters
   */
  buildQuery(searchParams) {
    const { textQuery, searchExactMatch, resourceType, filters, limit, offset = 0 } = searchParams;
    const effectiveLimit =
      limit != null && limit !== ''
        ? Number(limit)
        : Number(this.config?.LIMIT_DEFAULT ?? 10);

    let query = this.buildPrefixes();
    query += this.buildSelectClause();
    query += this.buildWhereClause(textQuery, searchExactMatch, resourceType, filters);
    query += this.buildGroupbyClause();
    query += this.buildOrderByClause();
    query += this.buildLimitClause(effectiveLimit, offset);

    return query;
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
  buildSelectAggregateClause(aggVars) {
        return Object.keys(aggVars).map( o => ` (GROUP_CONCAT(DISTINCT ?${aggVars[o]}; SEPARATOR=", ") AS ?${o}) ` )
  }
  buildSelectClause() {
    const selectVars = [
      '?g',
      '?subj', '?name', '?description', '?url', '?datep',
      '?pubname',
     // '?maxDepth', '?minDepth',
        '?temporalCoverage'
    ];
      const aggVars = {
          'disurl':'url',
           'placenames':'placename', 'kw':'kw_u', 'resourceType':'resourceType_u',
      };
      const aggClause = this.buildSelectAggregateClause(aggVars);

    return `SELECT DISTINCT ${selectVars.join(' ')} ${aggClause.join(' ')} \n`;
  }

  buildWhereClause(textQuery, searchExactMatch, resourceType, filters) {
    let whereClause = 'WHERE {\n';

    if (this.usesQLever()) {
      // Selective filters first (depth, text facets, geo) — high selectivity, constrain ?subj tightly.
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'top' });
      whereClause += this.buildSubjDatasetHead();
      whereClause += this.buildResourceTypeConstraints(resourceType);
      if (textQuery) {
        whereClause += this.buildTextSearchFragment(textQuery, searchExactMatch);
      }
      // Date/temporal range filters after text search — they scan all date properties (low selectivity)
      // and would cause OOM if run before text search narrows the candidate set.
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'date-range' });
      whereClause += this.buildGraphNameDescOnly();
      whereClause += this.buildOptionalProperties();
      whereClause += this.buildBindings();
      whereClause += '}\n';
      return whereClause;
    }

    // Blazegraph path — unchanged
    whereClause += this.buildFilterFragments(filters, { rangePlacement: 'early' });
    if (textQuery) {
      whereClause += this.buildTextSearchFragment(textQuery, searchExactMatch);
    }
    whereClause += this.buildBaseGraphPattern();
    whereClause += this.buildResourceTypeConstraints(resourceType);
    whereClause += this.buildOptionalProperties();
    if (this.filtersNeedDepthVariableMeasured(filters)) {
      whereClause += this.buildOptionalDepthVariableMeasured();
    }
    whereClause += this.buildBindings();
    whereClause += this.buildFilterFragments(filters, { rangePlacement: 'late' });
    whereClause += '}\n';
    return whereClause;
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
   * @param {{ rangePlacement?: 'all' | 'early' | 'late' | 'top' | 'date-range'; skipRangedepth?: boolean }} [options]
   *
   * rangePlacement values:
   *  'top'        — selective filters only (text, rangedepth, geo, generic). Put before text search.
   *  'date-range' — non-selective scan filters only (range, rangeyear). Put after text search.
   *  'early'      — non-range filters (Blazegraph path)
   *  'late'       — range filters (Blazegraph path)
   *  'all'        — everything
   */
  buildFilterFragments(filters, options = {}) {
    const rangePlacement = options.rangePlacement ?? 'all';
    const skipRangedepth = options.skipRangedepth === true;
    const isDateRangeFacet = (type) => type === 'range' || type === 'rangeyear';
    const isRangeFacet = (type) => isDateRangeFacet(type) || type === 'rangedepth';

    if (!filters || Object.keys(filters).length === 0) {
      return '';
    }

    let fragments = '';

    Object.entries(filters).forEach(([field, values]) => {
      const facetConfig = this.getFacetConfig(field);
      if (!facetConfig || !values || (Array.isArray(values) && values.length === 0)) return;
      if (skipRangedepth && facetConfig.type === 'rangedepth') return;

      const range = isRangeFacet(facetConfig.type);
      const dateRange = isDateRangeFacet(facetConfig.type);
      if (rangePlacement === 'early' && range) return;
      if (rangePlacement === 'late' && !range) return;
      // 'top': selective filters only — skip non-selective date/temporal range scans
      if (rangePlacement === 'top' && dateRange) return;
      // 'date-range': only date/temporal range scans
      if (rangePlacement === 'date-range' && !dateRange) return;
      // 'all' passes everything through

      switch (facetConfig.type) {
        case 'text':
          fragments += this.buildTextFilter(field, Array.isArray(values) ? values : [values], facetConfig);
          break;
        case 'range':
        case 'rangeyear':
          fragments += this.buildRangeFilter(field, values, facetConfig);
          break;
        case 'rangedepth':
          fragments += this.buildDepthFilter(field, values, facetConfig);
          break;
        case 'geo':
          fragments += this.buildGeoFilter(field, values, facetConfig);
          break;
        default:
          fragments += this.buildGenericFilter(field, Array.isArray(values) ? values : [values], facetConfig);
      }
    });

    if (rangePlacement === 'top' && fragments) {
      return `  # === ACTIVE FILTERS ===\n${fragments}  # === END ACTIVE FILTERS ===\n`;
    }
    if (rangePlacement === 'date-range' && fragments) {
      return `  # === DATE/RANGE FILTERS ===\n${fragments}  # === END DATE/RANGE FILTERS ===\n`;
    }
    return fragments;
  }

  buildTextFilter(field, values, facetConfig) {
    const sparqlProperty = facetConfig.sparql_property || this.getDefaultSparqlProperty(field);
    let fragment = '';
    values.forEach(value => {
      fragment += `  ?subj ${sparqlProperty} "${this.escapeValue(value)}" .\n`;
    });
    return fragment;
  }

  buildRangeFilter(field, values, _facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const [min, max] = values;

    // Determine the SPARQL variable based on the field
    if (field === 'datep' || field === 'datePublished') {
      return `  ?subj ?property ?date_f .
  VALUES ?property { sschema:dateCreated sschema:dateModified sschema:datePublished schema:dateCreated schema:dateModified schema:datePublished } .
  FILTER(xsd:integer(SUBSTR(STR(?date_f), 1, 4)) >= ${min} &&
         xsd:integer(SUBSTR(STR(?date_f), 1, 4)) <= ${max}) .\n`;
    }

    // temporalCoverage is also a string (e.g. "2010/2020" or "2015-01-01")
    return `  ?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage_f .
  FILTER(xsd:integer(SUBSTR(STR(?temporalCoverage_f), 1, 4)) >= ${min} &&
         xsd:integer(SUBSTR(STR(?temporalCoverage_f), 1, 4)) <= ${max}) .\n`;

  }

  buildDepthFilter(_field, values, _facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const [min, max] = values;
    // Use ?vmf to avoid conflicting with the discovery OPTIONAL that also binds ?vm.
    // Interval overlap: dataset [minDepth_f, maxDepth_f] intersects filter [min, max].
    return `  ?subj schema:variableMeasured|sschema:variableMeasured ?vmf .
  ?vmf a sschema:PropertyValue .
  ?vmf schema:name|sschema:name ?namedepth_f .
  FILTER(CONTAINS(LCASE(STR(?namedepth_f)), "depth") || LCASE(STR(?namedepth_f)) = "cmpdep") .
  ?vmf schema:maxValue|sschema:maxValue ?maxDepth_f .
  ?vmf schema:minValue|sschema:minValue ?minDepth_f .
  FILTER(?maxDepth_f >= ${min} && ?minDepth_f <= ${max}) .\n`;
  }

  buildGeoFilter(_field, values, _facetConfig) {
    // Expecting { bounds: { north, south, east, west } }
    const b = values?.bounds;
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
        return `  ?subj schema:spatialCoverage ?spatialCov .
      ?spatialCov schema:geo ?geo .
      ?geo schema:latitude ?lat .
      ?geo schema:longitude ?lon .
      FILTER(?lat >= ${b.south} && ?lat <= ${b.north} && ?lon >= ${b.west} && ?lon <= ${b.east}) .
    `;
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
    (schema:ResearchProject "researchProject")
    (sschema:ResearchProject "researchProject")
    (schema:SoftwareApplication "tool")
    (sschema:SoftwareApplication "tool")
    (schema:Person "person")
    (sschema:Person "person")
    (schema:Event "event")
    (sschema:Event "event")
    (schema:Award "award")
    (sschema:Award "award")
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
    return `  # === OPTIONAL PROPERTY DISCOVERY (for SELECT output) ===
  OPTIONAL {?subj sschema:distribution/sschema:url|sschema:subjectOf/sschema:url|schema:distribution/schema:url|schema:subjectOf/schema:url ?url1 .}
  OPTIONAL {?subj schema:datePublished|sschema:datePublished ?datep1 .}
  OPTIONAL {?subj schema:dateCreated|sschema:dateCreated ?datec .}
  OPTIONAL {?subj schema:dateModified|sschema:dateModified ?datem .}
  OPTIONAL {?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .}
  OPTIONAL {?subj schema:publisher/schema:name|sschema:publisher/sschema:name|schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?pub_name .}
  OPTIONAL {?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name|sschema:sdPublisher ?place_name .}
  OPTIONAL {?subj schema:keywords|sschema:keywords ?kwu .}

`;
  }

  /**
   * @deprecated Blazegraph path only. QLever uses buildDepthFilter directly via rangePlacement:'top'.
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
   * @deprecated Blazegraph path only. QLever depth filtering handled by buildDepthFilter.
   */
  buildOptionalDepthVariableMeasured() {
    return `  OPTIONAL {
    ?subj schema:variableMeasured|sschema:variableMeasured ?vm .
    VALUES ?depthType { schema:PropertyValue sschema:PropertyValue }
    ?vm a ?depthType .
    ?vm schema:name|sschema:name ?propertyName .
    FILTER(
      CONTAINS(LCASE(STR(?propertyName)), "depth") ||
      LCASE(STR(?propertyName)) = "cmpdep"
    ) .
    ?vm schema:maxValue|sschema:maxValue ?maxDepth_d .
    ?vm schema:minValue|sschema:minValue ?minDepth_d .
    BIND(COALESCE(?maxDepth_d) AS ?maxDepth)
    BIND(COALESCE(?minDepth_d) AS ?minDepth)
  }

`;
  }

  buildBindings() {
    return `

  BIND (COALESCE(?datec,?datem,?datep1) AS ?datep)
  BIND (IF(BOUND(?pub_name), ?pub_name, "No Publisher") AS ?pubname)
  BIND (IF(BOUND(?place_name), ?place_name, "No Placenames") AS ?placename)
`;
  }

  buildOrderByClause() {
    return '';
  }
    buildGroupbyClause(_limit, _offset) {
        return `GROUP BY ?g ?subj  ?placename  ?datep ?pubname ?url  ?name ?description ?type  ?temporalCoverage ?kw  ?resourceType\n`;
    }
  buildLimitClause(limit, offset) {
    return `LIMIT ${limit}\nOFFSET ${offset}\n`;
  }

  getFacetConfig(field) {
    return (this.config.FACETS || []).find(f => f.field === field);
  }

  getDefaultSparqlProperty(field) {
    const mapping = {
      kw: 'schema:keywords|sschema:keywords',
      keywords: 'schema:keywords|sschema:keywords',
      resourceType: 'a',
      placenames: 'schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name',
      pubname: 'schema:publisher/sschema:name|sschema:publisher/sschema:legalName|schema:publisher/schema:name|schema:publisher/schema:legalName',
      datep: 'schema:datePublished|sschema:datePublished'
    };
    return mapping[field] || `schema:${field}|sschema:${field}`;
  }

  escapeValue(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}

// Factory function to create query builder with config
export function createSparqlQueryBuilder(config) {
  return new SparqlQueryBuilder(config);
}
