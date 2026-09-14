/**
 * Facet configuration for the MCP search endpoint.
 *
 * Mirrors the FACETS block of client/public/config/config_qlever.yaml so the MCP tools
 * expose the same facets as the UI sidebar. Endpoint and limits are environment driven.
 */

const DEFAULT_TRIPLESTORE_URL =
  'https://qlever.geocodes-aws-dev.earthcube.org/graphspace/facetsearch';

/** Same fields/types as the UI FACETS list; used by the vendored SparqlQueryBuilder. */
const FACETS = [
  { field: 'resourceType', title: 'Resource Type', type: 'text' },
  { field: 'kw', title: 'Keywords', type: 'text' },
  { field: 'placenames', title: 'Place', type: 'text' },
  { field: 'pubname', title: 'Publisher/Repo', type: 'text' },
  { field: 'datep', title: 'Year Published Range', type: 'rangeyear' },
  { field: 'spatialCoverage', title: 'Spatial Filter', type: 'geo' },
  {
    field: 'minDepth',
    range_fields: ['minDepth', 'maxDepth'],
    title: 'Depth Range',
    type: 'rangedepth',
  },
  { field: 'temporalCoverage', title: 'Temporal Coverage', type: 'rangeyear' },
  { field: 'variableMeasured', title: 'Variables Measured', type: 'propertyvalue' },
];

function positiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function getFacetsConfig() {
  return {
    QUERY_ENGINE: process.env.QUERY_ENGINE || 'qlever',
    TRIPLESTORE_URL: process.env.TRIPLESTORE_URL || DEFAULT_TRIPLESTORE_URL,
    BLAZEGRAPH_TIMEOUT: process.env.SPARQL_TIMEOUT || '20s',
    LIMIT_DEFAULT: positiveInt(process.env.MCP_LIMIT_DEFAULT, 10),
    LIMIT_MAX: positiveInt(process.env.MCP_LIMIT_MAX, 200),
    FACETS,
  };
}

module.exports = { getFacetsConfig, FACETS, DEFAULT_TRIPLESTORE_URL };
