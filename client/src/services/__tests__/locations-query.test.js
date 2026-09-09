import test from 'node:test';
import assert from 'node:assert/strict';
import { SparqlQueryBuilder } from '../SparqlQueryBuilder.js';

function createBuilder() {
  return new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [
      { field: 'kw', type: 'text', sparql_property: 'schema:keywords|sschema:keywords' },
      { field: 'temporalCoverage', type: 'rangeyear' },
      { field: 'spatialCoverage', type: 'geo' },
    ],
  });
}

const bboxFilters = {
  spatialCoverage: { bounds: { north: 50, south: 10, east: -60, west: -140 } },
};

test('locations query projects sampled lat/lon per dataset with a candidate LIMIT', () => {
  const query = createBuilder().buildLocationsQuery({ textQuery: '', filters: {} });
  assert.match(query, /SELECT \?g \?subj \(SAMPLE\(\?name_r\) AS \?name\) \(SAMPLE\(\?lat\) AS \?lat_s\) \(SAMPLE\(\?lon\) AS \?lon_s\)/);
  assert.match(query, /SELECT DISTINCT \?subj/);
  assert.match(query, /LIMIT 1000/);
  assert.match(query, /GROUP BY \?g \?subj/);
  // No card-metadata OPTIONALs — this is the lightweight projection.
  assert.doesNotMatch(query, /OPTIONAL/);
  // No viewport: candidates must still be georeferenced.
  assert.match(query, /\?lat0/);
});

test('locations query applies the viewport bbox inside and outside the subquery', () => {
  const query = createBuilder().buildLocationsQuery({ textQuery: '', filters: bboxFilters });
  const matches = query.match(/\?lat >= 10 && \?lat <= 50/g) || [];
  assert.equal(matches.length, 2, 'bbox filter in candidate subquery and outer projection');
  assert.doesNotMatch(query, /\?lat0/);
});

test('locations query splits dateline-crossing longitudes', () => {
  const query = createBuilder().buildLocationsQuery({
    textQuery: '',
    filters: { spatialCoverage: { bounds: { north: 40, south: 0, east: -140, west: 150 } } },
  });
  assert.match(query, /\?lon >= 150 && \?lon <= 180\) \|\| \(\?lon >= -180 && \?lon <= -140/);
});

test('locations query nests text search after the selective-subject subquery', () => {
  const query = createBuilder().buildLocationsQuery({
    textQuery: 'CTD',
    searchExactMatch: true,
    filters: { ...bboxFilters, temporalCoverage: [2010, 2015] },
  });
  assert.match(query, /ql:contains-word/);
  // Selective-subject inner subquery precedes the text fragment; both live
  // inside the outer candidate subquery, so match structure, not indentation.
  const selectiveMatch = /SELECT DISTINCT \?subj\s+WHERE/.exec(query);
  const textIdx = query.indexOf('ql:contains-word');
  assert.ok(selectiveMatch && selectiveMatch.index < textIdx);
  // Temporal constraint rides along in the candidate narrowing.
  assert.match(query, /temporalCoverage/);
});

test('locations query clamps a custom limit', () => {
  const query = createBuilder().buildLocationsQuery({ textQuery: '', filters: {}, limit: 250 });
  assert.match(query, /LIMIT 250/);
  const capped = createBuilder().buildLocationsQuery({ textQuery: '', filters: {}, limit: 999999 });
  assert.match(capped, /LIMIT 5000/);
});
