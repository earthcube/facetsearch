# Vendored SPARQL query builder

`services/SparqlQueryBuilder.js` and `utils/queryParser.js` are **byte-identical copies**
of the client sources:

- `client/src/services/SparqlQueryBuilder.js`
- `client/src/utils/queryParser.js`

They are copied here (rather than imported) because the server image is built from the
`server/` directory only (see `server/Dockerfile` and the API workflow's `context: ./server`),
so the client tree is not available at runtime.

Copying them keeps the MCP endpoint's SPARQL identical to what the facet UI sends to QLever,
including the QLever-specific workarounds (selective subject subqueries, candidate subqueries
for structured text search, depth/geo/range filter shapes).

`package.json` here only marks the directory as ESM so the copies can stay verbatim; the
CommonJS server code loads them with a dynamic `import()`.

## Re-sync after changing the client builder

```bash
cd server
yarn sync:vendor
git diff --stat mcp/vendor
```
