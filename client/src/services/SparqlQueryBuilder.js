import {
  parseQuery,
  ensureParsedTerms,
  parsedHasTerms,
  parseQueryWithExactFlag,
  buildTextSearchBlazegraphGraph,
  buildTextSearchBlockQlever,
  indentSparqlLines,
} from '@/utils/queryParser.js';

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
      xsd: '<http://www.w3.org/2001/XMLSchema#>'
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

    // QLever full-text must follow public/queries/qlever/sparql_query.rq: constrain ?subj as
    // Dataset, then ?subj ?o ?item + ql:contains-entity + ql:contains-word, then GRAPH ?g { name, desc }.
    const qleverFullText = this.usesQLever() && textQuery;

    if (qleverFullText) {
      whereClause += this.buildSubjDatasetHead();
      whereClause += this.buildResourceTypeConstraints(resourceType);
      whereClause += this.buildTextSearchFragment(textQuery, searchExactMatch);
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'early' });
      whereClause += this.buildGraphNameDescOnly();
    } else {
      if (textQuery) {
        whereClause += this.buildTextSearchFragment(textQuery, searchExactMatch);
      }
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'early' });
      whereClause += this.buildBaseGraphPattern();
      whereClause += this.buildResourceTypeConstraints(resourceType);
    }

    whereClause += this.buildOptionalProperties();
    if (this.filtersNeedDepthVariableMeasured(filters)) {
      whereClause += this.buildOptionalDepthVariableMeasured();
    }
    whereClause += this.buildBindings();
    // Range filters use ?temporalCoverage (OPTIONAL), ?datep (BIND), ?maxDepth/?minDepth (depth OPTIONAL); must run after those bind.
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
   * @param {{ rangePlacement?: 'all' | 'early' | 'late' }} [options]
   *   - all: every filter (default; e.g. facet-option queries that do not use late placement)
   *   - early: text/geo/generic only — range filters bind vars from OPTIONAL/BIND below
   *   - late: range/rangeyear/rangedepth only — append after buildOptionalProperties + buildBindings
   */
  buildFilterFragments(filters, options = {}) {
    const rangePlacement = options.rangePlacement ?? 'all';
    const isRangeFacet = (type) =>
      type === 'range' || type === 'rangeyear' || type === 'rangedepth';

    if (!filters || Object.keys(filters).length === 0) {
      return '';
    }

    let fragments = '';

    Object.entries(filters).forEach(([field, values]) => {
      const facetConfig = this.getFacetConfig(field);
      if (!facetConfig || !values || (Array.isArray(values) && values.length === 0)) return;

      const range = isRangeFacet(facetConfig.type);
      if (rangePlacement === 'early' && range) return;
      if (rangePlacement === 'late' && !range) return;

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
      // ?datep comes from COALESCE and is a string — extract the year via SUBSTR
      return `  FILTER(xsd:integer(SUBSTR(STR(?datep), 1, 4)) >= ${min} &&
         xsd:integer(SUBSTR(STR(?datep), 1, 4)) <= ${max}) .\n`;
    }
    // temporalCoverage is also a string (e.g. "2010/2020" or "2015-01-01")
    return `  FILTER(xsd:integer(SUBSTR(STR(?temporalCoverage), 1, 4)) >= ${min} &&
         xsd:integer(SUBSTR(STR(?temporalCoverage), 1, 4)) <= ${max}) .\n`;
  }

  buildDepthFilter(_field, values, _facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const [min, max] = values;
    // Interval overlap: dataset [minDepth,maxDepth] vs filter [min,max]; require both bounds from OPTIONAL.
    return `  FILTER(
    BOUND(?maxDepth) && BOUND(?minDepth) &&
    ?maxDepth >= ${min} && ?minDepth <= ${max}
  ) .\n`;
  }

  buildGeoFilter(_field, values, _facetConfig) {
    // Expecting { bounds: { north, south, east, west } }
    const b = values?.bounds;
    if (!b) return '';
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
    return `  OPTIONAL {?subj sschema:distribution/sschema:url|sschema:subjectOf/sschema:url|schema:distribution/schema:url|schema:subjectOf/schema:url ?url1 .}
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
   * True when a rangedepth facet is active with min/max so we can add variableMeasured OPTIONAL.
   * Kept conditional (not in every query) to limit join size; see prior removal of global depth OPTIONAL.
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
  buildOptionalDepthVariableMeasured() {
    return `  OPTIONAL {
    ?subj schema:variableMeasured|sschema:variableMeasured ?vm .
    ?vm a schema:PropertyValue|sschema:PropertyValue .
    ?vm schema:name|sschema:name ?depth_prop_name .
    FILTER(
      CONTAINS(LCASE(STR(?depth_prop_name)), "depth") ||
      LCASE(STR(?depth_prop_name)) = "cmpdep"
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
    // If QLever doesn’t provide score, order may be basic; adjust when scoring available
      if ( ! this.usesQLever() ){

          return 'ORDER BY DESC(?score1)\n';
      } else {
          return ''
      }
  }
    buildGroupbyClause(_limit, _offset) {
       // return `GROUP BY ?subj ?pubname ?placename  ?datep ?url  ?name ?description ?type ?maxdepth ?minDepth ?temporalCoverage ?bbox ?g\n`;
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
