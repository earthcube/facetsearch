/**
 * QLever Live Test for Nitrogen Search
 *
 * This test directly queries the QLever endpoint to test nitrogen search functionality
 * as outlined in the SPARQL_FILTERING_REFACTOR_PLAN.md
 */

// Simple SPARQL test service for QLever
class SparqlTestService {
  constructor(endpoint, queryEngine = 'qlever') {
    this.endpoint = endpoint;
    this.queryEngine = queryEngine;
    this.timeout = 15000;
    this.retryCount = 3;
  }

  async executeQuery(sparqlQuery, options = {}) {
    const { validateSyntax = true, measurePerformance = false } = options;

    if (validateSyntax) {
      this.validateSparqlSyntax(sparqlQuery);
    }

    const startTime = measurePerformance ? Date.now() : 0;

    try {
      const response = await this.executeWithRetry(sparqlQuery);
      const endTime = measurePerformance ? Date.now() : 0;

      return {
        success: true,
        results: response.results?.bindings || [],
        queryTime: endTime - startTime,
        resultCount: response.results?.bindings?.length || 0,
        endpoint: this.endpoint,
        engine: this.queryEngine
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        queryTime: measurePerformance ? Date.now() - startTime : 0,
        endpoint: this.endpoint,
        engine: this.queryEngine
      };
    }
  }

  async executeWithRetry(sparqlQuery, attempt = 1) {
    try {
      const params = new URLSearchParams();
      params.append('query', sparqlQuery);
      params.append('queryLn', 'sparql');

      const response = await fetch(`${this.endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'FacetSearch-Test-Suite/1.0'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.retryCount && !error.message.includes('timeout')) {
        await this.delay(attempt * 1000);
        return this.executeWithRetry(sparqlQuery, attempt + 1);
      }
      throw error;
    }
  }

  validateSparqlSyntax(sparqlQuery) {
    const requiredKeywords = ['SELECT', 'WHERE'];
    const hasRequired = requiredKeywords.every(keyword =>
      sparqlQuery.toUpperCase().includes(keyword)
    );

    if (!hasRequired) {
      throw new Error(`Invalid SPARQL: Missing required keywords ${requiredKeywords}`);
    }

    const openBraces = (sparqlQuery.match(/{/g) || []).length;
    const closeBraces = (sparqlQuery.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      throw new Error('Invalid SPARQL: Unbalanced braces');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test execution
async function runNitrogenTest() {
  console.log('🧪 Starting QLever Nitrogen Search Test...\n');

  const endpoint = 'https://qlever.geocodes-aws-dev.earthcube.org/graphspace/facetsearch';
  const testService = new SparqlTestService(endpoint, 'qlever');

  // Create nitrogen search query based on existing QLever query structure
  const nitrogenQuery = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX schema: <http://schema.org/>
PREFIX sschema: <https://schema.org/>
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin-functions/>

SELECT DISTINCT ?g ?subj ?type ?name ?description ?pubname
    (GROUP_CONCAT(DISTINCT ?placename; SEPARATOR=", ") AS ?placenames)
    (GROUP_CONCAT(DISTINCT ?kwu; SEPARATOR=", ") AS ?kw)
    ?datep
    (COUNT(?text) AS ?score)
    (SAMPLE(?text) AS ?example_text)
    (GROUP_CONCAT(DISTINCT ?resourceType_u; SEPARATOR=", ") as ?resourceType)
    (GROUP_CONCAT(DISTINCT ?variableMeasured_a; SEPARATOR=", ") as ?variableMeasured)
WHERE {
    VALUES ?sosType {
        sschema:Dataset
        schema:Dataset
    }
    ?subj a ?sosType .

    VALUES (?type ?resourceType_u) {
        (schema:Dataset "data")
        (sschema:Dataset "data")
        (schema:ResearchProject "researchProject")
        (sschema:ResearchProject "researchProject")
        (schema:SoftwareApplication "tool")
        (sschema:SoftwareApplication "tool")
    }
    ?subj a ?type .
    ?subj ?o ?item .

    # QLever text search for nitrogen
    ?text ql:contains-entity ?item .
    ?text ql:contains-word "nitrogen"

    GRAPH ?g {
        ?subj schema:name|sschema:name ?name .
        ?subj schema:description|sschema:description ?description .

        OPTIONAL { ?subj schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?legalName . }
        OPTIONAL { ?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?publisher . }
        BIND (COALESCE(?publisher, ?legalName, "No Publisher") AS ?pubname)

        OPTIONAL { ?subj schema:datePublished|sschema:datePublished ?datep1 . }
        OPTIONAL { ?subj schema:dateCreated|sschema:dateCreated ?datec . }
        OPTIONAL { ?subj schema:dateModified|sschema:dateModified ?datem . }
        BIND (COALESCE(?datec, ?datem, ?datep1) AS ?datep)

        OPTIONAL {
            ?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name|sschema:sdPublisher ?place_name .
        }
        BIND (IF (BOUND(?place_name), ?place_name, "No Placenames") AS ?placename) .

        OPTIONAL { ?subj schema:keywords|sschema:keywords ?kwu . }

        OPTIONAL {
            ?subj sschema:variableMeasured ?vmd .
            ?vmd a sschema:PropertyValue .
            ?vmd sschema:name ?variableMeasured_a .
        }
    }
}
GROUP BY ?g ?subj ?name ?description ?type ?pubname ?placename ?datep
ORDER BY DESC(?score)
LIMIT 10
`;

  console.log('📋 Query Details:');
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Search term: nitrogen`);
  console.log(`Engine: QLever`);
  console.log('');

  const result = await testService.executeQuery(nitrogenQuery, {
    measurePerformance: true
  });

  console.log('📊 Test Results:');
  console.log(`Success: ${result.success}`);
  console.log(`Query time: ${result.queryTime}ms`);
  console.log(`Result count: ${result.resultCount}`);

  if (result.success) {
    console.log('');
    console.log('✅ Query executed successfully!');

    if (result.results.length > 0) {
      console.log('');
      console.log('📋 Sample Results:');

      result.results.slice(0, 5).forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.name?.value || 'No name'}`);
        console.log(`   Publisher: ${result.pubname?.value || 'Unknown'}`);
        console.log(`   Type: ${result.resourceType?.value || 'Unknown'}`);
        console.log(`   Score: ${result.score?.value || '0'}`);

        if (result.kw?.value) {
          const keywords = result.kw.value.split(', ').slice(0, 3);
          console.log(`   Keywords: ${keywords.join(', ')}${keywords.length < result.kw.value.split(', ').length ? '...' : ''}`);
        }

        if (result.variableMeasured?.value) {
          const vars = result.variableMeasured.value.split(', ').slice(0, 3);
          console.log(`   Variables: ${vars.join(', ')}${vars.length < result.variableMeasured.value.split(', ').length ? '...' : ''}`);
        }
      });

      console.log('');
      console.log('🔍 Analysis:');

      // Analyze results for nitrogen-related content
      const nitrogenKeywords = result.results.filter(r =>
        r.kw?.value?.toLowerCase().includes('nitrogen')
      ).length;

      const nitrogenVariables = result.results.filter(r =>
        r.variableMeasured?.value?.toLowerCase().includes('nitrogen')
      ).length;

      const nitrogenDescriptions = result.results.filter(r =>
        r.description?.value?.toLowerCase().includes('nitrogen')
      ).length;

      console.log(`- Results with nitrogen in keywords: ${nitrogenKeywords}`);
      console.log(`- Results with nitrogen in variables: ${nitrogenVariables}`);
      console.log(`- Results with nitrogen in description: ${nitrogenDescriptions}`);

      // Performance analysis
      if (result.queryTime < 5000) {
        console.log(`- Performance: Excellent (${result.queryTime}ms < 5s threshold)`);
      } else if (result.queryTime < 10000) {
        console.log(`- Performance: Good (${result.queryTime}ms < 10s threshold)`);
      } else {
        console.log(`- Performance: Needs improvement (${result.queryTime}ms > 10s)`);
      }

    } else {
      console.log('⚠️  No results returned for nitrogen search');
    }

  } else {
    console.log('');
    console.log('❌ Query failed:');
    console.log(`Error: ${result.error}`);
  }

  console.log('');
  console.log('🏁 Test completed!');

  return result;
}

// Export for potential use in test frameworks
export { runNitrogenTest, SparqlTestService };

// Run test if this file is executed directly
if (typeof window === 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  runNitrogenTest().catch(console.error);
}