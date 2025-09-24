/**
 * SPARQL Query Builder Module
 * Standalone module for dynamic SPARQL query generation with faceted search
 *
 * Usage:
 * ```typescript
 * import { SparqlQueryModule } from './sparql-query-builder';
 *
 * const module = await SparqlQueryModule.create('/config/config_qlever.yaml');
 * const query = module.buildTextSearch('nitrogen');
 * const results = await module.executeQuery(query);
 * ```
 */

export * from './types.js';
export * from './ConfigurationReader.js';
export * from './SparqlQueryBuilder.js';
export * from './EngineAdapter.js';
export * from './generators/index.js';
export * from './SparqlQueryModule.js';

// Default export for easy importing
export { SparqlQueryModule as default } from './SparqlQueryModule.js';