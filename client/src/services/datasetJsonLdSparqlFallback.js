/** EC /dataset 404 → SELECT from named graph, expand to JSON-LD for framing in dataset.vue */
import axios from "axios";
import {
  datasetJsonLdPathVariants,
  normalizeDatasetGraphIri,
} from "@/utils/datasetIdentifiers.js";

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

function assertSafeIri(iri) {
  if (iri == null || typeof iri !== "string" || !iri.trim()) {
    throw new Error("datasetJsonLdSparqlFallback: empty IRI");
  }
  if (/[\s<>"]/.test(iri)) {
    throw new Error("datasetJsonLdSparqlFallback: unsafe IRI character");
  }
}

function normalizePredicate(iri) {
  return String(iri).replace(/^http:\/\/schema\.org\//g, "https://schema.org/");
}

function bnodeId(term) {
  const v = String(term.value || "").replace(/^_:+/, "");
  return `_:${v}`;
}

function termToObject(term) {
  if (term.type === "uri") {
    return { "@id": normalizePredicate(term.value) };
  }
  if (term.type === "bnode") {
    return { "@id": bnodeId(term) };
  }
  if (term.type === "literal") {
    const o = { "@value": term.value };
    if (term.datatype) {
      o["@type"] = normalizePredicate(term.datatype);
    }
    if (term["xml:lang"] && term["xml:lang"] !== "") {
      o["@language"] = term["xml:lang"];
    }
    return o;
  }
  return { "@value": String(term?.value ?? "") };
}

function subjectKey(term) {
  if (term.type === "uri") return term.value;
  if (term.type === "bnode") return bnodeId(term);
  return null;
}

/**
 * @param {Array<Record<string, { type: string, value: string }>>} bindings
 * @returns {object[]}
 */
function bindingsToExpanded(bindings) {
  const nodes = new Map();
  const ensure = (id) => {
    if (!nodes.has(id)) nodes.set(id, { "@id": id });
    return nodes.get(id);
  };
  const seen = new Set();
  for (const row of bindings) {
    if (!row.s || !row.p || !row.o) continue;
    const sid = subjectKey(row.s);
    if (!sid) continue;
    const pid = normalizePredicate(row.p.value);
    const dedupe = `${sid}|${pid}|${row.o.type}|${row.o.value}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const node = ensure(sid);
    const obj = termToObject(row.o);
    if (pid === RDF_TYPE) {
      // jsonld.frame (Dataset) matches on @type; rdf:type IRIs alone often frame to empty.
      if (obj["@id"]) {
        if (!node["@type"]) node["@type"] = [];
        const t = normalizePredicate(obj["@id"]);
        if (!node["@type"].includes(t)) node["@type"].push(t);
      }
      if (!node[RDF_TYPE]) node[RDF_TYPE] = [];
      node[RDF_TYPE].push(obj);
    } else {
      if (!node[pid]) node[pid] = [];
      node[pid].push(obj);
    }
  }
  return [...nodes.values()];
}

function buildQuery(graphIri, subjectIri) {
  assertSafeIri(graphIri);
  assertSafeIri(subjectIri);
  return `SELECT DISTINCT ?s ?p ?o WHERE {
  GRAPH <${graphIri}> {
    {
      BIND(<${subjectIri}> AS ?root)
      ?root ?p ?o .
      BIND(?root AS ?s)
    }
    UNION
    {
      <${subjectIri}> ?p0 ?b .
      FILTER (isBlank(?b))
      ?b ?p ?o .
      BIND(?b AS ?s)
    }
    UNION
    {
      <${subjectIri}> ?p0 ?b1 .
      FILTER (isBlank(?b1))
      ?b1 ?p1 ?b2 .
      FILTER (isBlank(?b2))
      ?b2 ?p ?o .
      BIND(?b2 AS ?s)
    }
  }
}`;
}

/**
 * @param {object} opts
 * @param {string} opts.triplestoreUrl
 * @param {string} opts.subject
 * @param {string} opts.graph
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<object[]|null>} expanded JSON-LD nodes, or null if nothing found
 */
export async function fetchExpandedDatasetJsonLdViaSparql({
  triplestoreUrl,
  subject,
  graph,
  timeoutMs = 25000,
}) {
  const graphNorm = normalizeDatasetGraphIri(graph) || graph;
  if (!triplestoreUrl || !graphNorm || !subject) return null;

  const subjects = datasetJsonLdPathVariants(String(subject).trim());
  const axiosTimeoutMs = Math.max(timeoutMs + 5000, 60000);

  for (const subj of subjects) {
    let query;
    try {
      query = buildQuery(graphNorm, subj);
    } catch {
      continue;
    }
    const url = new URL(triplestoreUrl);
    url.searchParams.set("query", query);
    try {
      const response = await axios.get(url.toString(), {
        timeout: axiosTimeoutMs,
        headers: { Accept: "application/sparql-results+json" },
      });
      const bindings = response?.data?.results?.bindings || [];
      if (!bindings.length) continue;
      const expanded = bindingsToExpanded(bindings);
      if (expanded.length) {
        return expanded;
      }
    } catch {
      // try next subject variant
    }
  }
  return null;
}
