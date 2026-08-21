import test from 'node:test';
import assert from 'node:assert/strict';
import { SparqlQueryBuilder } from '../SparqlQueryBuilder.js';

function createBuilder() {
  return new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [{ field: 'kw', type: 'text', sparql_property: 'schema:keywords' }],
  });
}

test('summary query binds the requested subject and samples one row', () => {
  const query = createBuilder().buildDatasetSummaryQuery('urn:gleaner:iris:abc123');
  assert.match(query, /BIND\(<urn:gleaner:iris:abc123> AS \?subj\)/);
  assert.match(query, /GROUP BY \?g \?subj/);
  assert.match(query, /LIMIT 1/);
});

test('summary query requires a name but leaves detail fields optional', () => {
  const query = createBuilder().buildDatasetSummaryQuery('urn:x');
  // Name is the only required triple, so a description-less dataset still returns.
  assert.match(query, /\?subj schema:name\|sschema:name \?name_r \./);
  for (const field of ['description', 'publisher', 'datePublished', 'url']) {
    assert.match(query, new RegExp(`OPTIONAL \\{[^}]*\\?${field}_r`));
  }
});

test('summary query returns null without a subject', () => {
  assert.equal(createBuilder().buildDatasetSummaryQuery(''), null);
  assert.equal(createBuilder().buildDatasetSummaryQuery(undefined), null);
});
