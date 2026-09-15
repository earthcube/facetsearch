/**
 * Spatial coverage lookup for search results.
 *
 * The faceted search query filters on schema:spatialCoverage (the Spatial Filter facet)
 * but does not project it, so result rows carry no geometry. This module fetches the
 * spatial coverage of one page of subjects, the way the dataset page shows place names,
 * point coordinates and shapes.
 *
 * Two queries rather than one: QLever's MIN/MAX return unbound for a group that contains
 * an unbound row, so the coordinate bounds are aggregated over required patterns only,
 * and the names/shapes (which need OPTIONAL) are fetched separately.
 */

const PREFIXES = `PREFIX schema: <https://schema.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
`;

/** Subjects are IRIs from the store; reject anything that cannot go inside <...>. */
function iriSafe(value) {
  return typeof value === 'string' && value.length > 0 && !/[<>"{}|^`\s\\]/.test(value);
}

function subjectValues(subjects) {
  const unique = Array.from(new Set((subjects || []).filter(iriSafe)));
  return unique.length > 0 ? unique.map((s) => `<${s}>`).join(' ') : null;
}

function splitConcat(value) {
  if (value == null || value === '') return [];
  return String(value)
    .split('|~|')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Bounds of the point coordinates of each subject's spatial coverage.
 * Coordinates are stored both as xsd:decimal and as plain string literals, so they are
 * cast before aggregating; MIN/MAX on strings would compare lexicographically.
 * @param {string[]} subjects - subject IRIs from the result page
 * @returns {string|null} SPARQL, or null when there is nothing to look up
 */
function buildSpatialBoundsQuery(subjects) {
  const values = subjectValues(subjects);
  if (!values) return null;

  return `${PREFIXES}
SELECT ?subj
  (MIN(?lat) AS ?minLat) (MAX(?lat) AS ?maxLat)
  (MIN(?lon) AS ?minLon) (MAX(?lon) AS ?maxLon)
  (COUNT(DISTINCT ?geo) AS ?pointCount)
WHERE {
  VALUES ?subj { ${values} }
  ?subj schema:spatialCoverage/schema:geo ?geo .
  ?geo schema:latitude ?latRaw .
  ?geo schema:longitude ?lonRaw .
  BIND (xsd:double(STR(?latRaw)) AS ?lat)
  BIND (xsd:double(STR(?lonRaw)) AS ?lon)
}
GROUP BY ?subj
`;
}

/**
 * Place names and shape literals of each subject's spatial coverage.
 * schema:box/polygon/line are passed through verbatim because their coordinate order
 * varies by source; polygons and lines are counted rather than returned, since they are
 * large GeoJSON blobs better read from the dataset record. The COALESCE guards another
 * QLever quirk: GROUP_CONCAT returns unbound for a group containing an unbound row.
 * @param {string[]} subjects - subject IRIs from the result page
 * @returns {string|null} SPARQL, or null when there is nothing to look up
 */
function buildSpatialDetailQuery(subjects) {
  const values = subjectValues(subjects);
  if (!values) return null;

  return `${PREFIXES}
SELECT ?subj
  (COUNT(DISTINCT ?polygon) AS ?polygonCount)
  (COUNT(DISTINCT ?line) AS ?lineCount)
  (GROUP_CONCAT(DISTINCT COALESCE(?box, ""); SEPARATOR="|~|") AS ?boxes)
  (GROUP_CONCAT(DISTINCT COALESCE(?placeName, ""); SEPARATOR="|~|") AS ?placeNames)
WHERE {
  VALUES ?subj { ${values} }
  ?subj schema:spatialCoverage ?spatialCov .
  OPTIONAL { ?spatialCov schema:name ?placeName . }
  OPTIONAL {
    ?spatialCov schema:geo ?geo .
    OPTIONAL { ?geo schema:box ?box . }
    OPTIONAL { ?geo schema:polygon ?polygon . }
    OPTIONAL { ?geo schema:line ?line . }
  }
}
GROUP BY ?subj
`;
}

function bindingsOf(response) {
  return (response && response.results && response.results.bindings) || [];
}

/**
 * Merge the two lookups into one record per subject.
 * Subjects with no spatial coverage at all are left out.
 * @param {object} boundsResponse - SPARQL JSON results of buildSpatialBoundsQuery
 * @param {object} detailResponse - SPARQL JSON results of buildSpatialDetailQuery
 * @returns {Map<string, object>} subject IRI -> spatial coverage record
 */
function processSpatialCoverage(boundsResponse, detailResponse) {
  const bySubject = new Map();

  const record = (subj) => {
    if (!bySubject.has(subj)) {
      bySubject.set(subj, {
        placeNames: [],
        boundingBox: null,
        pointCount: 0,
        boxes: [],
        polygonCount: 0,
        lineCount: 0,
      });
    }
    return bySubject.get(subj);
  };

  for (const binding of bindingsOf(boundsResponse)) {
    const value = (key) => (binding[key] ? binding[key].value : undefined);
    const subj = value('subj');
    if (!subj) continue;

    const north = num(value('maxLat'));
    const south = num(value('minLat'));
    const east = num(value('maxLon'));
    const west = num(value('minLon'));
    if ([north, south, east, west].some((v) => v === null)) continue;

    const entry = record(subj);
    entry.boundingBox = { north, south, east, west };
    entry.pointCount = num(value('pointCount')) || 0;
  }

  for (const binding of bindingsOf(detailResponse)) {
    const value = (key) => (binding[key] ? binding[key].value : undefined);
    const subj = value('subj');
    if (!subj) continue;

    const placeNames = splitConcat(value('placeNames'));
    const boxes = splitConcat(value('boxes'));
    const polygonCount = num(value('polygonCount')) || 0;
    const lineCount = num(value('lineCount')) || 0;

    if (
      !bySubject.has(subj) &&
      placeNames.length === 0 &&
      boxes.length === 0 &&
      polygonCount === 0 &&
      lineCount === 0
    ) {
      continue;
    }

    const entry = record(subj);
    entry.placeNames = placeNames;
    entry.boxes = boxes;
    entry.polygonCount = polygonCount;
    entry.lineCount = lineCount;
  }

  return bySubject;
}

module.exports = {
  buildSpatialBoundsQuery,
  buildSpatialDetailQuery,
  processSpatialCoverage,
};
