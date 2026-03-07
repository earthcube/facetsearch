#!/usr/bin/env node
/**
 * Batch Query Performance Tester
 *
 * Runs a suite of performance tests defined in a JSON test plan file and
 * produces a combined report. Useful for comparing query performance across
 * different configs, queries, or search terms.
 *
 * Usage:
 *   node tools/query-perf/batch-perf.js <test-plan.json> [--json]
 *
 * Test plan format:
 *   {
 *     "defaults": { "runs": 3, "warmup": 1, "limit": 10, "timeout": 30000 },
 *     "tests": [
 *       { "name": "water search", "search": "water" },
 *       { "name": "ocean on prod", "search": "ocean", "config": "client/public/config/config_aws_prod.yaml" },
 *       { "name": "related data", "query": "sparql_relateddatafilename", "vars": { "relatedData": "coral" } }
 *     ]
 *   }
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const USAGE = `
Usage: node batch-perf.js <test-plan.json> [--json]

Run a batch of query performance tests defined in a JSON file.

See tools/query-perf/example-test-plan.json for format.
`;

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  const planFile = args[0];
  const jsonOutput = args.includes("--json");

  if (!fs.existsSync(planFile)) {
    console.error(`Test plan file not found: ${planFile}`);
    process.exit(1);
  }

  const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
  const defaults = plan.defaults || {};
  const tests = plan.tests || [];

  if (tests.length === 0) {
    console.error("No tests defined in plan file.");
    process.exit(1);
  }

  const scriptPath = path.join(__dirname, "query-perf.js");
  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = { ...defaults, ...tests[i] };
    const name = test.name || `Test ${i + 1}`;

    if (!jsonOutput) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Test: ${name}`);
      console.log("=".repeat(60));
    }

    const cmdArgs = ["--json"];
    if (test.config) cmdArgs.push("--config", test.config);
    if (test.query) cmdArgs.push("--query", test.query);
    if (test.queryFile) cmdArgs.push("--query-file", test.queryFile);
    if (test.endpoint) cmdArgs.push("--endpoint", test.endpoint);
    if (test.engine) cmdArgs.push("--engine", test.engine);
    if (test.search) cmdArgs.push("--search", test.search);
    if (test.exact) cmdArgs.push("--exact", String(test.exact));
    if (test.resourceType) cmdArgs.push("--resource-type", test.resourceType);
    if (test.limit !== undefined) cmdArgs.push("--limit", String(test.limit));
    if (test.offset !== undefined) cmdArgs.push("--offset", String(test.offset));
    if (test.timeout !== undefined) cmdArgs.push("--timeout", String(test.timeout));
    if (test.runs !== undefined) cmdArgs.push("--runs", String(test.runs));
    if (test.warmup !== undefined) cmdArgs.push("--warmup", String(test.warmup));
    if (test.vars) {
      for (const [k, v] of Object.entries(test.vars)) {
        cmdArgs.push("--var", `${k}=${v}`);
      }
    }

    try {
      const output = execFileSync("node", [scriptPath, ...cmdArgs], {
        encoding: "utf8",
        timeout: (test.timeout || 30000) * ((test.runs || 3) + (test.warmup || 1)) + 10000,
      });

      const result = JSON.parse(output);
      result.name = name;
      results.push(result);

      if (!jsonOutput) {
        console.log(`  Median: ${fmtMs(result.stats.median)}  Mean: ${fmtMs(result.stats.mean)}  Results: ${result.resultCount}`);
        if (result.errors.length > 0) {
          console.log(`  Errors: ${result.errors.length}/${result.runs}`);
        }
      }
    } catch (err) {
      const errResult = { name, error: err.message, stats: null };
      results.push(errResult);
      if (!jsonOutput) {
        console.log(`  ERROR: ${err.message.slice(0, 200)}`);
      }
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ plan: planFile, timestamp: new Date().toISOString(), results }, null, 2));
  } else {
    console.log(`\n${"=".repeat(60)}`);
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(
      padRight("Test", 35) +
      padRight("Median", 12) +
      padRight("Mean", 12) +
      padRight("P95", 12) +
      padRight("Results", 10)
    );
    console.log("-".repeat(81));
    for (const r of results) {
      if (r.stats) {
        console.log(
          padRight(r.name, 35) +
          padRight(fmtMs(r.stats.median), 12) +
          padRight(fmtMs(r.stats.mean), 12) +
          padRight(fmtMs(r.stats.p95), 12) +
          padRight(String(r.resultCount), 10)
        );
      } else {
        console.log(padRight(r.name, 35) + "ERROR");
      }
    }
  }
}

function fmtMs(ms) {
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
}

function padRight(str, len) {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

main();
