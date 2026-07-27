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
      // north/south are intentionally swapped to test normalization;
      // east/west are in proper order (west < east) — not dateline crossing.
      bounds: { north: 39, south: 41, east: -86, west: -88 },
    },
    {}
  );

  assert.match(fragment, /\?lat >= 39 && \?lat <= 41/);
  assert.match(fragment, /\?lon >= -88 && \?lon <= -86/);
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

test('SparqlQueryBuilder generates split longitude filter for dateline-crossing bounding box', () => {
  const builder = new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [{ field: 'spatialCoverage', type: 'geo' }],
  });

  // west=120, east=-120: box crosses the dateline (120°E → 180 → -180 → 120°W)
  const fragment = builder.buildGeoFilter(
    'spatialCoverage',
    { bounds: { north: 60, south: -60, east: -120, west: 120 } },
    {}
  );

  assert.match(fragment, /\?lat >= -60 && \?lat <= 60/);
  // Must contain both halves of the split longitude filter
  assert.match(fragment, /\?lon >= 120 && \?lon <= 180/);
  assert.match(fragment, /\?lon >= -180 && \?lon <= -120/);
  // Must NOT use the simple (incorrect) non-split form
  assert.doesNotMatch(fragment, /\?lon >= -120 && \?lon <= 120/);
});

test('FilterStateManager preserves dateline-crossing bounds through URL round-trip', () => {
  const manager = createManager();
  // Set a dateline-crossing filter (west=120, east=-120)
  manager.setFilter('spatialCoverage', {
    bounds: { north: 60, south: -60, east: -120, west: 120 },
  });

  const params = manager.getUrlParams();
  // URL should encode east and west without swapping them
  assert.match(params, /spatialCoverage=60%2C-60%2C-120%2C120/);

  // Decode back from URL and confirm the dateline-crossing is preserved
  const manager2 = createManager();
  manager2.updateFromUrl('spatialCoverage=60,-60,-120,120');
  assert.deepEqual(manager2.state.activeFilters.spatialCoverage, {
    bounds: { north: 60, south: -60, east: -120, west: 120 },
  });
});
