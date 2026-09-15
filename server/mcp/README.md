# MCP facet search endpoint

`POST /mcp` speaks the [Model Context Protocol](https://modelcontextprotocol.io) over the
Streamable HTTP transport, exposing the same faceted search the web UI runs against the
QLever SPARQL endpoint.

The endpoint is **stateless**: each request gets its own server and transport, so no session
header is needed and any number of clients can call it. `GET`/`DELETE` return 405.

## Tools

| Tool | What it does |
| --- | --- |
| `describe_facets` | Lists the available facets (field, title, type, matching tool argument) and the endpoint being queried. |
| `search_datasets` | One page of results for a free-text query plus facet filters. Returns name, description, publisher, keywords, places, dates, spatial coverage, distribution URLs and the dataset id used by `/dataset/:id`. |
| `count_datasets` | Total matches for the same arguments, without paging. Counts distinct datasets when facet filters are active, matching the UI's result counts. |
| `list_facet_values` | Distinct values of one facet with dataset counts for the current search — the sidebar's option list. The requested facet's own filters are excluded. |

## Facet arguments

Shared by all search tools; they map 1:1 onto the UI facets:

| Argument | Facet | Shape |
| --- | --- | --- |
| `q` | search box | string; `"a b"` is AND, `"a or b"` builds OR groups |
| `exactMatch` | exact match toggle | boolean, default `true` |
| `resourceType` | Resource Type | `all` \| `data` \| `tool` \| `DataCatalog` |
| `keywords` | Keywords | array of `schema:keywords` values |
| `places` | Place | array of `schema:spatialCoverage/name` values |
| `publishers` | Publisher/Repo | array of publisher name/legalName values |
| `variablesMeasured` | Variables Measured | array of PropertyValue names (substring match) |
| `yearPublished` | Year Published Range | `{ from, to }` years |
| `temporalCoverage` | Temporal Coverage | `{ from, to }` years |
| `depth` | Depth Range | `{ min, max }` meters, positive |
| `boundingBox` | Spatial Filter | `{ north, south, east, west }` degrees; `west > east` crosses the dateline |

`search_datasets` also takes `limit`, `offset`, and every tool takes `includeSparql` to return
the generated query for debugging.

## Spatial coverage in results

The facet query filters on `schema:spatialCoverage` but does not project it, so
`search_datasets` looks it up for the page's subjects in a follow-up query (`mcp/spatialCoverage.js`)
and returns it per result:

```json
"spatialCoverage": {
  "placeNames": ["Valles Caldera, Jemez River Basin, New Mexico"],
  "boundingBox": { "north": 35.88, "south": 35.85, "east": -106.45, "west": -106.54 },
  "pointCount": 12,
  "boxes": ["-106.53741, 35.847832 -106.449356, 35.883173"],
  "polygonCount": 0,
  "lineCount": 0
}
```

`boundingBox` is the min/max of the record's `schema:geo` point coordinates; it is a plain
span, so a record spanning the dateline reports `west` east of `east`. `boxes` are
`schema:box` literals passed through verbatim because their coordinate order varies by
source, and polygons and lines are counted rather than returned since they are large GeoJSON
blobs — read those from the dataset record. `spatialCoverage` is `null` when the record has
none. Pass `includeSpatialCoverage: false` to skip the extra query.

Latitudes and longitudes are stored both as `xsd:decimal` and as plain string literals, so
both the `boundingBox` filter and this lookup cast with `xsd:double(STR(...))` before
comparing; without the cast, string-typed coordinates are silently missed.

## Configuration

Environment variables (see `env.full.example`): `TRIPLESTORE_URL`, `QUERY_ENGINE`,
`SPARQL_TIMEOUT`, `MCP_LIMIT_DEFAULT`, `MCP_LIMIT_MAX`. Facet definitions live in
`mcp/facetsConfig.js` and mirror the `FACETS` block of
`client/public/config/config_qlever.yaml`.

## Try it

```bash
curl -s -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_datasets","arguments":{"q":"water","keywords":["Oceanography"],"limit":3}}}'
```

Register it with an MCP client (Claude Code, for example):

```bash
claude mcp add --transport http geocodes http://localhost:3000/mcp
```

## SPARQL construction

Queries are built by `mcp/vendor/services/SparqlQueryBuilder.js`, a verbatim copy of the
client's builder, so the SPARQL sent here is the SPARQL the facet UI sends — including the
QLever-specific workarounds. Re-sync it with `yarn sync:vendor` after changing the client
builder; see `mcp/vendor/README.md`.
