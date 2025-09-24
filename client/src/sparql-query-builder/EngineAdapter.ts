/**
 * Engine Adapter - Handles differences between SPARQL engines
 * Supports Blazegraph and QLever with engine-specific optimizations
 */

import { QueryEngine, SparqlQueryError } from './types.js';

export class EngineAdapter {
  /**
   * Get engine-specific prefixes
   */
  static getEnginePrefixes(engine: QueryEngine): string {
    switch (engine) {
      case 'blazegraph':
        return 'PREFIX bds: <http://www.bigdata.com/rdf/search#>';
      case 'qlever':
        return 'PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin-functions/>';
      default:
        throw new SparqlQueryError(`Unsupported engine: ${engine}`, engine);
    }
  }

  /**
   * Generate engine-specific text search fragment
   */
  static generateTextSearch(query: string, engine: QueryEngine): string {
    const escapedQuery = this.escapeQuery(query);

    switch (engine) {
      case 'blazegraph':
        return `
    ?lit bds:search "${escapedQuery}" .
    ?lit bds:relevance ?score1 .
    ?g ?p ?lit .
    ?subj ?o ?item .`;

      case 'qlever':
        return `
    ?subj ?o ?item .
    ?text ql:contains-entity ?item .
    ?text ql:contains-word "${escapedQuery}"`;

      default:
        throw new SparqlQueryError(`Unsupported engine: ${engine}`, engine);
    }
  }

  /**
   * Get engine-specific query hints and optimizations
   */
  static getQueryHints(engine: QueryEngine): string {
    switch (engine) {
      case 'blazegraph':
        return `
# Blazegraph query hints
# hint:Prior hint:runFirst true`;

      case 'qlever':
        return `
# QLever optimizations`;

      default:
        return '';
    }
  }

  /**
   * Get engine-specific timeout parameter
   */
  static getTimeoutParameter(engine: QueryEngine, timeoutSeconds: number = 30): string {
    switch (engine) {
      case 'blazegraph':
        return `timeout=${timeoutSeconds}`;
      case 'qlever':
        return ''; // QLever doesn't use URL timeout parameters
      default:
        return '';
    }
  }

  /**
   * Get engine-specific result format preferences
   */
  static getPreferredResultFormat(engine: QueryEngine): string {
    switch (engine) {
      case 'blazegraph':
        return 'application/sparql-results+json';
      case 'qlever':
        return 'application/sparql-results+json';
      default:
        return 'application/sparql-results+json';
    }
  }

  /**
   * Get engine-specific HTTP headers
   */
  static getRequestHeaders(engine: QueryEngine): Record<string, string> {
    const baseHeaders = {
      'Accept': this.getPreferredResultFormat(engine),
      'User-Agent': 'FacetSearch-SPARQL-Module/1.0'
    };

    switch (engine) {
      case 'blazegraph':
        return {
          ...baseHeaders,
          'Cache-Control': 'no-cache'
        };
      case 'qlever':
        return baseHeaders;
      default:
        return baseHeaders;
    }
  }

  /**
   * Optimize query for specific engine
   */
  static optimizeQuery(query: string, engine: QueryEngine): string {
    switch (engine) {
      case 'blazegraph':
        return this.optimizeForBlazegraph(query);
      case 'qlever':
        return this.optimizeForQLever(query);
      default:
        return query;
    }
  }

  /**
   * Blazegraph-specific optimizations
   */
  private static optimizeForBlazegraph(query: string): string {
    return query
      // Use bds:search for full-text instead of regex when possible
      .replace(/FILTER\s*\(\s*REGEX\s*\([^)]+\)\s*\)/gi, (match) => {
        // This is a placeholder - would need more sophisticated regex-to-bds conversion
        return match;
      })
      // Add query hints at the beginning
      .replace(/SELECT/, 'SELECT\n# hint:Prior hint:runFirst true\n# hint:Group hint:optimizer "NONE"');
  }

  /**
   * QLever-specific optimizations
   */
  private static optimizeForQLever(query: string): string {
    return query
      // QLever performs better with explicit variable ordering in some cases
      .replace(/\{\s*\?subj\s+\?p\s+\?o\s*\.\s*\}/g,
        '{ ?subj ?p ?o . } # Optimized for QLever');
  }

  /**
   * Escape special characters in search queries
   */
  static escapeQuery(query: string): string {
    return query
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/"/g, '\\"')    // Escape quotes
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '\\r')   // Escape carriage returns
      .replace(/\t/g, '\\t');  // Escape tabs
  }

  /**
   * Validate engine compatibility with query features
   */
  static validateQueryCompatibility(query: string, engine: QueryEngine): void {
    switch (engine) {
      case 'blazegraph':
        if (query.includes('ql:contains-word')) {
          throw new SparqlQueryError(
            'QLever-specific functions found in query for Blazegraph engine',
            engine,
            query
          );
        }
        break;
      case 'qlever':
        if (query.includes('bds:search')) {
          throw new SparqlQueryError(
            'Blazegraph-specific functions found in query for QLever engine',
            engine,
            query
          );
        }
        break;
    }
  }

  /**
   * Get engine-specific query parameter format
   */
  static formatQueryParameters(query: string, engine: QueryEngine): URLSearchParams {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('queryLn', 'sparql');

    switch (engine) {
      case 'blazegraph':
        params.append('timeout', '30'); // 30 second timeout
        break;
      case 'qlever':
        // QLever doesn't need special parameters
        break;
    }

    return params;
  }

  /**
   * Get supported engines list
   */
  static getSupportedEngines(): QueryEngine[] {
    return ['blazegraph', 'qlever'];
  }

  /**
   * Check if engine is supported
   */
  static isEngineSupported(engine: string): engine is QueryEngine {
    return this.getSupportedEngines().includes(engine as QueryEngine);
  }
}