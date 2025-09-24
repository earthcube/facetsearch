/**
 * SPARQL Query Module - Main facade class for the standalone module
 * Provides a simple interface for building and executing SPARQL queries with faceted search
 */

import { ConfigurationReader } from './ConfigurationReader.js';
import { SparqlQueryBuilder } from './SparqlQueryBuilder.js';
import { EngineAdapter } from './EngineAdapter.js';
import { TextFacetGenerator } from './generators/TextFacetGenerator.js';
import { RangeFacetGenerator } from './generators/RangeFacetGenerator.js';
import { SpatialFacetGenerator } from './generators/SpatialFacetGenerator.js';
import {
  QueryOptions,
  QueryResult,
  AppConfig,
  FacetConfig,
  QueryEngine,
  SparqlQueryModuleInterface,
  TextFilterValue,
  RangeFilterValue,
  SpatialFilterValue,
  SparqlQueryError,
  SparqlResponse
} from './types.js';

export class SparqlQueryModule implements SparqlQueryModuleInterface {
  private configReader: ConfigurationReader;
  private queryBuilder: SparqlQueryBuilder;
  private facetGenerators: Map<string, any> = new Map();

  constructor(configReader: ConfigurationReader) {
    this.configReader = configReader;
    const config = configReader.getConfig();
    this.queryBuilder = new SparqlQueryBuilder(config.QUERY_ENGINE);
    this.initializeFacetGenerators();
  }

  /**
   * Create a new SparqlQueryModule instance
   */
  static async create(configPath: string): Promise<SparqlQueryModule> {
    const configReader = await ConfigurationReader.create(configPath);
    return new SparqlQueryModule(configReader);
  }

  /**
   * Create with default QLever configuration
   */
  static async createWithQLeverDefaults(): Promise<SparqlQueryModule> {
    const configReader = await ConfigurationReader.createWithQLeverDefaults();
    return new SparqlQueryModule(configReader);
  }

  /**
   * Initialize facet generators for all configured facets
   */
  private initializeFacetGenerators(): void {
    const config = this.getConfig();

    for (const facetConfig of config.FACETS) {
      let generator;

      switch (facetConfig.type) {
        case 'text':
          generator = new TextFacetGenerator(facetConfig, config.QUERY_ENGINE);
          break;
        case 'rangeyear':
        case 'rangedepth':
          generator = new RangeFacetGenerator(facetConfig, config.QUERY_ENGINE);
          break;
        case 'geo':
          generator = new SpatialFacetGenerator(facetConfig, config.QUERY_ENGINE);
          break;
        default:
          // Skip unsupported facet types
          continue;
      }

      this.facetGenerators.set(facetConfig.field, generator);

      // Add discovery fragment for this facet
      const discoveryFragment = generator.generateDiscoveryFragment();
      this.queryBuilder.setFacetFragment(facetConfig.field, discoveryFragment, false);
    }
  }

  /**
   * Build a text search query
   */
  buildTextSearch(query: string, options?: QueryOptions): string {
    return this.queryBuilder.buildQuery(query, options);
  }

  /**
   * Build a query with current facet state
   */
  buildQuery(options?: QueryOptions): string {
    return this.queryBuilder.buildQuery('', options);
  }

  /**
   * Add text filter for a specific facet
   */
  addTextFilter(field: string, values: string[]): void {
    const generator = this.getFacetGenerator(field);

    if (!(generator instanceof TextFacetGenerator)) {
      throw new SparqlQueryError(
        `Field ${field} is not a text facet`,
        this.getEngine(),
        undefined
      );
    }

    const activeFragment = generator.generateActiveFragment(values);
    this.queryBuilder.setFacetFragment(field, activeFragment, true);
  }

  /**
   * Add range filter for a specific facet
   */
  addRangeFilter(field: string, min: number, max: number): void {
    const generator = this.getFacetGenerator(field);

    if (!(generator instanceof RangeFacetGenerator)) {
      throw new SparqlQueryError(
        `Field ${field} is not a range facet`,
        this.getEngine(),
        undefined
      );
    }

    const activeFragment = generator.generateActiveFragment({ min, max });
    this.queryBuilder.setFacetFragment(field, activeFragment, true);
  }

  /**
   * Add spatial filter for a specific facet
   */
  addSpatialFilter(field: string, bounds: SpatialFilterValue): void {
    const generator = this.getFacetGenerator(field);

    if (!(generator instanceof SpatialFacetGenerator)) {
      throw new SparqlQueryError(
        `Field ${field} is not a spatial facet`,
        this.getEngine(),
        undefined
      );
    }

    const activeFragment = generator.generateActiveFragment(bounds);
    this.queryBuilder.setFacetFragment(field, activeFragment, true);
  }

  /**
   * Remove filter for a specific facet
   */
  removeFilter(field: string): void {
    // Remove active filter and restore discovery fragment
    const generator = this.facetGenerators.get(field);
    if (generator) {
      const discoveryFragment = generator.generateDiscoveryFragment();
      this.queryBuilder.setFacetFragment(field, discoveryFragment, false);
    } else {
      this.queryBuilder.removeFacetFragment(field);
    }
  }

  /**
   * Clear all active filters
   */
  clearFilters(): void {
    this.queryBuilder.clearAllFragments();
    this.initializeFacetGenerators(); // Re-initialize with discovery fragments
  }

  /**
   * Execute a SPARQL query against the configured endpoint
   */
  async executeQuery(query: string): Promise<QueryResult> {
    const config = this.getConfig();
    const endpoint = config.TRIPLESTORE_URL;
    const engine = config.QUERY_ENGINE;

    const startTime = Date.now();

    try {
      // Validate query compatibility
      EngineAdapter.validateQueryCompatibility(query, engine);

      // Optimize query for the specific engine
      const optimizedQuery = EngineAdapter.optimizeQuery(query, engine);

      // Prepare request
      const params = EngineAdapter.formatQueryParameters(optimizedQuery, engine);
      const headers = EngineAdapter.getRequestHeaders(engine);

      const response = await fetch(`${endpoint}?${params}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SparqlResponse = await response.json();
      const queryTime = Date.now() - startTime;

      return {
        success: true,
        results: data.results?.bindings || [],
        queryTime,
        resultCount: data.results?.bindings?.length || 0,
        endpoint,
        engine,
        query: optimizedQuery
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;

      return {
        success: false,
        results: [],
        queryTime,
        resultCount: 0,
        endpoint,
        engine,
        error: error instanceof Error ? error.message : String(error),
        query
      };
    }
  }

  /**
   * Execute a text search and return results
   */
  async executeTextSearch(searchQuery: string, options?: QueryOptions): Promise<QueryResult> {
    const sparqlQuery = this.buildTextSearch(searchQuery, options);
    return this.executeQuery(sparqlQuery);
  }

  /**
   * Get the current configuration
   */
  getConfig(): AppConfig {
    return this.configReader.getConfig();
  }

  /**
   * Get a specific facet configuration
   */
  getFacetConfig(field: string): FacetConfig {
    return this.configReader.getFacetConfig(field);
  }

  /**
   * Get the SPARQL endpoint URL
   */
  getEndpoint(): string {
    return this.configReader.getSparqlEndpoint();
  }

  /**
   * Get the query engine type
   */
  getEngine(): QueryEngine {
    return this.configReader.getQueryEngine();
  }

  /**
   * Get all configured facets
   */
  getAllFacets(): FacetConfig[] {
    return this.getConfig().FACETS;
  }

  /**
   * Get facets by type
   */
  getFacetsByType(type: string): FacetConfig[] {
    return this.configReader.getFacetsByType(type);
  }

  /**
   * Get active filter fields
   */
  getActiveFilters(): string[] {
    return this.queryBuilder.getActiveFilterFields();
  }

  /**
   * Check if a field has an active filter
   */
  hasActiveFilter(field: string): boolean {
    return this.queryBuilder.hasActiveFilter(field);
  }

  /**
   * Get query builder statistics
   */
  getQueryStats() {
    return {
      activeFilters: this.queryBuilder.getActiveFilterCount(),
      discoveryFragments: this.queryBuilder.getDiscoveryFragmentCount(),
      engine: this.queryBuilder.getEngine(),
      endpoint: this.getEndpoint()
    };
  }

  /**
   * Get a facet generator for a specific field
   */
  private getFacetGenerator(field: string) {
    const generator = this.facetGenerators.get(field);
    if (!generator) {
      throw new SparqlQueryError(
        `No facet generator found for field: ${field}`,
        this.getEngine(),
        undefined
      );
    }
    return generator;
  }

  /**
   * Advanced: Get raw query builder for custom operations
   */
  getQueryBuilder(): SparqlQueryBuilder {
    return this.queryBuilder;
  }

  /**
   * Advanced: Get raw configuration reader
   */
  getConfigurationReader(): ConfigurationReader {
    return this.configReader;
  }

  /**
   * Advanced: Rebuild facet generators after configuration changes
   */
  rebuildFacetGenerators(): void {
    this.facetGenerators.clear();
    this.queryBuilder.clearAllFragments();
    this.initializeFacetGenerators();
  }
}