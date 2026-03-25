/** Normalize `urn:...:ec:iedadata:` → `...:eco:iedadata:` for graph / API params. */
export function normalizeDatasetGraphIri(g) {
  if (g == null || typeof g !== "string") return undefined;
  const t = g.trim();
  if (!t) return undefined;
  return t.replace(
    /^urn:gleaner\.io:ec:iedadata:/i,
    "urn:gleaner.io:eco:iedadata:",
  );
}

/** Path segments to try for EC /dataset/{id} (DOI variants). */
export function datasetJsonLdPathVariants(idStr) {
  const s = String(idStr || "").trim();
  if (!s) return [s];
  const out = [];
  const add = (x) => {
    if (x != null && x !== "" && !out.includes(x)) out.push(x);
  };
  add(s);
  const mDoi = s.match(/^(?:doi|DOI):(10\.\d+\/.+)$/);
  const mUrl = s.match(/^https?:\/\/doi\.org\/(10\.\d+\/.+)$/i);
  const tail = mDoi ? mDoi[1] : mUrl ? mUrl[1] : null;
  if (tail) {
    add(`doi:${tail}`);
    add(`DOI:${tail}`);
    add(`https://doi.org/${tail}`);
  }
  return out;
}
