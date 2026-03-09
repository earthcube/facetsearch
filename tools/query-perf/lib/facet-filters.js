/**
 * Facet Filter SPARQL Fragment Generators
 *
 * Each facet type can generate two kinds of SPARQL fragments:
 *   - "discovery" (OPTIONAL): used when no filter is active, to discover available values
 *   - "active" (FILTER): used when the user has selected filter values
 *
 * These match the patterns defined in SPARQL_FILTERING_REFACTOR_PLAN.md and
 * the actual query patterns used in the qlever/blazegraph query templates.
 */

// ---------------------------------------------------------------------------
// Text facet: keywords, publishers, places, resourceType
// ---------------------------------------------------------------------------

const TEXT_FIELD_MAPPINGS = {
  kw: {
    property: "schema:keywords|sschema:keywords",
    variable: "?kw1",
    activeVariable: "?selectedKw",
  },
  pubname: {
    property: "schema:publisher/schema:name|sschema:publisher/sschema:name",
    legalNameProperty: "schema:publisher/schema:legalName|sschema:publisher/sschema:legalName",
    variable: "?pub_name",
    activeVariable: "?pub_name",
    useFilter: true,
  },
  placenames: {
    property: "schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name",
    variable: "?place_name",
    activeVariable: "?place_name",
    useFilter: true,
  },
  resourceType: {
    // resourceType uses VALUES clause pattern, not a simple property
    variable: "?type",
    activeVariable: "?type",
  },
};

function textDiscovery(field) {
  const mapping = TEXT_FIELD_MAPPINGS[field];
  if (!mapping) return `# Unknown text field: ${field}`;
  if (field === "resourceType") {
    return `# resourceType: discovered via VALUES ?type clause in base query`;
  }
  return `OPTIONAL {?subj ${mapping.property} ${mapping.variable} .}`;
}

function textFilter(field, values) {
  const mapping = TEXT_FIELD_MAPPINGS[field];
  if (!mapping || !values || values.length === 0) return textDiscovery(field);

  if (field === "resourceType") {
    // Map user-friendly names to schema types
    const typeMap = {
      data: ["schema:Dataset", "sschema:Dataset"],
      tool: ["schema:SoftwareApplication", "sschema:SoftwareApplication"],
      person: ["schema:Person", "sschema:Person"],
      researchProject: ["schema:ResearchProject", "sschema:ResearchProject"],
      event: ["schema:Event", "sschema:Event"],
      award: ["schema:Award", "sschema:Award"],
      DataCatalog: ["schema:DataCatalog", "sschema:DataCatalog"],
    };
    const types = values.flatMap((v) => typeMap[v] || []);
    if (types.length === 0) return `# No matching resource types for: ${values.join(", ")}`;
    const valuesClause = types.map((t) => `(${t})`).join(" ");
    return `VALUES ?selectedType { ${valuesClause} }\n    ?subj a ?selectedType .`;
  }

  if (mapping.useFilter) {
    const quoted = values.map((v) => `"${v}"`).join(", ");
    return `?subj ${mapping.property} ${mapping.activeVariable} .\n    FILTER(${mapping.activeVariable} IN (${quoted}))`;
  }

  // Default: VALUES clause
  const quoted = values.map((v) => `"${v}"`).join(" ");
  return `?subj ${mapping.property} ${mapping.activeVariable} .\n    VALUES ${mapping.activeVariable} { ${quoted} }`;
}

// ---------------------------------------------------------------------------
// Depth range facet
// ---------------------------------------------------------------------------

function depthDiscovery() {
  return `OPTIONAL {
        ?subj sschema:variableMeasured ?vmd .
        ?vmd a sschema:PropertyValue .
        ?vmd sschema:name ?namedepth .
        FILTER (LCASE(?namedepth) IN ("cmpdep", "package_depth", "collection_depth", "bottle depth", "sample depth", "tow depth")) .
        ?vmd sschema:maxValue ?maxDepth_d .
        ?vmd sschema:minValue ?minDepth_d
    }`;
}

function depthFilter(minDepth, maxDepth) {
  if (minDepth == null && maxDepth == null) return depthDiscovery();
  const min = minDepth != null ? minDepth : -10000;
  const max = maxDepth != null ? maxDepth : 10000;
  return `?subj sschema:variableMeasured ?vmd .
    ?vmd a sschema:PropertyValue .
    ?vmd sschema:name ?namedepth .
    FILTER (LCASE(?namedepth) IN ("cmpdep", "package_depth", "collection_depth", "bottle depth", "sample depth", "tow depth")) .
    ?vmd sschema:maxValue ?maxDepth_d .
    ?vmd sschema:minValue ?minDepth_d .
    FILTER(?minDepth_d >= ${min} && ?maxDepth_d <= ${max})`;
}

// ---------------------------------------------------------------------------
// Temporal coverage facet (depthyear / rangeyear)
// ---------------------------------------------------------------------------

function temporalDiscovery() {
  return `OPTIONAL {?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .}`;
}

function temporalFilter(startYear, endYear) {
  if (startYear == null && endYear == null) return temporalDiscovery();
  const start = startYear != null ? startYear : 1800;
  const end = endYear != null ? endYear : 2100;
  return `?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .
    FILTER((xsd:integer(SUBSTR(STR(?temporalCoverage), 1, 4)) >= ${start} &&
            xsd:integer(SUBSTR(STR(?temporalCoverage), 1, 4)) <= ${end}))`;
}

// ---------------------------------------------------------------------------
// Date published facet (rangeyear for datep)
// ---------------------------------------------------------------------------

function datePublishedDiscovery() {
  return `OPTIONAL {?subj schema:datePublished|sschema:datePublished ?datep .}`;
}

function datePublishedFilter(startYear, endYear) {
  if (startYear == null && endYear == null) return datePublishedDiscovery();
  const start = startYear != null ? startYear : 1800;
  const end = endYear != null ? endYear : 2100;
  return `?subj schema:datePublished|sschema:datePublished ?datep .
    FILTER(xsd:integer(SUBSTR(STR(?datep), 1, 4)) >= ${start} &&
           xsd:integer(SUBSTR(STR(?datep), 1, 4)) <= ${end})`;
}

// ---------------------------------------------------------------------------
// Geo / spatial coverage facet
// ---------------------------------------------------------------------------

function geoDiscovery() {
  return `OPTIONAL {?subj schema:spatialCoverage/schema:geo/schema:latitude|sschema:spatialCoverage/sschema:geo/sschema:latitude ?lat .}
    OPTIONAL {?subj schema:spatialCoverage/schema:geo/schema:longitude|sschema:spatialCoverage/sschema:geo/sschema:longitude ?lon .}`;
}

function geoFilter(bounds) {
  if (!bounds || (bounds.minLat == null && bounds.maxLat == null && bounds.minLon == null && bounds.maxLon == null)) {
    return geoDiscovery();
  }
  const { minLat = -90, maxLat = 90, minLon = -180, maxLon = 180 } = bounds;
  return `?subj schema:spatialCoverage/schema:geo/schema:latitude|sschema:spatialCoverage/sschema:geo/sschema:latitude ?lat .
    ?subj schema:spatialCoverage/schema:geo/schema:longitude|sschema:spatialCoverage/sschema:geo/sschema:longitude ?lon .
    FILTER(?lat >= ${minLat} && ?lat <= ${maxLat} &&
           ?lon >= ${minLon} && ?lon <= ${maxLon})`;
}

// ---------------------------------------------------------------------------
// Public API: build fragments from a scenario's facet definitions
// ---------------------------------------------------------------------------

/**
 * Build SPARQL fragments from a facets array in a test scenario.
 *
 * Each facet object in the array should have:
 *   { type: "text"|"depthrange"|"rangeyear"|"geo"|"datePublished",
 *     field: "kw"|"pubname"|"placenames"|"resourceType"|...,
 *     active: true|false,
 *     values: [...] | { min, max } | { minLat, maxLat, minLon, maxLon } }
 *
 * Returns an array of { field, type, active, fragment } objects.
 */
function buildFacetFragments(facets) {
  if (!facets || !Array.isArray(facets)) return [];

  return facets.map((facet) => {
    const { type, field, active, values } = facet;
    let fragment;

    switch (type) {
      case "text":
        fragment = active ? textFilter(field, values) : textDiscovery(field);
        break;

      case "depthrange":
      case "rangedepth":
        fragment = active
          ? depthFilter(values && values.min, values && values.max)
          : depthDiscovery();
        break;

      case "depthyear":
      case "rangeyear":
        if (field === "datep" || field === "datePublished") {
          fragment = active
            ? datePublishedFilter(values && values.min, values && values.max)
            : datePublishedDiscovery();
        } else {
          fragment = active
            ? temporalFilter(values && values.min, values && values.max)
            : temporalDiscovery();
        }
        break;

      case "geo":
        fragment = active ? geoFilter(values) : geoDiscovery();
        break;

      default:
        fragment = `# Unknown facet type: ${type} (field: ${field})`;
    }

    return { field, type, active: !!active, fragment };
  });
}

/**
 * Combine facet fragments into a single string for injection into a query.
 */
function combineFacetFragments(fragments) {
  return fragments.map((f) => `  # Facet: ${f.field} (${f.type}, ${f.active ? "ACTIVE" : "discovery"})\n  ${f.fragment}`).join("\n\n");
}

module.exports = {
  buildFacetFragments,
  combineFacetFragments,
  textFilter,
  textDiscovery,
  depthFilter,
  depthDiscovery,
  temporalFilter,
  temporalDiscovery,
  datePublishedFilter,
  datePublishedDiscovery,
  geoFilter,
  geoDiscovery,
  TEXT_FIELD_MAPPINGS,
};
