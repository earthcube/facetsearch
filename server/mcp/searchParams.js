/**
 * Translate the flat MCP tool arguments into the { filters, ... } search params
 * the vendored SparqlQueryBuilder expects (the same shape the UI's FilterStateManager
 * produces from the facet sidebar).
 */
const { getFacetsConfig } = require('./facetsConfig');

const RESOURCE_TYPES = ['all', 'data', 'tool', 'DataCatalog'];

function nonEmptyArray(values) {
  if (!Array.isArray(values)) return null;
  const cleaned = values.map((v) => String(v).trim()).filter((v) => v.length > 0);
  return cleaned.length > 0 ? cleaned : null;
}

function rangePair(range, fromKey, toKey) {
  if (!range || typeof range !== 'object') return null;
  const from = Number(range[fromKey]);
  const to = Number(range[toKey]);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return [Math.min(from, to), Math.max(from, to)];
}

/**
 * @param {object} args - MCP tool arguments
 * @param {object} [config] - facets config (endpoint, limits, FACETS)
 * @returns {{ textQuery: string, searchExactMatch: boolean, resourceType: string,
 *            filters: object, limit: number, offset: number }}
 */
function toSearchParams(args = {}, config = getFacetsConfig()) {
  const filters = {};

  const keywords = nonEmptyArray(args.keywords);
  if (keywords) filters.kw = keywords;

  const places = nonEmptyArray(args.places);
  if (places) filters.placenames = places;

  const publishers = nonEmptyArray(args.publishers);
  if (publishers) filters.pubname = publishers;

  const variables = nonEmptyArray(args.variablesMeasured);
  if (variables) filters.variableMeasured = variables;

  const published = rangePair(args.yearPublished, 'from', 'to');
  if (published) filters.datep = published;

  const temporal = rangePair(args.temporalCoverage, 'from', 'to');
  if (temporal) filters.temporalCoverage = temporal;

  const depth = rangePair(args.depth, 'min', 'max');
  if (depth) filters.minDepth = depth;

  if (args.boundingBox && typeof args.boundingBox === 'object') {
    const { north, south, east, west } = args.boundingBox;
    if ([north, south, east, west].every((v) => Number.isFinite(Number(v)))) {
      filters.spatialCoverage = {
        north: Number(north),
        south: Number(south),
        east: Number(east),
        west: Number(west),
      };
    }
  }

  const maxLimit = Number(config.LIMIT_MAX || 200);
  const requested = Number(args.limit);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, maxLimit)
    : Number(config.LIMIT_DEFAULT || 10);
  const offsetRaw = Number(args.offset);
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;

  return {
    textQuery: typeof args.q === 'string' ? args.q.trim() : '',
    searchExactMatch: args.exactMatch !== false,
    resourceType: RESOURCE_TYPES.includes(args.resourceType) ? args.resourceType : 'all',
    filters,
    limit,
    offset,
  };
}

/** Reshape a SPARQL result row into the fields the UI result card shows. */
function toResultRecord(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    resourceType: row.resourceType || row.resourceType_u,
    publisher: row.pubname,
    datePublished: row.datep,
    temporalCoverage: row.temporalCoverage,
    keywords: row.kw || [],
    places: row.placenames || [],
    distributionUrls: row.disurl || [],
    subject: row.subj,
    graph: row.g,
  };
}

module.exports = { toSearchParams, toResultRecord, RESOURCE_TYPES };
