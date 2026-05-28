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
    query += this.buildWhereClause(textQuery, searchExactMatch, resourceType, filters, effectiveLimit, offset);
    query += this.buildGroupbyClause();
    query += this.buildOrderByClause();

    if (!this.usesQLever()) {
      query += this.buildLimitClause(effectiveLimit, offset);
    }

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

  buildWhereClause(textQuery, searchExactMatch, resourceType, filters, limit = 10, offset = 0) {
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
      whereClause += this.buildConstraintRangeFragments(filters);
      whereClause += this.buildOptionalProperties();
      whereClause += this.buildBindings();
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
      whereClause += this.buildConstraintRangeFragments(filters);
      whereClause += this.buildOptionalProperties();
      whereClause += this.buildBindings();
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'late' });
      whereClause += '}\n';
      return whereClause;
    }

    if (qleverFullText) {
      whereClause += this.buildQleverInlineTextSubquery(
        textQuery, searchExactMatch, resourceType, filters, limit, offset
      );
      whereClause += this.buildConstraintRangeFragments(filters);
      whereClause += this.buildOptionalProperties();
      whereClause += this.buildBindings();
      whereClause += this.buildFilterFragments(filters, { rangePlacement: 'late' });
      whereClause += '}\n';
      return whereClause;
    }

    if (this.isQleverBrowseMode(textQuery)) {
      whereClause += this.buildQleverBrowseSubquery(resourceType, filters, limit, offset);
      whereClause += `  GRAPH ?g {\n    ?subj schema:name|sschema:name ?name .\n    ?subj schema:description|sschema:description ?description .\n  }\n`;
      whereClause += this.buildOptionalProperties();
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

    whereClause += this.buildOptionalProperties();
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
   * skipRangedepth: true omits the depth filter (used when placing constraints inside inner subqueries
   * where depth is already handled by buildOptionalDepthVariableMeasured + buildRangedepthFilterFragments).
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

  /** QLever full-text core: type + text + name/desc (no Dataset-only head, no OPTIONAL explosion). */
  buildQleverFullTextCore(textQuery, searchExactMatch, resourceType, filters) {
    let block = '';
    block += this.buildResourceTypeConstraints(resourceType);
    block += this.buildFilterFragments(filters, { rangePlacement: 'early' });
    block += this.buildTextSearchFragment(textQuery, searchExactMatch);
    block += this.buildGraphNameDescOnly();
    block += this.buildConstraintRangeFragments(filters, { skipRangedepth: true });
    return block;
  }

  /** QLever full-text + depth: text/graph, then OPTIONAL depth + overlap FILTER inside candidate subquery. */
  buildQleverFullTextCoreForDepthSubquery(textQuery, searchExactMatch, resourceType, filters) {
    let block = this.buildQleverFullTextCore(
      textQuery,
      searchExactMatch,
      resourceType,
      filters
    );
    block += this.buildOptionalDepthVariableMeasured();
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
    SELECT DISTINCT ?g ?subj ?name ?description ?type
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
    SELECT DISTINCT ?g ?subj ?name ?description ?type
    WHERE {
${inner}
    }
    LIMIT ${limit}
    OFFSET ${offset}
  }
`;
  }

  /** Inner SELECT DISTINCT with pagination for single-token QLever text (no candidate subquery needed). */
  buildQleverInlineTextSubquery(textQuery, searchExactMatch, resourceType, filters, limit, offset) {
    let core = '';
    core += this.buildSubjDatasetHead();
    core += this.buildResourceTypeConstraints(resourceType);
    core += this.buildFilterFragments(filters, { rangePlacement: 'early' });
    core += this.buildTextSearchFragment(textQuery, searchExactMatch);
    core += this.buildGraphNameDescOnly();
    core += this.buildConstraintRangeFragments(filters, { skipRangedepth: true });
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

  /** Inner SELECT DISTINCT with pagination for QLever browse (no text search). */
  buildQleverBrowseSubquery(resourceType, filters, limit, offset) {
    const typeFilter =
      resourceType && resourceType !== 'all'
        ? `      FILTER(?resourceType_u = "${this.escapeValue(resourceType)}")\n`
        : '';
    const rangeConstraints = indentSparqlLines(
      this.buildConstraintRangeFragments(filters, { skipRangedepth: true }), 2
    );
    return `  {
    SELECT DISTINCT ?g ?subj ?resourceType_u
    WHERE {
      VALUES (?type ?resourceType_u) {
        (schema:Dataset             "data")
        (schema:DataCatalog         "DataCatalog")
        (schema:SoftwareApplication "tool")
      }
      GRAPH ?g { ?subj a ?type . }
${typeFilter}${rangeConstraints}    }
    LIMIT ${limit}
    OFFSET ${offset}
  }
`;
  }

  buildTextFilter(field, values, facetConfig) {
    const sparqlProperty = facetConfig.sparql_property || this.getDefaultSparqlProperty(field);
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

    return `  FILTER EXISTS {
    ?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage_f .
    FILTER(xsd:integer(SUBSTR(STR(?temporalCoverage_f), 1, 4)) >= ${fMin} &&
           xsd:integer(SUBSTR(STR(?temporalCoverage_f), 1, 4)) <= ${fMax})
  } .\n`;
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
    BOUND(?maxDepth) && BOUND(?minDepth) &&
    IF(ABS(xsd:float(?minDepth)) < ABS(xsd:float(?maxDepth)), ABS(xsd:float(?maxDepth)), ABS(xsd:float(?minDepth))) >= ${fMin} &&
    IF(ABS(xsd:float(?minDepth)) < ABS(xsd:float(?maxDepth)), ABS(xsd:float(?minDepth)), ABS(xsd:float(?maxDepth))) <= ${fMax}
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
    buildGroupbyClause() {
        return `GROUP BY ?g ?subj ?name ?description ?url ?datep ?pubname ?temporalCoverage\n`;
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
