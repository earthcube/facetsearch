# Facet Query Performance Tester

CLI tool for testing SPARQL facet query performance. Uses the **production `SparqlQueryBuilder`** from `client/src/services/SparqlQueryBuilder.js` to generate queries identical to what the Vue.js app produces, then executes them against the configured endpoint and reports timing statistics.

Test scenarios are stored as JSON files so you can reproduce tests and investigate poor performance manually.

**No external dependencies** — uses only Node.js built-ins (requires Node.js >= 18 for `fetch`) and imports the client's query builder directly.

## Quick Start

```bash
# From the repo root:

# Basic search test (no facet filters)
node tools/query-perf/query-perf.js --search "ocean temperature"

# Test with a keyword facet filter active
node tools/query-perf/query-perf.js --search water \
  --facet '{"type":"text","field":"kw","active":true,"values":["Temperature","Ocean"]}'

# Test with depth range filter
node tools/query-perf/query-perf.js --search water \
  --facet '{"type":"depthrange","field":"minDepth","active":true,"values":{"min":-1000,"max":0}}'

# Combine multiple facets
node tools/query-perf/query-perf.js --search water \
  --facet '{"type":"text","field":"kw","active":true,"values":["Temperature"]}' \
  --facet '{"type":"geo","field":"spatialCoverage","active":true,"values":{"minLat":20,"maxLat":60,"minLon":-80,"maxLon":0}}'

# See the generated SPARQL query
node tools/query-perf/query-perf.js --search water --show-query \
  --facet '{"type":"depthrange","field":"minDepth","active":true,"values":{"min":-500,"max":0}}'
```

## How It Works

```
Scenario JSON / CLI args
    |
    v
scenario-adapter.js  -->  searchParams (same format as client app)
    |
    v
SparqlQueryBuilder.buildQuery(searchParams)  (from client/src/services/)
    |
    v
SPARQL query string  -->  HTTP GET to SPARQL endpoint  -->  timing stats
```

The tool imports the same `SparqlQueryBuilder` class the client app uses. This means:
- Queries are **identical** to what users see in the browser
- Any query logic changes in the client are automatically picked up
- No duplicate SPARQL generation code to maintain

## Stored Test Scenarios

Scenarios define reusable test suites for each facet type. They're stored as JSON in `scenarios/` and can be re-run for regression testing.

```bash
# Run a single scenario file
node tools/query-perf/query-perf.js --scenario tools/query-perf/scenarios/depth-range.json

# Run ALL scenarios in the directory
node tools/query-perf/query-perf.js --scenario tools/query-perf/scenarios/

# Save results for later comparison
node tools/query-perf/query-perf.js --scenario tools/query-perf/scenarios/multi-facet.json \
  --save results/baseline.json

# Compare against a saved baseline
node tools/query-perf/query-perf.js --scenario tools/query-perf/scenarios/multi-facet.json \
  --compare results/baseline.json
```

### Available Scenarios

| File | Facet Type | Tests |
|------|-----------|-------|
| `text-keywords.json` | text (kw) | Discovery, single value, multiple values, many values |
| `text-publisher.json` | text (pubname) | Discovery, single publisher, multiple publishers |
| `text-places.json` | text (placenames) | Discovery, single place, multiple places |
| `text-resource-type.json` | text (resourceType) | No filter, data only, tools only, data+tools |
| `depth-range.json` | depthrange | Discovery, shallow, mid, deep, full range |
| `temporal-coverage.json` | rangeyear | Discovery, narrow/wide/historical/recent ranges |
| `date-published.json` | rangeyear (datep) | Discovery, last 5 years, last decade |
| `geo-spatial.json` | geo | Discovery, North Atlantic, Pacific, US west coast, small region, global |
| `multi-facet.json` | combined | Multiple facets active simultaneously (the stress tests) |

### Scenario File Format

```json
{
  "name": "Depth range facet",
  "description": "Test depth range filtering with various min/max values",
  "tests": [
    {
      "name": "depth: discovery only",
      "search": "water",
      "facets": [
        { "type": "depthrange", "field": "minDepth", "active": false }
      ]
    },
    {
      "name": "depth: shallow (0 to -100m)",
      "search": "water",
      "facets": [
        { "type": "depthrange", "field": "minDepth", "active": true, "values": { "min": -100, "max": 0 } }
      ]
    }
  ]
}
```

### Facet Types and Values

| Type | Field | Values Format | Example |
|------|-------|---------------|---------|
| `text` | `kw` | `string[]` | `["Temperature", "Ocean"]` |
| `text` | `pubname` | `string[]` | `["NOAA", "NASA"]` |
| `text` | `placenames` | `string[]` | `["Atlantic Ocean"]` |
| `text` | `resourceType` | `string[]` | `["data", "tool"]` |
| `depthrange` | `minDepth` | `{min, max}` | `{"min": -1000, "max": 0}` |
| `rangeyear` | `temporalCoverage` | `{min, max}` | `{"min": 2010, "max": 2025}` |
| `rangeyear` | `datep` | `{min, max}` | `{"min": 2020, "max": 2026}` |
| `geo` | `spatialCoverage` | `{minLat, maxLat, minLon, maxLon}` | `{"minLat": 20, "maxLat": 60, "minLon": -80, "maxLon": 0}` |

## Investigating Poor Performance

When a test shows poor performance, the saved results file contains all the information needed to investigate manually:

1. **Save the results**: `--save results/slow_queries.json`
2. **Inspect the generated SPARQL**: `--show-query`
3. **Copy the SPARQL to YASGUI** for manual analysis at the configured `SPARQL_YASGUI` URL
4. **Adjust the scenario** and re-run to isolate which facet combination causes the slowdown

## All Options

| Option | Default | Description |
|--------|---------|-------------|
| `--config <path>` | auto-detect | YAML config file path |
| `--endpoint <url>` | from config | Override SPARQL endpoint |
| `--engine <name>` | from config | `blazegraph` or `qlever` |
| `--search <terms>` | `water` | Search terms |
| `--exact <bool>` | `false` | Exact match mode |
| `--resource-type <type>` | `all` | `data`, `tool`, or `all` |
| `--limit <n>` | `10` | SPARQL LIMIT |
| `--offset <n>` | `0` | SPARQL OFFSET |
| `--facet <json>` | — | Inline facet filter JSON (repeatable) |
| `--scenario <path>` | — | Scenario file or directory |
| `--timeout <ms>` | `30000` | HTTP timeout per request |
| `--runs <n>` | `3` | Measured runs per test |
| `--warmup <n>` | `1` | Warmup runs (not measured) |
| `--show-query` | — | Print rendered SPARQL |
| `--show-results` | — | Print first 5 result rows |
| `--json` | — | Machine-readable JSON output |
| `--compare <path>` | — | Compare against saved results |
| `--save <path>` | — | Save results to JSON file |
