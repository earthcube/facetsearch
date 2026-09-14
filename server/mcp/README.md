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
| `search_datasets` | One page of results for a free-text query plus facet filters. Returns name, description, publisher, keywords, places, dates, distribution URLs and the dataset id used by `/dataset/:id`. |
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
