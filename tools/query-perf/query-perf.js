#!/usr/bin/env node
/**
 * Facet Query Performance Tester
 *
 * Tests SPARQL query performance with facet filter composition. Loads query
 * templates, injects facet-specific SPARQL fragments, executes against the
 * configured endpoint, and reports timing statistics.
 *
 * Supports stored test scenarios (JSON files) that define facet filter
 * parameters for reproducible testing.
 *
 * Usage:
 *   node tools/query-perf/query-perf.js --help
 */

const fs = require("fs");
const path = require("path");
const yaml = require("./lib/yaml-lite");
const { buildFacetFragments, combineFacetFragments } = require("./lib/facet-filters");

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const USAGE = `
Usage: node query-perf.js [options]

Options:
  --config <path>        Path to a YAML config file (default: auto-detect)
  --query <name>         Query template name (default: sparql_query)
  --query-file <path>    Path to a custom query template file
  --endpoint <url>       Override SPARQL endpoint URL from config
  --engine <name>        Query engine: blazegraph | qlever (default: from config)

  --search <terms>       Search terms (default: "water")
  --exact <bool>         Exact match mode (default: false)
  --resource-type <type> Resource type: data | tool | all (default: all)
  --limit <n>            SPARQL LIMIT (default: 10)
  --offset <n>           SPARQL OFFSET (default: 0)

  --facet <json>         Add a facet filter as inline JSON (repeatable)
  --scenario <path>      Load a test scenario file (runs all tests in it)

  --timeout <ms>         HTTP timeout per request (default: 30000)
  --runs <n>             Measured runs per test (default: 3)
  --warmup <n>           Warmup runs (default: 1)
  --var <key=value>      Set arbitrary template variable (repeatable)

  --show-query           Print the rendered SPARQL query
  --show-results         Print first 5 result rows
  --show-fragments       Print the generated facet SPARQL fragments
  --json                 Machine-readable JSON output
  --compare <path>       Compare against a previous JSON result file
  --save <path>          Save results to a JSON file for later comparison
  --help                 Show this help message

Facet JSON format (for --facet):
  --facet '{"type":"text","field":"kw","active":true,"values":["Temperature"]}'
  --facet '{"type":"depthrange","field":"minDepth","active":true,"values":{"min":-1000,"max":0}}'
  --facet '{"type":"rangeyear","field":"temporalCoverage","active":true,"values":{"min":2010,"max":2025}}'
  --facet '{"type":"geo","field":"spatialCoverage","active":true,"values":{"minLat":20,"maxLat":60,"minLon":-80,"maxLon":0}}'

Examples:
  # Basic search test
  node query-perf.js --search "ocean temperature" --runs 5

  # Test with keyword facet filter
  node query-perf.js --search water --facet '{"type":"text","field":"kw","active":true,"values":["Temperature","Ocean"]}'

  # Test with depth range filter
  node query-perf.js --search water --facet '{"type":"depthrange","field":"minDepth","active":true,"values":{"min":-1000,"max":0}}'

  # Run a stored scenario
  node query-perf.js --scenario tools/query-perf/scenarios/depth-range.json

  # Run all scenarios in a directory
  node query-perf.js --scenario tools/query-perf/scenarios/

  # Save results for later comparison
  node query-perf.js --scenario tools/query-perf/scenarios/multi-facet.json --save results/baseline.json

  # Compare against baseline
  node query-perf.js --scenario tools/query-perf/scenarios/multi-facet.json --compare results/baseline.json
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
    facets: [],
    scenario: null,
    showQuery: false,
    showResults: false,
    showFragments: false,
    json: false,
    compare: null,
    save: null,
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
        if (eq === -1) { console.error(`Invalid --var: ${kv} (expected key=value)`); process.exit(1); }
        args.vars[kv.slice(0, eq)] = kv.slice(eq + 1);
        break;
      }
      case "--facet": {
        try { args.facets.push(JSON.parse(next())); }
        catch (e) { console.error(`Invalid --facet JSON: ${e.message}`); process.exit(1); }
        break;
      }
      case "--scenario": args.scenario = next(); break;
      case "--show-query": args.showQuery = true; break;
      case "--show-results": args.showResults = true; break;
      case "--show-fragments": args.showFragments = true; break;
      case "--json": args.json = true; break;
      case "--compare": args.compare = next(); break;
      case "--save": args.save = next(); break;
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
  return yaml.parse(fs.readFileSync(configPath, "utf8"));
}

// ---------------------------------------------------------------------------
// Query template loading and rendering
// ---------------------------------------------------------------------------

function loadQueryTemplate(args, config) {
  if (args.queryFile) {
    return fs.readFileSync(path.resolve(args.queryFile), "utf8");
  }
  const engine = args.engine || config.QUERY_ENGINE || "blazegraph";
  let queryFileName = args.query;
  const configKey = args.query.toUpperCase();
  if (config[configKey]) queryFileName = config[configKey];

  // Try both .txt and .rq extensions
  const baseName = queryFileName.replace(/\.(txt|rq)$/, "");

  const configDir = path.dirname(resolveConfigPath(args.config));
  const searchDirs = [
    path.resolve(configDir, "..", "queries", engine),
    path.resolve("client/public/queries", engine),
  ];

  for (const dir of searchDirs) {
    for (const ext of [".rq", ".txt", ""]) {
      const candidate = path.join(dir, baseName + ext);
      if (fs.existsSync(candidate)) return fs.readFileSync(candidate, "utf8");
    }
    // Also try the original filename as-is
    const asIs = path.join(dir, queryFileName);
    if (fs.existsSync(asIs)) return fs.readFileSync(asIs, "utf8");
  }
  console.error(`Query template not found: ${queryFileName} (engine: ${engine})`);
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
  return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const k = key.trim();
    if (k in vars) return vars[k];
    return "";
  });
}

// ---------------------------------------------------------------------------
// Query composition: base template + facet fragments
// ---------------------------------------------------------------------------

function composeQuery(template, templateVars, facetFragments) {
  let sparql = renderTemplate(template, templateVars);

  if (facetFragments && facetFragments.length > 0) {
    const fragmentText = combineFacetFragments(facetFragments);

    // Inject facet fragments before the closing } of the WHERE clause.
    // Find the GROUP BY / ORDER BY / LIMIT to locate where WHERE ends.
    const groupByIdx = sparql.search(/\n\s*(GROUP\s+BY|ORDER\s+BY|LIMIT)\b/i);
    if (groupByIdx !== -1) {
      const beforeGroupBy = sparql.slice(0, groupByIdx);
      const lastBrace = beforeGroupBy.lastIndexOf("}");
      if (lastBrace !== -1) {
        sparql = sparql.slice(0, lastBrace) +
          "\n\n  # === FACET FILTERS ===\n" + fragmentText + "\n\n" +
          sparql.slice(lastBrace);
      }
    }
  }

  return sparql;
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
  const p95idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  const p95 = sorted[p95idx];
  return { mean, median, min, max, stddev, p95, count: sorted.length };
}

function fmt(ms) {
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
}

function roundStats(stats) {
  const r = (v) => Math.round(v * 100) / 100;
  return { mean: r(stats.mean), median: r(stats.median), min: r(stats.min), max: r(stats.max), stddev: r(stats.stddev), p95: r(stats.p95) };
}

// ---------------------------------------------------------------------------
// Scenario loading
// ---------------------------------------------------------------------------

function loadScenarios(scenarioPath) {
  const resolved = path.resolve(scenarioPath);
  const stat = fs.statSync(resolved);

  if (stat.isDirectory()) {
    const files = fs.readdirSync(resolved).filter((f) => f.endsWith(".json")).sort();
    const scenarios = [];
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(resolved, file), "utf8"));
      data._file = file;
      scenarios.push(data);
    }
    return scenarios;
  }

  const data = JSON.parse(fs.readFileSync(resolved, "utf8"));
  data._file = path.basename(resolved);
  return [data];
}

// ---------------------------------------------------------------------------
// Single test execution
// ---------------------------------------------------------------------------

async function runSingleTest(testDef, args, config, configPath) {
  const endpointUrl = args.endpoint || config.SUMMARYSTORE_URL || config.TRIPLESTORE_URL;
  const search = testDef.search || args.search;
  const limit = testDef.limit || args.limit;
  const offset = testDef.offset || args.offset;
  const facets = testDef.facets || args.facets;

  const template = loadQueryTemplate(args, config);

  const templateVars = {
    q: search,
    exact: testDef.exact || args.exact,
    n: String(limit),
    o: String(offset),
    rt: buildResourceTypeFilter(testDef.resourceType || args.resourceType),
    minRelevance: "",
    relatedData: search,
    g: "",
    ecrr_service: config.ECRR_TRIPLESTORE_URL || "",
    ecrr_graph: config.ECRR_GRAPH || "",
    ...args.vars,
    ...(testDef.vars || {}),
  };

  // Build facet fragments
  const facetFragments = buildFacetFragments(facets);
  const sparql = composeQuery(template, templateVars, facetFragments);

  const activeFacets = facetFragments.filter((f) => f.active).map((f) => `${f.field}(${f.type})`);
  const discoveryFacets = facetFragments.filter((f) => !f.active).map((f) => `${f.field}(${f.type})`);

  if (!args.json) {
    console.log(`  Search:    "${search}"  Limit: ${limit}`);
    if (activeFacets.length) console.log(`  Active:    ${activeFacets.join(", ")}`);
    if (discoveryFacets.length) console.log(`  Discovery: ${discoveryFacets.join(", ")}`);
  }

  if (args.showFragments && facetFragments.length > 0) {
    console.log("\n  --- Facet Fragments ---");
    for (const f of facetFragments) {
      console.log(`  [${f.field}] (${f.active ? "ACTIVE" : "discovery"}):`);
      console.log(`    ${f.fragment.replace(/\n/g, "\n    ")}`);
    }
    console.log("  --- End Fragments ---\n");
  }

  if (args.showQuery) {
    console.log("\n  --- Rendered SPARQL ---");
    console.log(sparql);
    console.log("  --- End Query ---\n");
  }

  // Warmup
  const warmup = testDef.warmup != null ? testDef.warmup : args.warmup;
  for (let i = 0; i < warmup; i++) {
    if (!args.json) process.stdout.write(`  Warmup ${i + 1}/${warmup}...`);
    const r = await executeSparqlQuery(endpointUrl, sparql, args.timeout);
    if (!args.json) console.log(` ${fmt(r.elapsed)}${r.error ? ` ERROR: ${r.error}` : ""}`);
  }

  // Measured runs
  const runs = testDef.runs != null ? testDef.runs : args.runs;
  const timings = [];
  let lastResult = null;
  let lastResultCount = 0;
  const errors = [];

  for (let i = 0; i < runs; i++) {
    if (!args.json) process.stdout.write(`  Run ${i + 1}/${runs}...`);
    const r = await executeSparqlQuery(endpointUrl, sparql, args.timeout);
    if (!args.json) console.log(` ${fmt(r.elapsed)} (${r.resultCount} results)${r.error ? ` ERROR: ${r.error}` : ""}`);
    timings.push(r.elapsed);
    lastResultCount = r.resultCount;
    if (r.results) lastResult = r.results;
    if (r.error) errors.push({ run: i + 1, error: r.error });
  }

  if (args.showResults && lastResult) {
    console.log("\n  --- Sample Results (first 5) ---");
    const bindings = lastResult.results.bindings.slice(0, 5);
    for (const row of bindings) {
      const display = {};
      for (const [k, v] of Object.entries(row)) {
        display[k] = v.value ? v.value.slice(0, 80) : v;
      }
      console.log("  " + JSON.stringify(display, null, 2).replace(/\n/g, "\n  "));
    }
  }

  const stats = computeStats(timings);

  return {
    search,
    limit,
    offset,
    facets: facets.map((f) => ({ type: f.type, field: f.field, active: !!f.active, values: f.values })),
    activeFacets,
    runs,
    resultCount: lastResultCount,
    errors,
    timings,
    stats: roundStats(stats),
    sparql,
  };
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function findBaselineTest(baseline, testName) {
  if (!baseline || !baseline.tests) return null;
  return baseline.tests.find((t) => t.name === testName);
}

function printTestComparison(current, baselineTest) {
  if (!baselineTest || !baselineTest.stats) return;
  const pct = ((current.stats.median - baselineTest.stats.median) / baselineTest.stats.median * 100).toFixed(1);
  const sign = pct >= 0 ? "+" : "";
  const arrow = pct > 10 ? " !!SLOWER" : pct < -10 ? " FASTER" : "";
  process.stdout.write(`  vs baseline: ${fmt(baselineTest.stats.median)} -> ${fmt(current.stats.median)} (${sign}${pct}%)${arrow}`);
  if (current.resultCount !== baselineTest.resultCount) {
    process.stdout.write(` [results: ${baselineTest.resultCount} -> ${current.resultCount}]`);
  }
  console.log("");
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
    console.error("No SPARQL endpoint found in config or --endpoint.");
    process.exit(1);
  }

  // Load baseline for comparison
  let baseline = null;
  if (args.compare) {
    try {
      baseline = JSON.parse(fs.readFileSync(path.resolve(args.compare), "utf8"));
    } catch (e) {
      console.error(`Could not load comparison file: ${e.message}`);
    }
  }

  const allResults = {
    config: path.relative(process.cwd(), configPath),
    endpoint: endpointUrl,
    engine: args.engine || config.QUERY_ENGINE || "blazegraph",
    timestamp: new Date().toISOString(),
    tests: [],
  };

  if (!args.json) {
    console.log(`Config:   ${allResults.config}`);
    console.log(`Endpoint: ${endpointUrl}`);
    console.log(`Engine:   ${allResults.engine}`);
    console.log("");
  }

  // Determine what to run
  if (args.scenario) {
    // Scenario mode: load and run all tests from scenario file(s)
    const scenarios = loadScenarios(args.scenario);

    for (const scenario of scenarios) {
      if (!args.json) {
        console.log(`${"=".repeat(70)}`);
        console.log(`Scenario: ${scenario.name || scenario._file}`);
        if (scenario.description) console.log(`  ${scenario.description}`);
        console.log("=".repeat(70));
      }

      for (const test of (scenario.tests || [])) {
        const testName = test.name || "unnamed";
        if (!args.json) {
          console.log(`\n--- ${testName} ---`);
        }

        const result = await runSingleTest(test, args, config, configPath);
        result.name = testName;
        result.scenario = scenario.name || scenario._file;
        allResults.tests.push(result);

        if (!args.json) {
          console.log(`  >> Median: ${fmt(result.stats.median)}  Mean: ${fmt(result.stats.mean)}  Results: ${result.resultCount}`);
          const baselineTest = findBaselineTest(baseline, testName);
          if (baselineTest) printTestComparison(result, baselineTest);
        }
      }
    }
  } else {
    // Single test mode: use CLI args
    const testName = args.facets.length > 0
      ? `search:"${args.search}" + ${args.facets.map((f) => f.field).join("+")}`
      : `search:"${args.search}"`;

    if (!args.json) {
      console.log(`--- ${testName} ---`);
    }

    const result = await runSingleTest({}, args, config, configPath);
    result.name = testName;
    allResults.tests.push(result);

    if (!args.json) {
      console.log(`\n--- Performance Summary ---`);
      console.log(`Results:   ${result.resultCount}`);
      console.log(`Mean:      ${fmt(result.stats.mean)}`);
      console.log(`Median:    ${fmt(result.stats.median)}`);
      console.log(`Min:       ${fmt(result.stats.min)}`);
      console.log(`Max:       ${fmt(result.stats.max)}`);
      console.log(`Std Dev:   ${fmt(result.stats.stddev)}`);
      console.log(`P95:       ${fmt(result.stats.p95)}`);
      if (result.errors.length > 0) console.log(`Errors:    ${result.errors.length}/${result.runs}`);

      const baselineTest = findBaselineTest(baseline, testName);
      if (baselineTest) printTestComparison(result, baselineTest);
    }
  }

  // Print summary table for scenario mode
  if (args.scenario && allResults.tests.length > 1 && !args.json) {
    console.log(`\n${"=".repeat(70)}`);
    console.log("SUMMARY");
    console.log("=".repeat(70));
    console.log(
      padRight("Test", 45) +
      padRight("Median", 12) +
      padRight("P95", 12) +
      padRight("Results", 10)
    );
    console.log("-".repeat(79));
    for (const r of allResults.tests) {
      console.log(
        padRight(r.name, 45) +
        padRight(fmt(r.stats.median), 12) +
        padRight(fmt(r.stats.p95), 12) +
        padRight(String(r.resultCount), 10)
      );
    }
  }

  // JSON output
  if (args.json) {
    // Strip sparql from JSON output to keep it manageable (use --show-query to see it)
    const output = JSON.parse(JSON.stringify(allResults));
    for (const t of output.tests) delete t.sparql;
    console.log(JSON.stringify(output, null, 2));
  }

  // Save results
  if (args.save) {
    const savePath = path.resolve(args.save);
    const saveDir = path.dirname(savePath);
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
    const output = JSON.parse(JSON.stringify(allResults));
    for (const t of output.tests) delete t.sparql;
    fs.writeFileSync(savePath, JSON.stringify(output, null, 2));
    if (!args.json) console.log(`\nResults saved to: ${args.save}`);
  }
}

function padRight(str, len) {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
