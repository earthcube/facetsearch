/**
 * Query parser for AND/OR text search.
 * Parses a search string into AND terms and OR groups for use with Blazegraph or Qlever.
 *
 * Example: "sediment deposition North Atlantic or North Pacific"
 *   -> { AND: ["sediment", "deposition", "north"], OR_GROUPS: [["atlantic"], ["north", "pacific"]] }
 */

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "in", "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "were",
  "will", "with", "the", "would", "like", "i", "me", "my", "we", "our", "this",
  "there", "their", "what", "which", "when", "where", "who", "how",
]);

/**
 * Tokenize a segment: split on whitespace, trim, lowercase, remove stop words.
 * @param {string} segment - One part of the query (e.g. text before or after " or ")
 * @returns {string[]} Non-empty terms
 */
function tokenizeSegment(segment) {
  if (typeof segment !== "string" || !segment.trim()) return [];
  return segment
    .trim()
    .split(/\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && !STOP_WORDS.has(s));
}

/**
 * Parse a search query into AND terms and OR groups.
 * - Splits on " or " / " OR " (case-insensitive).
 * - One segment: all terms are AND, no OR groups.
 * - Multiple segments: first segment's terms (except last) are AND; last term of first
 *   segment and each subsequent segment form the OR_GROUPS.
 *
 * @param {string} q - Raw search string from the user
 * @returns {{ AND: string[], OR_GROUPS: string[][] }}
 */
export function parseQuery(q) {
  if (typeof q !== "string") {
    return { AND: [], OR_GROUPS: [] };
  }

  const trimmed = q.trim();
  if (!trimmed) {
    return { AND: [], OR_GROUPS: [] };
  }

  const segments = trimmed.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean);
  const segmentTerms = segments.map(tokenizeSegment).filter((terms) => terms.length > 0);

  if (segmentTerms.length === 0) {
    return { AND: [], OR_GROUPS: [] };
  }

  if (segmentTerms.length === 1) {
    return {
      AND: segmentTerms[0],
      OR_GROUPS: [],
    };
  }

  const first = segmentTerms[0];
  const andTerms = first.slice(0, -1);
  const orGroups = [
    first.slice(-1),
    ...segmentTerms.slice(1),
  ].filter((group) => group.length > 0);

  return {
    AND: andTerms,
    OR_GROUPS: orGroups,
  };
}

/**
 * Escape a term for use inside a SPARQL double-quoted string.
 * @param {string} term
 * @returns {string}
 */
function escapeSparqlString(term) {
  return String(term)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

/**
 * Build the Blazegraph text-search SPARQL fragment from parsed AND/OR.
 * - No OR_GROUPS: one block with AND terms in bds:search, matchAllTerms "true".
 * - With OR_GROUPS: UNION of blocks; each block = AND terms + that group's terms.
 *
 * @param {{ AND: string[], OR_GROUPS: string[][] }} parsed - Output from parseQuery()
 * @returns {string} SPARQL fragment (indented for template)
 */
export function buildTextSearchBlockBlazegraph(parsed) {
  const { AND, OR_GROUPS } = parsed;

  const makeBlock = (terms) => {
    if (terms.length === 0) return "";
    const searchStr = terms.map(escapeSparqlString).join(" ");
    return [
      `            ?lit bds:search "${searchStr}" .`,
      `            ?lit bds:matchAllTerms "true" .`,
      `            ?lit bds:relevance ?score1 .`,
      `            ?g ?p ?lit .`,
    ].join("\n");
  };

  if (!OR_GROUPS || OR_GROUPS.length === 0) {
    return makeBlock(AND);
  }

  const blocks = OR_GROUPS.map((group) => {
    const terms = [...AND, ...group];
    return makeBlock(terms);
  }).filter(Boolean);

  if (blocks.length === 0) return makeBlock(AND);
  if (blocks.length === 1) return blocks[0];

  return blocks.map((b) => `          {\n${b}\n          }`).join("\n          UNION\n          ");
}

/**
 * Build the Qlever text-search SPARQL fragment from parsed AND/OR.
 * Uses ql:contains-entity + ql:contains-word; UNION for OR groups.
 *
 * @param {{ AND: string[], OR_GROUPS: string[][] }} parsed - Output from parseQuery()
 * @returns {string} SPARQL fragment (indented for Qlever template)
 */
export function buildTextSearchBlockQlever(parsed) {
  const { AND, OR_GROUPS } = parsed;

  const makeBlock = (terms) => {
    if (terms.length === 0) return "";
    const wordLines = terms
      .map((t) => `    ?text ql:contains-word "${escapeSparqlString(t)}" .`)
      .join("\n");
    return [
      "    ?subj ?o ?item .",
      "    ?text ql:contains-entity ?item .",
      wordLines,
    ].join("\n");
  };

  if (!OR_GROUPS || OR_GROUPS.length === 0) {
    return makeBlock(AND);
  }

  const blocks = OR_GROUPS.map((group) => {
    const terms = [...AND, ...group];
    return makeBlock(terms);
  }).filter(Boolean);

  if (blocks.length === 0) return makeBlock(AND);
  if (blocks.length === 1) return blocks[0];

  return blocks.map((b) => `  {\n${b}\n  }`).join("\nUNION\n  ");
}
