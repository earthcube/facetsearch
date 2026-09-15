/**
 * MCP server exposing the facet search over the QLever SPARQL endpoint.
 *
 * The tools mirror the facets of the web UI: free-text search plus keyword, place,
 * publisher, variable-measured, year-published, temporal-coverage, depth and
 * bounding-box filters, and the sidebar's facet value counts.
 */
const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');

const { getFacetsConfig } = require('./facetsConfig');
const { FacetSearchService } = require('./facetSearchService');
const { toSearchParams, toResultRecord, RESOURCE_TYPES } = require('./searchParams');

const rangeShape = (a, b, unit) =>
  z
    .object({
      [a]: z.number().describe(`lower bound (${unit})`),
      [b]: z.number().describe(`upper bound (${unit})`),
    })
    .optional();

/** Facet arguments shared by search, count and facet-value tools. */
const facetArgs = {
  q: z
    .string()
    .optional()
    .describe(
      'Free-text query, QLever full-text search over the graph. Supports "term1 term2" (AND) and "a or b" (OR groups). Omit to browse without a keyword.'
    ),
  exactMatch: z
    .boolean()
    .optional()
    .describe('Match whole words (default true). False enables prefix matching.'),
  resourceType: z
    .enum(RESOURCE_TYPES)
    .optional()
    .describe('Resource Type facet (default "all").'),
  keywords: z.array(z.string()).optional().describe('Keywords facet: schema:keywords values.'),
  places: z
    .array(z.string())
    .optional()
    .describe('Place facet: schema:spatialCoverage/name values.'),
  publishers: z
    .array(z.string())
    .optional()
    .describe('Publisher/Repo facet: schema:publisher name or legalName values.'),
  variablesMeasured: z
    .array(z.string())
    .optional()
    .describe('Variables Measured facet: substring match on PropertyValue names.'),
  yearPublished: rangeShape('from', 'to', 'year'),
  temporalCoverage: rangeShape('from', 'to', 'year'),
  depth: rangeShape('min', 'max', 'meters, positive'),
  boundingBox: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .optional()
    .describe('Spatial Filter facet: decimal degrees; west > east crosses the dateline.'),
};

const paginationArgs = {
  limit: z.number().int().positive().optional().describe('Page size (capped by MCP_LIMIT_MAX).'),
  offset: z.number().int().nonnegative().optional().describe('Page offset.'),
  includeSparql: z
    .boolean()
    .optional()
    .describe('Include the generated SPARQL in the response.'),
  includeSpatialCoverage: z
    .boolean()
    .optional()
    .describe(
      'Return each result\'s schema:spatialCoverage - place names, the bounds of its point ' +
        'coordinates, and box/polygon/line shape counts (default true; costs one extra query).'
    ),
};

const jsonContent = (payload) => ({
  content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
});

const errorContent = (err) => ({
  isError: true,
  content: [{ type: 'text', text: `Search failed: ${(err && err.message) || String(err)}` }],
});

function hasActiveFilters(filters) {
  return Object.keys(filters || {}).some((key) => {
    const value = filters[key];
    return Array.isArray(value) ? value.length > 0 : !!value;
  });
}

/**
 * Build an MCP server instance. One per request in the stateless HTTP transport.
 * @param {object} [config] - facets config override (endpoint, limits, FACETS)
 */
function createMcpServer(config = getFacetsConfig()) {
  const service = new FacetSearchService(config);
  const server = new McpServer(
    { name: 'geocodes-facetsearch', version: '1.0.0' },
    {
      instructions:
        'Faceted search over the EarthCube GeoCodes QLever SPARQL endpoint. Use describe_facets ' +
        'to see available facets, list_facet_values to discover the values of one facet (with counts) ' +
        'for the current search, and search_datasets to retrieve matching datasets.',
    }
  );

  server.registerTool(
    'describe_facets',
    {
      title: 'Describe facets',
      description:
        'List the facets available for search (the same facets as the web UI sidebar) and the SPARQL endpoint queried.',
      inputSchema: {},
    },
    async () =>
      jsonContent({
        endpoint: config.TRIPLESTORE_URL,
        queryEngine: config.QUERY_ENGINE,
        defaultLimit: config.LIMIT_DEFAULT,
        maxLimit: config.LIMIT_MAX,
        resourceTypes: RESOURCE_TYPES,
        facets: (config.FACETS || []).map((f) => ({
          field: f.field,
          title: f.title,
          type: f.type,
          searchArgument: {
            resourceType: 'resourceType',
            kw: 'keywords',
            placenames: 'places',
            pubname: 'publishers',
            datep: 'yearPublished',
            temporalCoverage: 'temporalCoverage',
            minDepth: 'depth',
            spatialCoverage: 'boundingBox',
            variableMeasured: 'variablesMeasured',
          }[f.field],
        })),
      })
  );

  server.registerTool(
    'search_datasets',
    {
      title: 'Search datasets',
      description:
        'Search datasets, tools and catalogs in the GeoCodes graph with the facets of the web UI. ' +
        'Returns one page of results with name, description, publisher, keywords, places, dates, ' +
        'spatial coverage and distribution URLs.',
      inputSchema: { ...facetArgs, ...paginationArgs },
    },
    async (args) => {
      try {
        const params = toSearchParams(args, config);
        const { sparql, results } = await service.search(params, {
          includeSpatialCoverage: args.includeSpatialCoverage !== false,
        });
        return jsonContent({
          query: {
            textQuery: params.textQuery,
            resourceType: params.resourceType,
            filters: params.filters,
            limit: params.limit,
            offset: params.offset,
          },
          returned: results.length,
          results: results.map(toResultRecord),
          ...(args.includeSparql ? { sparql } : {}),
        });
      } catch (err) {
        return errorContent(err);
      }
    }
  );

  server.registerTool(
    'count_datasets',
    {
      title: 'Count datasets',
      description:
        'Total number of matches for a faceted search, without paging through results. ' +
        'Counts distinct datasets when facet filters are active, matching the UI result counts.',
      inputSchema: { ...facetArgs, includeSparql: paginationArgs.includeSparql },
    },
    async (args) => {
      try {
        const params = toSearchParams(args, config);
        const { sparql, count } = await service.count(params, {
          countDistinctSubjects: hasActiveFilters(params.filters),
        });
        return jsonContent({
          count,
          query: {
            textQuery: params.textQuery,
            resourceType: params.resourceType,
            filters: params.filters,
          },
          ...(args.includeSparql ? { sparql } : {}),
        });
      } catch (err) {
        return errorContent(err);
      }
    }
  );

  server.registerTool(
    'list_facet_values',
    {
      title: 'List facet values',
      description:
        'Distinct values of one facet with dataset counts for the current search, like the UI sidebar. ' +
        'The requested facet\'s own filters are ignored so the full option list is returned.',
      inputSchema: {
        field: z
          .string()
          .describe(
            'Facet field from describe_facets, e.g. kw, placenames, pubname, variableMeasured.'
          ),
        ...facetArgs,
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Maximum number of values to return (default 200).'),
        includeSparql: paginationArgs.includeSparql,
      },
    },
    async (args) => {
      try {
        const params = toSearchParams(args, config);
        const limit = Number.isFinite(Number(args.limit)) && Number(args.limit) > 0
          ? Math.min(Number(args.limit), 1000)
          : 200;
        const { sparql, values } = await service.facetValues(
          args.field,
          {
            filters: params.filters,
            textQuery: params.textQuery,
            searchExactMatch: params.searchExactMatch,
            resourceType: params.resourceType,
          },
          limit
        );
        return jsonContent({
          field: args.field,
          returned: values.length,
          values,
          ...(args.includeSparql ? { sparql } : {}),
        });
      } catch (err) {
        return errorContent(err);
      }
    }
  );

  return server;
}

module.exports = { createMcpServer };
