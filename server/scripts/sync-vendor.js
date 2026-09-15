#!/usr/bin/env node
/**
 * Copy the client SPARQL query builder into server/mcp/vendor.
 * See mcp/vendor/README.md for why these files are duplicated.
 */
const fs = require('fs');
const path = require('path');

const serverDir = path.resolve(__dirname, '..');
const clientSrc = path.resolve(serverDir, '..', 'client', 'src');

const files = [
  ['services/SparqlQueryBuilder.js', 'mcp/vendor/services/SparqlQueryBuilder.js'],
  ['utils/queryParser.js', 'mcp/vendor/utils/queryParser.js'],
];

for (const [from, to] of files) {
  const src = path.join(clientSrc, from);
  const dest = path.join(serverDir, to);
  if (!fs.existsSync(src)) {
    console.error(`missing client source: ${src}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`synced ${from} -> ${to}`);
}
