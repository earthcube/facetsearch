import axios from "axios";

/**
 * Find one schema:Dataset (http or https schema.org) subject inside a named graph.
 */
export async function fetchPrimaryDatasetSubjectInGraph({
  triplestoreUrl,
  graph,
  timeoutMs = 25000,
}) {
  if (!triplestoreUrl || !graph) return null;
  const g = String(graph).trim();
  const graphTerm = g.startsWith("<") && g.endsWith(">") ? g : `<${g}>`;
  const query = `PREFIX schema: <http://schema.org/>
PREFIX sschema: <https://schema.org/>
SELECT ?s WHERE {
  GRAPH ${graphTerm} {
    { ?s a schema:Dataset . }
    UNION
    { ?s a sschema:Dataset . }
  }
}
LIMIT 1`;

  const response = await axios.post(
    triplestoreUrl,
    new URLSearchParams({
      query,
      format: "json",
    }),
    {
      timeout: timeoutMs,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
    }
  );
  const b = response.data?.results?.bindings?.[0];
  return b?.s?.value || null;
}
