/**
 * Starter queries (STARTER_QUERIES in the facets YAML config).
 *
 * Each entry's `query` object maps 1:1 onto the Search2 URL grammar that
 * FilterStateManager.updateFromUrl already parses:
 *   - reserved keys: q, resourceType, searchExactMatch, page, limit
 *   - text facets: arrays become repeated params (?kw=a&kw=b)
 *   - range facets: a single "min,max" string
 *   - geo facet: a single "N,S,E,W" string
 * so a starter query is literally a saved Search2 URL — no translation layer.
 */

/**
 * Build a router location for a starter-query entry.
 * @param {{label?: string, description?: string, target?: string, query?: object}} entry
 * @param {string} [basePath='/search2/']
 * @returns {{path: string, query: object}}
 */
export function starterQueryToRoute(entry, basePath = '/search2/') {
  const query = {};
  const source =
    entry && typeof entry === 'object' && !Array.isArray(entry) ? entry.query : null;

  if (source && typeof source === 'object' && !Array.isArray(source)) {
    for (const [key, raw] of Object.entries(source)) {
      if (raw === undefined || raw === null || raw === '') continue;
      if (Array.isArray(raw)) {
        const values = raw
          .filter((v) => v !== undefined && v !== null && v !== '')
          .map(String);
        if (values.length > 0) query[key] = values;
      } else if (['string', 'number', 'boolean'].includes(typeof raw)) {
        query[key] = String(raw);
      }
    }
  }

  const path = entry?.target === 'map' ? '/map' : basePath;
  return { path, query };
}
