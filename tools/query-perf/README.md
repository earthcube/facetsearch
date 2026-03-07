# Facet Query Performance Tester

Standalone CLI tool for testing SPARQL query performance without the Vue.js interface. It loads the same config files and query templates used by the client, renders them with configurable parameters, executes them against the SPARQL endpoint, and reports detailed timing statistics.

**No dependencies required** — uses only Node.js built-ins (requires Node.js >= 18 for `fetch`).

## Quick Start

```bash
# From the repo root:

# Basic search test (3 runs + 1 warmup)
node tools/query-perf/query-perf.js --search "ocean temperature"

# See the rendered SPARQL and sample results
node tools/query-perf/query-perf.js --search water --show-query --show-results

# Test a different query template
node tools/query-perf/query-perf.js --query sparql_query_2 --search coral --runs 5

# Test with a different config/endpoint
node tools/query-perf/query-perf.js --config client/public/config/config_aws_prod.yaml --search water

# Override the endpoint directly
node tools/query-perf/query-perf.js --endpoint "https://my-blazegraph:9999/sparql" --search water
```

## Performance Comparison

Save a baseline and compare later:

```bash
# Record baseline
node tools/query-perf/query-perf.js --search water --runs 10 --json > baseline.json

# ... make changes to queries or config ...

# Compare against baseline
node tools/query-perf/query-perf.js --search water --runs 10 --compare baseline.json
```

## Batch Testing

Run a suite of tests from a plan file:

```bash
# Run the example test plan
node tools/query-perf/batch-perf.js tools/query-perf/example-test-plan.json

# JSON output for CI/scripts
node tools/query-perf/batch-perf.js tools/query-perf/example-test-plan.json --json
```

### Test Plan Format

```json
{
  "defaults": {
    "runs": 3,
    "warmup": 1,
    "limit": 10,
    "timeout": 30000
  },
  "tests": [
    { "name": "basic search", "search": "water" },
    { "name": "large result set", "search": "water", "limit": 1000 },
    { "name": "different config", "search": "water", "config": "client/public/config/config_aws_prod.yaml" },
    { "name": "related data query", "query": "sparql_relateddatafilename", "vars": { "relatedData": "ocean" } }
  ]
}
```

## All Options

| Option | Default | Description |
|--------|---------|-------------|
| `--config <path>` | `client/public/config/config.yaml` | YAML config file path |
| `--query <name>` | `sparql_query` | Query template name (without .txt) |
| `--query-file <path>` | — | Path to a custom query template file |
| `--endpoint <url>` | from config | Override SPARQL endpoint URL |
| `--engine <name>` | from config | Query engine: `blazegraph` or `qlever` |
| `--search <terms>` | `water` | Search terms |
| `--exact <bool>` | `false` | Exact match mode |
| `--resource-type <type>` | `all` | Filter: `data`, `tool`, or `all` |
| `--limit <n>` | `10` | SPARQL LIMIT |
| `--offset <n>` | `0` | SPARQL OFFSET |
| `--timeout <ms>` | `30000` | HTTP timeout per request |
| `--runs <n>` | `3` | Number of measured runs |
| `--warmup <n>` | `1` | Warmup runs (not measured) |
| `--var <key=value>` | — | Set arbitrary template variable (repeatable) |
| `--show-query` | — | Print the rendered SPARQL |
| `--show-results` | — | Print first 5 result rows |
| `--json` | — | Machine-readable JSON output |
| `--compare <path>` | — | Compare against previous JSON results |

## Output

### Human-readable (default)

```
Config:    client/public/config/config.yaml
Endpoint:  https://graph.geocodes-aws.earthcube.org/blazegraph/namespace/obisdepth_summary/sparql
Query:     sparql_query
Search:    "water"
Limit:     10  Offset: 0
Runs:      3 (+ 1 warmup)
Timeout:   30000ms

Warmup 1/1... 1.234s
Run 1/3... 856.2ms (10 results)
Run 2/3... 743.1ms (10 results)
Run 3/3... 801.5ms (10 results)

--- Performance Summary ---
Results:   10
Mean:      800.3ms
Median:    801.5ms
Min:       743.1ms
Max:       856.2ms
Std Dev:   46.2ms
P95:       856.2ms
```

### JSON (`--json`)

```json
{
  "config": "client/public/config/config.yaml",
  "endpoint": "...",
  "query": "sparql_query",
  "search": "water",
  "resultCount": 10,
  "timings": [856.2, 743.1, 801.5],
  "stats": { "mean": 800.3, "median": 801.5, "min": 743.1, "max": 856.2, "stddev": 46.2, "p95": 856.2 },
  "timestamp": "2026-03-07T12:00:00.000Z"
}
```

## Available Query Templates

These correspond to the query files in `client/public/queries/<engine>/`:

| Name | Description | Key Variables |
|------|-------------|---------------|
| `sparql_query` | Main full-text search | `q`, `exact`, `n`, `o`, `minRelevance` |
| `sparql_query_2` | Extended search with resource types | `q`, `n`, `o` |
| `sparql_hastools` | Check if dataset has tools (ASK) | `g`, `ecrr_service`, `ecrr_graph` |
| `sparql_gettools_webservice` | Find processing tools | `g`, `ecrr_service`, `ecrr_graph` |
| `sparql_gettools_download` | Find downloadable tools | `g`, `ecrr_service`, `ecrr_graph` |
| `sparql_relateddatafilename` | Find related datasets | `relatedData`, `n` |
