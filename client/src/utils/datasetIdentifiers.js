/**
 * Normalize `urn:...:ec:iedadata:` → `...:eco:iedadata:` for graph / API params.
 */
export function normalizeDatasetGraphIri(g) {
  if (g == null || typeof g !== "string") return undefined;
  const t = g.trim();
  if (!t) return undefined;
  return t.replace(
    /^urn:gleaner\.io:ec:iedadata:/i,
    "urn:gleaner.io:eco:iedadata:"
  );
}

/** When the route has no ?g=, QLever often uses the dataset IRI as the named graph. */
export function fallbackGraphForSubject(idStr) {
  if (idStr == null || typeof idStr !== "string") return undefined;
  const s = idStr.trim();
  if (!s) return undefined;
  if (/^DOI:/i.test(s)) return s;
  if (/^urn:/i.test(s)) return s;
  return undefined;
}

/** Path segments to try for /dataset/{id} (DOI variants). */
export function datasetJsonLdPathVariants(idStr) {
  const s = String(idStr || "").trim();
  const out = [];
  const seen = new Set();
  const add = (x) => {
    if (x == null || x === "") return;
    const t = String(x);
    if (seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  add(s);
  if (!s) return out;

  const mDoi = s.match(/^(?:doi|DOI):(10\.\d+\/.+)$/i);
  const mUrl = s.match(/^https?:\/\/doi\.org\/(10\.\d+\/.+)$/i);
  const tail = mDoi ? mDoi[1] : mUrl ? mUrl[1] : null;
  if (tail) {
    add(`doi:${tail}`);
    add(`DOI:${tail}`);
    add(`https://doi.org/${tail}`);
  }

  return out;
}
