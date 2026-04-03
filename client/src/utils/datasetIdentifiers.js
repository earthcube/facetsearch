/**
 * Gleaner named-graph URNs used as stable dataset file identifiers (vs DOI subject IRIs).
 * Examples:
 * - urn:gleaner.io:eco:iedadata:data:08f17b78ef8361269b163a509abc7c2ab916411d
 * - urn:gleaner.io:eco:bodc:data:2a8f3089afc0f70a685fb528a02769271ead47aa
 * Tenant/repo segments between gleaner.io and :data: vary (one or more NSID parts).
 */
export function normalizeDatasetGraphIri(s) {
  if (s == null || typeof s !== "string") return null;
  try {
    return decodeURIComponent(s.trim());
  } catch {
    return s.trim();
  }
}

export function isGleanerDatasetGraphUrn(s) {
  const t = normalizeDatasetGraphIri(s);
  if (!t) return false;
  return /^urn:gleaner\.io:.+:data:[0-9a-f]{40}$/i.test(t);
}
