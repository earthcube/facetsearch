/**
 * EC /dataset 404 → SELECT from named graph, expand to JSON-LD for framing in dataset.vue
 */
import axios from "axios";
import jsonld from "jsonld";
import { normalizeDatasetGraphIri } from "@/utils/datasetIdentifiers.js";

function bracketIri(iri) {
  const x = String(iri || "").trim();
  if (!x) return "";
  return `<${x.replace(/\\/g, "\\\\").replace(/>/g, "%3E")}>`;
}

function buildQuery(graphIri, subjectIri) {
  const g = bracketIri(graphIri);
  const root = bracketIri(subjectIri);
  return `SELECT DISTINCT ?s ?p ?o WHERE {
  GRAPH ${g} {
    {
      BIND(${root} AS ?root)
      ?root ?p ?o .
      BIND(?root AS ?s)
    }
    UNION
    {
      BIND(${root} AS ?root)
      ?s ?p ?root .
    }
  }
} LIMIT 4000`;
}

function termToNQuadNode(term, objectPosition) {
  if (!term || term.type == null) return null;
  if (term.type === "uri") return `<${term.value}>`;
  if (term.type === "bnode") {
    const id = String(term.value).replace(/^_:/, "");
    return "_:" + id;
  }
  if (term.type === "literal" && objectPosition) {
    const esc = String(term.value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    let lit = `"${esc}"`;
    if (term.datatype) lit += `^^<${term.datatype}>`;
    else if (term["xml:lang"]) lit += `@${term["xml:lang"]}`;
    return lit;
  }
  return null;
}

function rowToNQuad(row) {
  if (!row.s || !row.p || !row.o) return null;
  const s = termToNQuadNode(row.s, false);
  const p = termToNQuadNode(row.p, false);
  const o = termToNQuadNode(row.o, true);
  if (!s || !p || !o) return null;
  return `${s} ${p} ${o} .`;
}

/**
 * @returns {Promise<object[]|null>} expanded JSON-LD (array) for jsonld.compact
 */
export async function fetchExpandedDatasetJsonLdViaSparql({
  triplestoreUrl,
  subject,
  graph,
  timeoutMs = 25000,
}) {
  const graphNorm = normalizeDatasetGraphIri(graph) || graph;
  if (!triplestoreUrl || !graphNorm || !subject) return null;

  const query = buildQuery(graphNorm, subject);
  const url = new URL(triplestoreUrl);
  url.searchParams.set("query", query);
  const axiosTimeoutMs = Math.max(timeoutMs + 30_000, 120_000);

  try {
    const response = await axios.get(url.toString(), {
      timeout: axiosTimeoutMs,
      headers: { Accept: "application/sparql-results+json" },
    });
    const bindings = response.data?.results?.bindings || [];
    if (!bindings.length) return null;

    const lines = [];
    for (const row of bindings) {
      const line = rowToNQuad(row);
      if (line) lines.push(line);
    }
    if (!lines.length) return null;

    const nq = lines.join("\n");
    const expanded = await jsonld.fromRDF(nq, {
      format: "application/n-quads",
    });
    if (expanded && expanded.length) return expanded;
  } catch (e) {
    console.warn("fetchExpandedDatasetJsonLdViaSparql:", e);
  }
  return null;
}

/**
 * Find one schema:Dataset subject IRI inside a named graph (for graph-URN-only routes).
 * @returns {Promise<string|null>} first ?s binding URI string
 */
export async function fetchPrimaryDatasetSubjectInGraph({
  triplestoreUrl,
  graph,
  timeoutMs = 25000,
}) {
  const graphNorm = normalizeDatasetGraphIri(graph) || graph;
  if (!triplestoreUrl || !graphNorm) return null;

  const g = bracketIri(graphNorm);
  const query = `PREFIX schema: <https://schema.org/>
PREFIX sschema: <https://schema.org/>
PREFIX schemahttp: <http://schema.org/>
SELECT DISTINCT ?s WHERE {
  GRAPH ${g} {
    { ?s a schema:Dataset }
    UNION { ?s a sschema:Dataset }
    UNION { ?s a schemahttp:Dataset }
  }
} LIMIT 10`;

  const url = new URL(triplestoreUrl);
  url.searchParams.set("query", query);
  const axiosTimeoutMs = Math.max(timeoutMs + 30_000, 120_000);

  try {
    const response = await axios.get(url.toString(), {
      timeout: axiosTimeoutMs,
      headers: { Accept: "application/sparql-results+json" },
    });
    const bindings = response.data?.results?.bindings || [];
    if (!bindings.length) return null;
    const v = bindings[0]?.s?.value;
    return v && String(v).trim() ? String(v).trim() : null;
  } catch (e) {
    console.warn("fetchPrimaryDatasetSubjectInGraph:", e);
  }
  return null;
}
