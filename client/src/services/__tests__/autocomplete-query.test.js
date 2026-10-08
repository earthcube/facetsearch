import test from 'node:test';
import assert from 'node:assert/strict';
import { SparqlQueryBuilder } from '../SparqlQueryBuilder.js';

const qlever = () => new SparqlQueryBuilder({ QUERY_ENGINE: 'qlever' });

test('autocomplete query uses wildcard word search with matching-word variable', () => {
  const query = qlever().buildAutocompleteQuery('seis');
  assert.ok(query);
  assert.match(query, /ql:contains-word "seis\*"/);
  assert.match(query, /\?ql_matchingword_text_seis/);
  assert.match(query, /LIMIT 10/);
});

test('autocomplete prefix is sanitized against injection and lowercased', () => {
  const query = qlever().buildAutocompleteQuery('SeIs" . ?x ?y ?z');
  assert.ok(query);
  // Only [a-z0-9] survives; quotes/spaces/dots are stripped, keeping both the
  // literal and the special variable name well-formed.
  assert.match(query, /ql:contains-word "seisxyz\*"/);
  assert.match(query, /\?ql_matchingword_text_seisxyz/);
  assert.doesNotMatch(query, /" \. \?x/);
});

test('autocomplete returns null for short prefixes', () => {
  assert.equal(qlever().buildAutocompleteQuery(''), null);
  assert.equal(qlever().buildAutocompleteQuery('se'), null);
  assert.equal(qlever().buildAutocompleteQuery('!!se!!'), null);
});

test('autocomplete returns null on non-QLever engines', () => {
  const blazegraph = new SparqlQueryBuilder({ QUERY_ENGINE: 'blazegraph' });
  assert.equal(blazegraph.buildAutocompleteQuery('seismic'), null);
});

test('autocomplete limit falls back to 10 on bad input', () => {
  const query = qlever().buildAutocompleteQuery('seis', -5);
  assert.match(query, /LIMIT 10/);
});
