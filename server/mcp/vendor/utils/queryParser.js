/**
 * Query parser for AND/OR text search.
 * Parses a search string into AND terms and OR groups for Blazegraph or QLever.
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
 * @param {string} segment
 * @returns {string[]}
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
 * @param {string} q
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
 * Combine whitespace tokenization with the "Exact match" flag.
 * - If the query contains ` or `, {@link parseQuery} handles it (unchanged).
 * - Otherwise: Exact match ON → all tokens AND. Exact match OFF → one OR branch per token.
 *
 * @param {string} q
 * @param {boolean} searchExactMatch
 * @returns {{ AND: string[], OR_GROUPS: string[][] }}
 */
export function parseQueryWithExactFlag(q, searchExactMatch) {
  const trimmed = String(q || "").trim();
  if (!trimmed) return { AND: [], OR_GROUPS: [] };
  if (/\s+or\s+/i.test(trimmed)) {
    return parseQuery(trimmed);
  }
  const terms = tokenizeSegment(trimmed);
  if (terms.length === 0) {
    return ensureParsedTerms(trimmed, { AND: [], OR_GROUPS: [] });
  }
  if (terms.length === 1) {
    return { AND: terms, OR_GROUPS: [] };
  }
  if (searchExactMatch) {
    return { AND: terms, OR_GROUPS: [] };
  }
  return { AND: [], OR_GROUPS: terms.map((t) => [t]) };
}

/**
 * True if parsed query has any usable terms.
 * @param {{ AND: string[], OR_GROUPS: string[][] }} parsed
 */
export function parsedHasTerms(parsed) {
  if (!parsed) return false;
  if (parsed.AND && parsed.AND.length > 0) return true;
  if (parsed.OR_GROUPS && parsed.OR_GROUPS.some((g) => g && g.length > 0)) return true;
  return false;
}

/**
 * If tokenization removed everything, fall back to a single literal term (lowercased trim).
 * @param {string} raw
 * @param {{ AND: string[], OR_GROUPS: string[][] }} parsed
 */
export function ensureParsedTerms(raw, parsed) {
  if (parsedHasTerms(parsed)) return parsed;
  const t = String(raw || "").trim().toLowerCase();
  if (!t) return { AND: [], OR_GROUPS: [] };
  return { AND: [t], OR_GROUPS: [] };
}

/**
 * Escape a term for use inside a SPARQL double-quoted string.
 * @param {string} term
 * @returns {string}
 */
export function escapeSparqlString(term) {
  return String(term)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

/**
 * Blazegraph fragment for lodash templates (sparql_query_and_or.txt): ?g ?p ?lit style.
 * @param {{ AND: string[], OR_GROUPS: string[][] }} parsed
 * @returns {string}
 */
export function buildTextSearchBlockBlazegraph(parsed) {
  const { AND, OR_GROUPS } = parsed;

  const makeBlock = (terms, litVar) => {
    if (terms.length === 0) return "";
    const searchStr = terms.map(escapeSparqlString).join(" ");
    return [
      `            ${litVar} bds:search "${searchStr}" .`,
      `            ${litVar} bds:matchAllTerms "true" .`,
      `            ${litVar} bds:relevance ?score1 .`,
      `            ?g ?p ${litVar} .`,
    ].join("\n");
  };

  if (!OR_GROUPS || OR_GROUPS.length === 0) {
    return makeBlock(AND, "?lit");
  }

  const blocks = OR_GROUPS.map((group, idx) => {
    const terms = [...AND, ...group];
    const litVar = idx === 0 ? "?lit" : `?lit_or_${idx}`;
    return makeBlock(terms, litVar);
  }).filter(Boolean);

  if (blocks.length === 0) return makeBlock(AND, "?lit");
  if (blocks.length === 1) return blocks[0];

  return blocks.map((b) => `          {\n${b}\n          }`).join("\n          UNION\n          ");
}

/**
 * Blazegraph fragment for SparqlQueryBuilder (GRAPH ?g { ?subj ?p ?lit }).
 * @param {{ AND: string[], OR_GROUPS: string[][] }} parsed
 * @returns {string}
 */
export function buildTextSearchBlazegraphGraph(parsed) {
  const { AND, OR_GROUPS } = parsed;

  const makeBlock = (terms, litVar) => {
    if (terms.length === 0) return "";
    const searchStr = terms.map(escapeSparqlString).join(" ");
    return [
      `  ${litVar} bds:search "${searchStr}" .`,
      `  ${litVar} bds:matchAllTerms "true" .`,
      `  ${litVar} bds:relevance ?score1 .`,
      `  GRAPH ?g { ?subj ?p ${litVar} . }`,
    ].join("\n");
  };

  if (!OR_GROUPS || OR_GROUPS.length === 0) {
    return makeBlock(AND, "?lit");
  }

  const blocks = OR_GROUPS.map((group, idx) => {
    const terms = [...AND, ...group];
    const litVar = idx === 0 ? "?lit" : `?lit_or_${idx}`;
    return makeBlock(terms, litVar);
  }).filter(Boolean);

  if (blocks.length === 0) return makeBlock(AND, "?lit");
  if (blocks.length === 1) return blocks[0];

  return blocks.map((b) => `{\n${b}\n}`).join("\nUNION\n");
}

/**
 * QLever fragment: ?subj ?o ?item + ql:contains-entity + ql:contains-word lines.
 * Reuses ?text across UNION branches (one branch matches per solution).
 *
 * @param {{ AND: string[], OR_GROUPS: string[][] }} parsed
 * @returns {string}
 */
export function buildTextSearchBlockQlever(parsed) {
  const { AND, OR_GROUPS } = parsed;

  const makeBlock = (terms) => {
    if (terms.length === 0) return "";
    const wordLines = terms
      .map((t) => `?text ql:contains-word "${escapeSparqlString(t)}" .`)
      .join("\n");
    return [
      "?subj ?o ?item .",
      "?text ql:contains-entity ?item .",
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

  return blocks.map((b) => `{\n${b}\n}`).join("\nUNION\n");
}

/**
 * Indent each line (for embedding in WHERE { ... }).
 * @param {string} fragment
 * @param {number} spaces
 * @returns {string}
 */
export function indentSparqlLines(fragment, spaces = 2) {
  if (!fragment) return "";
  const pad = " ".repeat(spaces);
  return fragment
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}
