#!/usr/bin/env node
/**
 * Facet Query Performance Tester
 *
 * Runs SPARQL queries from the FacetSearch query templates against configured
 * endpoints and reports timing, result counts, and optional comparison data.
 *
 * Usage:
 *   node tools/query-perf/query-perf.js --help
 */

const fs = require("fs");
const path = require("path");
const yaml = require("./lib/yaml-lite");

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const USAGE = `
Usage: node query-perf.js [options]

Options:
  --config <path>        Path to a YAML config file (default: client/public/config/config.yaml)
  --query <name>         Query template name, e.g. sparql_query, sparql_hastools (default: sparql_query)
  --query-file <path>    Path to a custom query template file (overrides --query)
  --endpoint <url>       Override the SPARQL endpoint URL from config
  --engine <name>        Query engine: blazegraph | qlever (default: from config)
  --search <terms>       Search terms for the main query (default: "water")
  --exact <bool>         Match all terms exactly (default: false)
  --resource-type <type> Resource type filter: data | tool | all (default: all)
  --limit <n>            Result limit (default: 10)
  --offset <n>           Result offset (default: 0)
  --timeout <ms>         HTTP request timeout in ms (default: 30000)
  --runs <n>             Number of times to run the query (default: 3)
  --warmup <n>           Warmup runs before measurement (default: 1)
  --var <key=value>      Set arbitrary template variable (repeatable)
  --show-query           Print the rendered SPARQL query
  --show-results         Print the first few result rows
  --json                 Output results as JSON
  --compare <path>       Compare against a previous JSON result file
  --help                 Show this help message

Examples:
  # Basic search performance test
  node query-perf.js --search "ocean temperature" --runs 5

  # Test with a different config
  node query-perf.js --config client/public/config/config_aws_prod.yaml --search "water"

  # Test the related-data query
  node query-perf.js --query sparql_relateddatafilename --var relatedData=ocean --limit 20

  # Custom query file with JSON output
  node query-perf.js --query-file my_query.txt --search coral --json

  # Compare performance across runs
  node query-perf.js --search water --json > baseline.json
  node query-perf.js --search water --compare baseline.json
`;

function parseArgs(argv) {
  const args = {
    config: null,
    query: "sparql_query",
    queryFile: null,
    endpoint: null,
    engine: null,
    search: "water",
    exact: "false",
    resourceType: "all",
    limit: 10,
    offset: 0,
    timeout: 30000,
    runs: 3,
    warmup: 1,
    vars: {},
    showQuery: false,
    showResults: false,
    json: false,
    compare: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--config": args.config = next(); break;
      case "--query": args.query = next(); break;
      case "--query-file": args.queryFile = next(); break;
      case "--endpoint": args.endpoint = next(); break;
      case "--engine": args.engine = next(); break;
      case "--search": args.search = next(); break;
      case "--exact": args.exact = next(); break;
      case "--resource-type": args.resourceType = next(); break;
      case "--limit": args.limit = parseInt(next(), 10); break;
      case "--offset": args.offset = parseInt(next(), 10); break;
      case "--timeout": args.timeout = parseInt(next(), 10); break;
      case "--runs": args.runs = parseInt(next(), 10); break;
      case "--warmup": args.warmup = parseInt(next(), 10); break;
      case "--var": {
        const kv = next();
        const eq = kv.indexOf("=");
        if (eq === -1) { console.error(`Invalid --var format: ${kv} (expected key=value)`); process.exit(1); }
        args.vars[kv.slice(0, eq)] = kv.slice(eq + 1);
        break;
      }
      case "--show-query": args.showQuery = true; break;
      case "--show-results": args.showResults = true; break;
      case "--json": args.json = true; break;
      case "--compare": args.compare = next(); break;
      case "--help": console.log(USAGE); process.exit(0);
      default:
        console.error(`Unknown option: ${arg}\n`);
        console.log(USAGE);
        process.exit(1);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

function resolveConfigPath(configArg) {
  if (configArg) return path.resolve(configArg);
  // Try common locations relative to repo root
  const candidates = [
    path.resolve("client/public/config/config.yaml"),
    path.resolve("../client/public/config/config.yaml"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  console.error("Could not find config.yaml. Use --config to specify its path.");
  process.exit(1);
}

function loadConfig(configPath) {
  const raw = fs.readFileSync(configPath, "utf8");
  return yaml.parse(raw);
}

// ---------------------------------------------------------------------------
// Query template loading and rendering
// ---------------------------------------------------------------------------

function loadQueryTemplate(args, config) {
  if (args.queryFile) {
    return fs.readFileSync(path.resolve(args.queryFile), "utf8");
  }
  const engine = args.engine || config.QUERY_ENGINE || "blazegraph";
  // The query name may or may not have .txt extension in the config
  let queryFileName = args.query;
  // Check if the config has a mapping for this query name
  const configKey = args.query.toUpperCase().replace("SPARQL_", "SPARQL_");
  if (config[configKey]) {
    queryFileName = config[configKey];
  }
  if (!queryFileName.endsWith(".txt")) {
    queryFileName += ".txt";
  }

  const configDir = path.dirname(resolveConfigPath(args.config));
  const candidates = [
    path.resolve(configDir, "..", "queries", engine, queryFileName),
    path.resolve("client/public/queries", engine, queryFileName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return fs.readFileSync(c, "utf8");
  }
  console.error(`Query template not found: ${queryFileName} (engine: ${engine})`);
  console.error("Searched:", candidates.join("\n  "));
  process.exit(1);
}

function buildResourceTypeFilter(resourceType) {
  const rtMap = {
    data: '{ ?subj rdf:type schema:Dataset . } UNION { ?subj rdf:type sschema:Dataset . }',
    tool: '{ ?subj rdf:type schema:SoftwareApplication . } UNION { ?subj rdf:type sschema:SoftwareApplication . }',
    all: "",
  };
  return rtMap[resourceType] || "";
}

function renderTemplate(template, vars) {
  // Replaces ${varName} in the template with the corresponding value.
  // Matches the underscore.js-style interpolation used in the client.
  return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const k = key.trim();
    if (k in vars) return vars[k];
    // Leave unresolved variables as empty string with a warning
    return "";
  });
}

// ---------------------------------------------------------------------------
// SPARQL execution
// ---------------------------------------------------------------------------

async function executeSparqlQuery(endpointUrl, sparql, timeout) {
  const params = new URLSearchParams();
  params.append("query", sparql);
  params.append("queryLn", "sparql");

  const url = `${endpointUrl}?${params.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/sparql-results+json" },
      signal: controller.signal,
    });
    const elapsed = performance.now() - start;

    if (!response.ok) {
      const body = await response.text();
      return { elapsed, error: `HTTP ${response.status}: ${body.slice(0, 500)}`, resultCount: 0, results: null };
    }
    const data = await response.json();
    const bindings = data.results ? data.results.bindings : [];
    return { elapsed, error: null, resultCount: bindings.length, results: data };
  } catch (err) {
    const elapsed = performance.now() - start;
    const msg = err.name === "AbortError" ? `Timeout after ${timeout}ms` : err.message;
    return { elapsed, error: msg, resultCount: 0, results: null };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function computeStats(timings) {
  const sorted = [...timings].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / sorted.length;
  const stddev = Math.sqrt(variance);
  // p95 - for small arrays this is approximate
  const p95idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  const p95 = sorted[p95idx];
  return { mean, median, min, max, stddev, p95, count: sorted.length };
}

function fmt(ms) {
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function loadComparison(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error(`Could not load comparison file: ${e.message}`);
    return null;
  }
}

function printComparison(current, baseline) {
  const pct = ((current.stats.median - baseline.stats.median) / baseline.stats.median * 100).toFixed(1);
  const sign = pct >= 0 ? "+" : "";
  console.log("\n--- Comparison vs Baseline ---");
  console.log(`Baseline median: ${fmt(baseline.stats.median)}`);
  console.log(`Current median:  ${fmt(current.stats.median)}`);
  console.log(`Change:          ${sign}${pct}%`);
  if (current.resultCount !== baseline.resultCount) {
    console.log(`Result count changed: ${baseline.resultCount} -> ${current.resultCount}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configPath = resolveConfigPath(args.config);
  const config = loadConfig(configPath);

  const endpointUrl = args.endpoint || config.SUMMARYSTORE_URL || config.TRIPLESTORE_URL;
  if (!endpointUrl) {
    console.error("No SPARQL endpoint URL found in config or --endpoint.");
    process.exit(1);
  }

  const template = loadQueryTemplate(args, config);

  // Build template variables
  const templateVars = {
    q: args.search,
    exact: args.exact,
    n: String(args.limit),
    o: String(args.offset),
    rt: buildResourceTypeFilter(args.resourceType),
    minRelevance: "",
    relatedData: args.search,
    g: "",
    ecrr_service: config.ECRR_TRIPLESTORE_URL || "",
    ecrr_graph: config.ECRR_GRAPH || "",
    ...args.vars,
  };

  const sparql = renderTemplate(template, templateVars);

  if (!args.json) {
    console.log(`Config:    ${path.relative(process.cwd(), configPath)}`);
    console.log(`Endpoint:  ${endpointUrl}`);
    console.log(`Query:     ${args.queryFile || args.query}`);
    console.log(`Search:    "${args.search}"`);
    console.log(`Limit:     ${args.limit}  Offset: ${args.offset}`);
    console.log(`Runs:      ${args.runs} (+ ${args.warmup} warmup)`);
    console.log(`Timeout:   ${args.timeout}ms`);
    console.log("");
  }

  if (args.showQuery) {
    console.log("--- Rendered SPARQL Query ---");
    console.log(sparql);
    console.log("--- End Query ---\n");
  }

  // Warmup runs
  for (let i = 0; i < args.warmup; i++) {
    if (!args.json) process.stdout.write(`Warmup ${i + 1}/${args.warmup}...`);
    const r = await executeSparqlQuery(endpointUrl, sparql, args.timeout);
    if (!args.json) console.log(` ${fmt(r.elapsed)}${r.error ? ` ERROR: ${r.error}` : ""}`);
  }

  // Measured runs
  const timings = [];
  let lastResult = null;
  let lastResultCount = 0;
  const errors = [];

  for (let i = 0; i < args.runs; i++) {
    if (!args.json) process.stdout.write(`Run ${i + 1}/${args.runs}...`);
    const r = await executeSparqlQuery(endpointUrl, sparql, args.timeout);
    if (!args.json) console.log(` ${fmt(r.elapsed)} (${r.resultCount} results)${r.error ? ` ERROR: ${r.error}` : ""}`);
    timings.push(r.elapsed);
    lastResultCount = r.resultCount;
    if (r.results) lastResult = r.results;
    if (r.error) errors.push({ run: i + 1, error: r.error });
  }

  const stats = computeStats(timings);

  if (args.showResults && lastResult) {
    console.log("\n--- Sample Results (first 5) ---");
    const bindings = lastResult.results.bindings.slice(0, 5);
    for (const row of bindings) {
      const display = {};
      for (const [k, v] of Object.entries(row)) {
        display[k] = v.value ? v.value.slice(0, 80) : v;
      }
      console.log(JSON.stringify(display, null, 2));
    }
  }

  const output = {
    config: path.relative(process.cwd(), configPath),
    endpoint: endpointUrl,
    query: args.queryFile || args.query,
    search: args.search,
    limit: args.limit,
    offset: args.offset,
    runs: args.runs,
    warmup: args.warmup,
    resultCount: lastResultCount,
    errors,
    timings,
    stats: {
      mean: Math.round(stats.mean * 100) / 100,
      median: Math.round(stats.median * 100) / 100,
      min: Math.round(stats.min * 100) / 100,
      max: Math.round(stats.max * 100) / 100,
      stddev: Math.round(stats.stddev * 100) / 100,
      p95: Math.round(stats.p95 * 100) / 100,
    },
    timestamp: new Date().toISOString(),
  };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log("\n--- Performance Summary ---");
    console.log(`Results:   ${lastResultCount}`);
    console.log(`Mean:      ${fmt(stats.mean)}`);
    console.log(`Median:    ${fmt(stats.median)}`);
    console.log(`Min:       ${fmt(stats.min)}`);
    console.log(`Max:       ${fmt(stats.max)}`);
    console.log(`Std Dev:   ${fmt(stats.stddev)}`);
    console.log(`P95:       ${fmt(stats.p95)}`);
    if (errors.length > 0) {
      console.log(`Errors:    ${errors.length}/${args.runs}`);
    }
  }

  // Comparison
  if (args.compare) {
    const baseline = loadComparison(args.compare);
    if (baseline) {
      if (args.json) {
        const pct = ((stats.median - baseline.stats.median) / baseline.stats.median * 100);
        output.comparison = {
          baselineFile: args.compare,
          baselineMedian: baseline.stats.median,
          currentMedian: output.stats.median,
          changePercent: Math.round(pct * 10) / 10,
          resultCountChanged: lastResultCount !== baseline.resultCount,
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        printComparison(output, baseline);
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
