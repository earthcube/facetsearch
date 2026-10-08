/**
 * Leaflet viewport → geo facet bounds ({north, south, east, west}).
 * Pure module (no Leaflet import) so it stays unit-testable.
 */

/** Wrap a longitude into [-180, 180]; values equivalent to +180 keep the sign of their world copy. */
export function wrapLongitude(lon) {
  const n = Number(lon);
  if (!Number.isFinite(n)) return NaN;
  const wrapped = ((((n + 180) % 360) + 360) % 360) - 180;
  // ±180 are the same meridian: an east edge (positive input) reads as +180.
  if (wrapped === -180 && n > 0) return 180;
  return wrapped;
}

/**
 * Normalize a viewport (Leaflet LatLngBounds or a plain object) to the geo
 * facet's bounds contract. Leaflet longitudes run past ±180 after panning
 * around the world; after wrapping, west > east encodes a dateline-crossing
 * box, which buildGeoFilter already handles. A viewport spanning the whole
 * world collapses to west -180 / east 180. Returns null on invalid input.
 */
export function viewportToGeoBounds(viewport) {
  if (!viewport) return null;

  const raw =
    typeof viewport.getNorth === 'function'
      ? {
          north: viewport.getNorth(),
          south: viewport.getSouth(),
          east: viewport.getEast(),
          west: viewport.getWest(),
        }
      : viewport;

  const north = Number(raw.north);
  const south = Number(raw.south);
  const rawEast = Number(raw.east);
  const rawWest = Number(raw.west);
  if (
    !Number.isFinite(north) ||
    !Number.isFinite(south) ||
    !Number.isFinite(rawEast) ||
    !Number.isFinite(rawWest)
  ) {
    return null;
  }

  const clampLat = (v) => Math.min(90, Math.max(-90, v));
  let east;
  let west;
  if (rawEast - rawWest >= 360) {
    west = -180;
    east = 180;
  } else {
    west = wrapLongitude(rawWest);
    east = wrapLongitude(rawEast);
  }

  return {
    north: clampLat(Math.max(north, south)),
    south: clampLat(Math.min(north, south)),
    east,
    west,
  };
}

/** Stable string key for comparing bounds values (~110m precision). */
export function geoBoundsKey(bounds) {
  if (!bounds) return '';
  const f = (v) => Number(v).toFixed(3);
  return `${f(bounds.north)},${f(bounds.south)},${f(bounds.east)},${f(bounds.west)}`;
}
