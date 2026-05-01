#!/usr/bin/env node
/**
 * Batch Query Performance Tester
 *
 * Convenience wrapper that runs query-perf.js against all scenario files
 * in a directory and produces a combined report.
 *
 * Usage:
 *   node tools/query-perf/batch-perf.js [scenario-dir] [options]
 *
 * Options are passed through to query-perf.js (e.g., --config, --runs, --json, --save)
 *
 * Default scenario directory: tools/query-perf/scenarios/
 */

import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USAGE = `
Usage: node batch-perf.js [scenario-dir] [options]

Run all scenario files in a directory through query-perf.js.
All options are passed through to query-perf.js.

Default scenario directory: tools/query-perf/scenarios/

Examples:
  # Run all scenarios with defaults
  node tools/query-perf/batch-perf.js

  # Run with specific config and save results
  node tools/query-perf/batch-perf.js --config client/public/config/config_qlever.yaml --save results/qlever.json

  # Run with more measurement runs
  node tools/query-perf/batch-perf.js --runs 5 --warmup 2

  # JSON output
  node tools/query-perf/batch-perf.js --json
`;

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  // Determine scenario directory: first non-flag argument, or default
  let scenarioDir = path.join(__dirname, "scenarios");
  const passthrough = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--") && i === 0) {
      scenarioDir = path.resolve(arg);
    } else {
      passthrough.push(arg);
      // Consume next arg if this is an option that takes a value
      if (arg.startsWith("--") && arg !== "--json" && arg !== "--show-query" &&
          arg !== "--show-results" && i + 1 < args.length &&
          !args[i + 1].startsWith("--")) {
        passthrough.push(args[++i]);
      }
    }
  }

  const scriptPath = path.join(__dirname, "query-perf.js");
  const cmdArgs = ["--scenario", scenarioDir, ...passthrough];

  try {
    execFileSync("node", [scriptPath, ...cmdArgs], {
      encoding: "utf8",
      stdio: "inherit",
      timeout: 600000, // 10 minute max for full suite
    });
  } catch (err) {
    if (err.status) process.exit(err.status);
    console.error(err.message);
    process.exit(1);
  }
}

main();
