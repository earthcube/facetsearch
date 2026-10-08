import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wrapLongitude,
  viewportToGeoBounds,
  geoBoundsKey,
} from '../mapBounds.js';

test('wrapLongitude wraps into [-180, 180]', () => {
  assert.equal(wrapLongitude(0), 0);
  assert.equal(wrapLongitude(190), -170);
  assert.equal(wrapLongitude(-190), 170);
  assert.equal(wrapLongitude(540), 180);
  assert.equal(wrapLongitude(180), 180);
  assert.equal(wrapLongitude(-180), -180);
  assert.ok(Number.isNaN(wrapLongitude('x')));
});

test('viewportToGeoBounds normalizes a plain viewport', () => {
  assert.deepEqual(
    viewportToGeoBounds({ north: 50, south: 10, east: -60, west: -140 }),
    { north: 50, south: 10, east: -60, west: -140 }
  );
});

test('viewportToGeoBounds accepts Leaflet-style bounds objects', () => {
  const leafletish = {
    getNorth: () => 45,
    getSouth: () => 30,
    getEast: () => 10,
    getWest: () => -10,
  };
  assert.deepEqual(viewportToGeoBounds(leafletish), {
    north: 45,
    south: 30,
    east: 10,
    west: -10,
  });
});

test('viewportToGeoBounds wraps world-panned longitudes to a dateline crossing', () => {
  // Panned one world east: Leaflet reports e.g. west 170, east 220.
  const b = viewportToGeoBounds({ north: 40, south: 0, east: 220, west: 170 });
  assert.deepEqual(b, { north: 40, south: 0, east: -140, west: 170 });
  assert.ok(b.west > b.east, 'west > east encodes dateline crossing');
});

test('viewportToGeoBounds collapses a >= 360° span to the full world', () => {
  const b = viewportToGeoBounds({ north: 80, south: -80, east: 400, west: -30 });
  assert.deepEqual(b, { north: 80, south: -80, east: 180, west: -180 });
});

test('viewportToGeoBounds clamps latitudes and rejects invalid input', () => {
  const b = viewportToGeoBounds({ north: 95, south: -100, east: 10, west: -10 });
  assert.equal(b.north, 90);
  assert.equal(b.south, -90);
  assert.equal(viewportToGeoBounds(null), null);
  assert.equal(viewportToGeoBounds({ north: 'x', south: 0, east: 0, west: 0 }), null);
});

test('geoBoundsKey is stable at ~110m precision', () => {
  assert.equal(
    geoBoundsKey({ north: 50.00001, south: 10, east: -60, west: -140 }),
    geoBoundsKey({ north: 50.00009, south: 10, east: -60, west: -140 })
  );
  assert.notEqual(
    geoBoundsKey({ north: 50.1, south: 10, east: -60, west: -140 }),
    geoBoundsKey({ north: 50.2, south: 10, east: -60, west: -140 })
  );
  assert.equal(geoBoundsKey(null), '');
});
