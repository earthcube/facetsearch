/**
 * Scenario Adapter
 *
 * Converts query-perf scenario JSON format into the searchParams format
 * expected by the production SparqlQueryBuilder.buildQuery() method.
 */

/**
 * Map scenario field names to config FACETS field names where they differ.
 * The scenarios historically used "minDepth" but some configs use "depth".
 */
const FIELD_ALIASES = {
  minDepth: ["minDepth", "depth"],
};

/**
 * Find the matching config FACETS field for a scenario field name.
 * Tries the field directly first, then checks aliases.
 */
function resolveField(field, facetsConfig) {
  if (facetsConfig.find((f) => f.field === field)) return field;
  const aliases = FIELD_ALIASES[field];
  if (aliases) {
    for (const alias of aliases) {
      if (facetsConfig.find((f) => f.field === alias)) return alias;
    }
  }
  return field; // return as-is, let the builder handle unknown fields
}

/**
 * Convert a scenario test definition + CLI args into SparqlQueryBuilder searchParams.
 *
 * @param {object} test - Test definition from scenario JSON
 * @param {object} args - Parsed CLI arguments
 * @param {object} config - Parsed YAML config (must include FACETS array)
 * @returns {object} searchParams for SparqlQueryBuilder.buildQuery()
 */
function scenarioToSearchParams(test, args, config) {
  const facetsConfig = config.FACETS || [];
  const facets = test.facets || args.facets || [];

  // Build filters object from active facets
  const filters = {};
  for (const facet of facets) {
    if (!facet.active) continue;
    if (!facet.values) continue;

    const field = resolveField(facet.field, facetsConfig);
    const type = facet.type;

    if (type === "text") {
      filters[field] = Array.isArray(facet.values) ? facet.values : [facet.values];
    } else if (type === "rangeyear" || type === "range" || type === "depthyear") {
      // Range filters: { min, max } → [min, max]
      const vals = facet.values;
      filters[field] = [vals.min, vals.max];
    } else if (type === "depthrange" || type === "rangedepth") {
      // Depth range: { min, max } → [min, max]
      const vals = facet.values;
      filters[field] = [vals.min, vals.max];
    } else if (type === "geo") {
      // Geo: { minLat, maxLat, minLon, maxLon } → { bounds: { north, south, east, west } }
      const vals = facet.values;
      filters[field] = {
        bounds: {
          north: vals.maxLat,
          south: vals.minLat,
          east: vals.maxLon,
          west: vals.minLon,
        },
      };
    }
  }

  // Handle resourceType from facets (if resourceType is used as a text filter in scenarios)
  // The SparqlQueryBuilder has a separate resourceType parameter
  let resourceType = test.resourceType || args.resourceType || "all";
  if (filters.resourceType) {
    // If resourceType was set as a text filter, use the first value as the resourceType param
    resourceType = Array.isArray(filters.resourceType) ? filters.resourceType[0] : filters.resourceType;
    delete filters.resourceType;
  }

  return {
    textQuery: test.search || args.search,
    searchExactMatch: (test.exact === true || test.exact === "true" || args.exact === "true"),
    resourceType,
    filters,
    limit: test.limit || args.limit,
    offset: test.offset || args.offset || 0,
  };
}

/**
 * Describe active/discovery facets for display purposes.
 */
function describeFacets(facets) {
  const active = [];
  const discovery = [];
  for (const f of (facets || [])) {
    const label = `${f.field}(${f.type})`;
    if (f.active) active.push(label);
    else discovery.push(label);
  }
  return { active, discovery };
}

export { scenarioToSearchParams, describeFacets, resolveField };
