import test from 'node:test';
import assert from 'node:assert/strict';
import { starterQueryToRoute } from '../starterQueries.js';

test('maps scalar query values onto the Search2 URL grammar', () => {
  const route = starterQueryToRoute({
    label: 'Recent seismic datasets',
    query: { q: 'seismic', datep: '2020,2026', searchExactMatch: true },
  });
  assert.equal(route.path, '/search2/');
  assert.deepEqual(route.query, {
    q: 'seismic',
    datep: '2020,2026',
    searchExactMatch: 'true',
  });
});

test('passes arrays through as repeated-param values', () => {
  const route = starterQueryToRoute({
    label: 'Keywords',
    query: { kw: ['Oceanography', 'CTD'] },
  });
  assert.deepEqual(route.query, { kw: ['Oceanography', 'CTD'] });
});

test('keeps range and geo strings verbatim', () => {
  const route = starterQueryToRoute({
    label: 'Pacific 1990s',
    query: {
      temporalCoverage: '1990,1999',
      spatialCoverage: '60,-60,-100,120',
    },
  });
  assert.deepEqual(route.query, {
    temporalCoverage: '1990,1999',
    spatialCoverage: '60,-60,-100,120',
  });
});

test('drops empty, null, and non-scalar values', () => {
  const route = starterQueryToRoute({
    label: 'Messy',
    query: {
      q: '',
      kw: [null, '', 'CTD'],
      datep: null,
      nested: { not: 'allowed' },
    },
  });
  assert.deepEqual(route.query, { kw: ['CTD'] });
});

test('handles missing or malformed entries', () => {
  assert.deepEqual(starterQueryToRoute(null), {
    path: '/search2/',
    query: {},
  });
  assert.deepEqual(starterQueryToRoute({ label: 'No query' }).query, {});
  assert.deepEqual(starterQueryToRoute({ query: 'not-an-object' }).query, {});
});

test('target map routes to the map explorer', () => {
  const route = starterQueryToRoute({
    label: 'Map',
    target: 'map',
    query: { q: 'CTD' },
  });
  assert.equal(route.path, '/map');
  assert.deepEqual(route.query, { q: 'CTD' });
});
