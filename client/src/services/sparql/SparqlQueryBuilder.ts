/**
 * SPARQL Query Builder - Main orchestrator for dynamic query generation
 * Based on the Fragment Injection Pipeline from SPARQL_FILTERING_REFACTOR_PLAN.md
 */

import { QueryEngine, QueryOptions, FacetConfig, SparqlQueryError } from './types.js';
import { EngineAdapter } from './EngineAdapter.js';

export class SparqlQueryBuilder {
  private baseTemplate: string;
  private queryEngine: QueryEngine;
  private facetFragments: Map<string, string> = new Map();
  private activeFilters: Map<string, string> = new Map();

  constructor(queryEngine: QueryEngine) {
    this.queryEngine = queryEngine;
    this.baseTemplate = this.getBaseTemplate();
  }

  /**
   * Add or update facet fragment
   */
  setFacetFragment(facetField: string, fragment: string, isActive: boolean = false): void {
    if (isActive) {
      this.activeFilters.set(facetField, fragment);
      this.facetFragments.delete(facetField); // Remove discovery fragment
    } else {
      this.facetFragments.set(facetField, this.wrapOptional(fragment));
      this.activeFilters.delete(facetField); // Remove active filter
    }
  }

  /**
   * Remove a facet fragment completely
   */
  removeFacetFragment(facetField: string): void {
    this.facetFragments.delete(facetField);
    this.activeFilters.delete(facetField);
  }

  /**
   * Clear all facet fragments
   */
  clearAllFragments(): void {
    this.facetFragments.clear();
    this.activeFilters.clear();
  }

  /**
   * Build complete SPARQL query
   */
  buildQuery(textQuery: string = '', options: QueryOptions = {}): string {
    const {
      limit = 50,
      offset = 0,
      selectFields = this.getDefaultSelectFields(),
      groupBy = true,
      orderBy = 'DESC(?score)'
    } = options;

    try {
      const query = this.baseTemplate
        .replace('${engineSpecificPrefixes}', this.getEnginePrefixes())
        .replace('${selectFields}', selectFields)
        .replace('${textSearchFragment}', this.generateTextSearchFragment(textQuery))
        .replace('${facetFilters}', this.combineAllFragments())
        .replace('${responseBodyFragment}', this.getResponseBodyFragment())
        .replace('${groupByClause}', groupBy ? this.getGroupByClause() : '')
        .replace('${orderByClause}', `ORDER BY ${orderBy}`)
        .replace('${limitValue}', limit.toString())
        .replace('${offsetValue}', offset.toString());

      return this.cleanupQuery(query);
    } catch (error) {
      throw new SparqlQueryError(
        `Failed to build SPARQL query: ${error instanceof Error ? error.message : String(error)}`,
        this.queryEngine,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the base query template
   */
  private getBaseTemplate(): string {
    return `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX schema: <http://schema.org/>
PREFIX sschema: <https://schema.org/>
\${engineSpecificPrefixes}

SELECT DISTINCT \${selectFields}
WHERE {
  \${textSearchFragment}
  \${facetFilters}
  \${responseBodyFragment}
}
\${groupByClause}
\${orderByClause}
LIMIT \${limitValue}
OFFSET \${offsetValue}
`;
  }

  /**
   * Get engine-specific prefixes
   */
  private getEnginePrefixes(): string {
    return EngineAdapter.getEnginePrefixes(this.queryEngine);
  }

  /**
   * Generate text search fragment
   */
  private generateTextSearchFragment(textQuery: string): string {
    if (!textQuery.trim()) {
      return '# No text search query provided';
    }

    return EngineAdapter.generateTextSearch(textQuery, this.queryEngine);
  }

  /**
   * Get default select fields for the query
   */
  private getDefaultSelectFields(): string {
    return `?g ?subj ?type ?name ?description ?pubname
    (GROUP_CONCAT(DISTINCT ?placename; SEPARATOR=", ") AS ?placenames)
    (GROUP_CONCAT(DISTINCT ?kwu; SEPARATOR=", ") AS ?kw)
    ?datep
    (COUNT(?text) AS ?score)
    (SAMPLE(?text) AS ?example_text)
    (GROUP_CONCAT(DISTINCT ?resourceType_u; SEPARATOR=", ") as ?resourceType)
    (MAX(?lat) as ?maxlat) (MIN(?lat) as ?minlat)
    (MAX(?lon) as ?maxlon) (MIN(?lon) as ?minlon)
    ?maxDepth ?minDepth ?temporalCoverage
    (GROUP_CONCAT(DISTINCT ?variableMeasured_a; SEPARATOR=", ") as ?variableMeasured)
    ?bbox`;
  }

  /**
   * Get the response body fragment (core graph pattern)
   */
  private getResponseBodyFragment(): string {
    return `
    VALUES ?sosType {
        sschema:Dataset
        schema:Dataset
        sschema:ResearchProject
        schema:ResearchProject
        sschema:SoftwareApplication
        schema:SoftwareApplication
    }
    ?subj a ?sosType .

    VALUES (?type ?resourceType_u) {
        (schema:Dataset "data")
        (sschema:Dataset "data")
        (schema:ResearchProject "researchProject")
        (sschema:ResearchProject "researchProject")
        (schema:SoftwareApplication "tool")
        (sschema:SoftwareApplication "tool")
        (schema:Person "person")
        (sschema:Person "person")
        (schema:Event "event")
        (sschema:Event "event")
        (schema:Award "award")
        (sschema:Award "award")
        (schema:DataCatalog "DataCatalog")
        (sschema:DataCatalog "DataCatalog")
    }
    ?subj a ?type .

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

        OPTIONAL { ?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage . }

        OPTIONAL {
            ?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name|sschema:sdPublisher ?place_name .
        }
        BIND (IF (BOUND(?place_name), ?place_name, "No Placenames") AS ?placename) .

        OPTIONAL { ?subj schema:keywords|sschema:keywords ?kwu . }

        OPTIONAL {
            ?subj schema:spatialCoverage|sschema:spatialCoverage ?spatialCoverage .
            ?spatialCoverage schema:geo|sschema:geo ?geo .
            ?geo schema:latitude|sschema:latitude ?lat .
            ?geo schema:longitude|sschema:longitude ?lon .
        }

        OPTIONAL {
            ?subj schema:spatialCoverage|sschema:spatialCoverage ?spatialCoverage .
            ?spatialCoverage schema:geo|sschema:geo ?geoShape .
            ?geoShape schema:box|sschema:box ?bbox .
        }

        OPTIONAL {
            ?subj sschema:variableMeasured ?vmd .
            ?vmd a sschema:PropertyValue .
            ?vmd sschema:name ?namedepth .
            FILTER (LCASE(?namedepth) IN ("depth", "cmpdep", "package_depth", "collection_depth", "bottle depth", "sample depth", "tow depth")) .
            ?vmd sschema:maxValue ?maxDepth_d .
            ?vmd sschema:minValue ?minDepth_d .
            BIND (COALESCE(?maxDepth_d) AS ?maxDepth)
            BIND (COALESCE(?minDepth_d) AS ?minDepth)
        }

        OPTIONAL {
            ?subj sschema:variableMeasured ?vm .
            ?vm a sschema:PropertyValue .
            ?vm sschema:name ?variableMeasured_a .
        }
    }`;
  }

  /**
   * Get GROUP BY clause
   */
  private getGroupByClause(): string {
    return `GROUP BY ?g ?subj ?name ?description ?type ?pubname ?placename ?datep ?maxDepth ?minDepth ?temporalCoverage ?bbox`;
  }

  /**
   * Combine all fragment types
   */
  private combineAllFragments(): string {
    const discoveryFragments = Array.from(this.facetFragments.values());
    const activeFragments = Array.from(this.activeFilters.values());
    const allFragments = [...discoveryFragments, ...activeFragments];

    return allFragments.length > 0 ? allFragments.join('\n\n') : '# No facet filters applied';
  }

  /**
   * Wrap fragment in OPTIONAL clause
   */
  private wrapOptional(fragment: string): string {
    if (fragment.trim().startsWith('OPTIONAL')) {
      return fragment;
    }
    return `OPTIONAL {\n${fragment}\n}`;
  }

  /**
   * Clean up the generated query
   */
  private cleanupQuery(query: string): string {
    return query
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive blank lines
      .replace(/^\s*\n/gm, '') // Remove empty lines at start
      .trim();
  }

  /**
   * Get current engine
   */
  getEngine(): QueryEngine {
    return this.queryEngine;
  }

  /**
   * Get active filter count
   */
  getActiveFilterCount(): number {
    return this.activeFilters.size;
  }

  /**
   * Get discovery fragment count
   */
  getDiscoveryFragmentCount(): number {
    return this.facetFragments.size;
  }

  /**
   * Get all active filter fields
   */
  getActiveFilterFields(): string[] {
    return Array.from(this.activeFilters.keys());
  }

  /**
   * Get all discovery fragment fields
   */
  getDiscoveryFragmentFields(): string[] {
    return Array.from(this.facetFragments.keys());
  }

  /**
   * Check if a field has an active filter
   */
  hasActiveFilter(field: string): boolean {
    return this.activeFilters.has(field);
  }

  /**
   * Check if a field has a discovery fragment
   */
  hasDiscoveryFragment(field: string): boolean {
    return this.facetFragments.has(field);
  }
}