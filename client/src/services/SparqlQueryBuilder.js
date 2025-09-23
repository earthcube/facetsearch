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
   * Build complete SPARQL query from search parameters and filters
   */
  buildQuery(searchParams) {
    const { textQuery, searchExactMatch, resourceType, filters, limit = 10, offset = 0 } = searchParams;

    let query = this.buildPrefixes();
    query += this.buildSelectClause();
    query += this.buildWhereClause(textQuery, searchExactMatch, resourceType, filters);
    query += this.buildOrderByClause();
    query += this.buildLimitClause(limit, offset);

    return query;
  }

  buildPrefixes() {
    return Object.entries(this.prefixes)
      .map(([prefix, uri]) => `PREFIX ${prefix}: ${uri}`)
      .join('\n') + '\n\n';
  }

  buildSelectClause() {
    const selectVars = [
      '?subj', '?name', '?description', '?url', '?datep',
      '?pubname', '?placename', '?kwu', '?resourceType_u',
      '?maxDepth', '?minDepth', '?temporalCoverage'
    ];

    return `SELECT DISTINCT ${selectVars.join(' ')}\n`;
  }

  buildWhereClause(textQuery, searchExactMatch, resourceType, filters) {
    let whereClause = 'WHERE {\n';

    // Add text search if present
    if (textQuery) {
      whereClause += this.buildTextSearchFragment(textQuery, searchExactMatch);
    }

    // Add filter fragments
    whereClause += this.buildFilterFragments(filters);

    // Base graph pattern
    whereClause += this.buildBaseGraphPattern();

    // Resource type constraints
    whereClause += this.buildResourceTypeConstraints(resourceType);

    // Optional properties
    whereClause += this.buildOptionalProperties();

    // Bindings
    whereClause += this.buildBindings();

    whereClause += '}\n';
    return whereClause;
  }

  buildTextSearchFragment(textQuery, searchExactMatch) {
    const q = this.escapeValue(textQuery);
    if (this.queryEngine === 'blazegraph') {
      const exactStr = searchExactMatch ? 'true' : 'false';
      return `  ?lit bds:search "${q}" .
  ?lit bds:matchAllTerms "${exactStr}" .
  ?lit bds:relevance ?score1 .
  GRAPH ?g { ?subj ?p ?lit . }
`;
    } else {
      // QLever: bind the literal from the subject and match words
      // This is a widely-compatible pattern with QLever index
      return `  ?subj ?p ?text .
  ?text ql:contains-word "${q}" .
`;
    }
  }

  buildFilterFragments(filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return '';
    }

    let fragments = '';

    Object.entries(filters).forEach(([field, values]) => {
      const facetConfig = this.getFacetConfig(field);
      if (!facetConfig || !values || (Array.isArray(values) && values.length === 0)) return;

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

  buildRangeFilter(field, values, facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const [min, max] = values;
    return `  FILTER(?datep >= "${min}"^^xsd:gYear && ?datep <= "${max}"^^xsd:gYear) .\n`;
  }

  buildDepthFilter(field, values, facetConfig) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const [min, max] = values;
    return `  FILTER(?maxDepth >= ${min} && ?minDepth <= ${max}) .\n`;
  }

  buildGeoFilter(field, values, facetConfig) {
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
  OPTIONAL {
    ?subj sschema:variableMeasured ?vm .
    ?vm a sschema:PropertyValue .
    ?vm sschema:name ?namedepth .
    FILTER (?namedepth IN ("depth", "CmpDep")) .
    ?vm sschema:maxValue ?maxDepth_d .
    ?vm sschema:minValue ?minDepth_d
  }
`;
  }

  buildBindings() {
    return `  BIND (COALESCE(?maxDepth_d) AS ?maxDepth)
  BIND (COALESCE(?minDepth_d) AS ?minDepth)
  BIND (COALESCE(?kwu, "") AS ?kwu)
  BIND (COALESCE(?url1) AS ?url)
  BIND (COALESCE(?datec,?datem,?datep1) AS ?datep)
  BIND (IF(BOUND(?pub_name), ?pub_name, "No Publisher") AS ?pubname)
  BIND (IF(BOUND(?place_name), ?place_name, "No Placenames") AS ?placename)
`;
  }

  buildOrderByClause() {
    // If QLever doesn’t provide score, order may be basic; adjust when scoring available
    return 'ORDER BY DESC(?score1)\n';
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