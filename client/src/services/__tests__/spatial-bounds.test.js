import test from 'node:test';
import assert from 'node:assert/strict';
import { FilterStateManager } from '../FilterStateManager.js';
import { SparqlQueryBuilder } from '../SparqlQueryBuilder.js';

function createManager() {
  return new FilterStateManager(
    {
      FACETS: [{ field: 'spatialCoverage', type: 'geo' }],
      LIMIT_DEFAULT: 10,
    },
    async () => ({ results: [], totalCount: 0 })
  );
}

test('FilterStateManager serializes geo bounds to URL', () => {
  const manager = createManager();
  manager.setFilter('spatialCoverage', {
    bounds: { north: 41, south: 39, east: -86, west: -88 },
  });

  const params = manager.getUrlParams();
  assert.match(
    params,
    /spatialCoverage=41%2C39%2C-86%2C-88/
  );
});

test('FilterStateManager hydrates geo bounds from URL', () => {
  const manager = createManager();
  manager.updateFromUrl('spatialCoverage=41,39,-86,-88');

  assert.deepEqual(manager.state.activeFilters.spatialCoverage, {
    bounds: { north: 41, south: 39, east: -86, west: -88 },
  });
});

test('FilterStateManager ignores malformed geo bounds URL payload', () => {
  const manager = createManager();
  manager.updateFromUrl('spatialCoverage=not,a,valid,bounds');
  assert.equal(manager.state.activeFilters.spatialCoverage, undefined);
});

test('SparqlQueryBuilder generates geo filter with normalized bounds', () => {
  const builder = new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [{ field: 'spatialCoverage', type: 'geo' }],
  });

  const fragment = builder.buildGeoFilter(
    'spatialCoverage',
    {
      bounds: { north: 39, south: 41, east: -88, west: -86 },
    },
    {}
  );

  assert.match(fragment, /\?lat >= 39 && \?lat <= 41/);
  assert.match(fragment, /\?lon >= -88 && \?lon <= -86/);
  assert.ok(fragment.includes('schema:spatialCoverage|sschema:spatialCoverage'));
  assert.ok(fragment.includes('schema:geo|sschema:geo'));
  assert.ok(fragment.includes('schema:latitude|sschema:latitude'));
  assert.ok(fragment.includes('schema:longitude|sschema:longitude'));
});

test('SparqlQueryBuilder skips degenerate geo filter payloads', () => {
  const builder = new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [{ field: 'spatialCoverage', type: 'geo' }],
  });

  const fragment = builder.buildGeoFilter(
    'spatialCoverage',
    { bounds: { north: 10, south: 10, east: 20, west: 0 } },
    {}
  );

  assert.equal(fragment, '');
});
