/**
 * Configuration Reader for Standalone SPARQL Query Module
 */

import yaml from 'js-yaml';
import axios from 'axios';
import { AppConfig, ConfigurationError } from './types.js';

export class ConfigurationReader {
  private config: AppConfig | null = null;
  private configPath: string | null = null;

  /**
   * Load configuration from a YAML file or URL
   */
  async loadConfig(configPath: string): Promise<AppConfig> {
    this.configPath = configPath;

    try {
      let configContent: string;

      if (configPath.startsWith('http')) {
        // Load from URL
        const response = await axios.get(configPath);
        configContent = response.data;
      } else {
        // Load from local file/public path
        const response = await fetch(configPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.statusText}`);
        }
        configContent = await response.text();
      }

      const parsedConfig = yaml.load(configContent) as any;
      this.config = this.validateAndTransformConfig(parsedConfig);

      return this.config;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
        configPath
      );
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): AppConfig {
    if (!this.config) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Get a specific facet configuration by field name
   */
  getFacetConfig(field: string) {
    const config = this.getConfig();
    const facet = config.FACETS.find(f => f.field === field);
    if (!facet) {
      throw new ConfigurationError(`Facet configuration not found for field: ${field}`);
    }
    return facet;
  }

  /**
   * Get facets by type
   */
  getFacetsByType(type: string) {
    const config = this.getConfig();
    return config.FACETS.filter(f => f.type === type);
  }

  /**
   * Get the SPARQL endpoint URL
   */
  getSparqlEndpoint(): string {
    const config = this.getConfig();
    return config.TRIPLESTORE_URL;
  }

  /**
   * Get the query engine type
   */
  getQueryEngine() {
    const config = this.getConfig();
    return config.QUERY_ENGINE;
  }

  /**
   * Validate and transform the raw configuration
   */
  private validateAndTransformConfig(rawConfig: any): AppConfig {
    // Required fields validation
    const requiredFields = [
      'COMMUNITY',
      'TRIPLESTORE_URL',
      'QUERY_ENGINE',
      'FACETS'
    ];

    for (const field of requiredFields) {
      if (!rawConfig[field]) {
        throw new ConfigurationError(`Missing required configuration field: ${field}`);
      }
    }

    // Validate query engine
    if (!['blazegraph', 'qlever'].includes(rawConfig.QUERY_ENGINE)) {
      throw new ConfigurationError(
        `Invalid QUERY_ENGINE: ${rawConfig.QUERY_ENGINE}. Must be 'blazegraph' or 'qlever'`
      );
    }

    // Validate facets
    if (!Array.isArray(rawConfig.FACETS)) {
      throw new ConfigurationError('FACETS must be an array');
    }

    for (const facet of rawConfig.FACETS) {
      this.validateFacetConfig(facet);
    }

    // Set defaults for optional fields
    const config: AppConfig = {
      COMMUNITY: rawConfig.COMMUNITY,
      TENANT_URL: rawConfig.TENANT_URL || '',
      API_URL: rawConfig.API_URL || '',
      TRIPLESTORE_URL: rawConfig.TRIPLESTORE_URL,
      SUMMARYSTORE_URL: rawConfig.SUMMARYSTORE_URL || rawConfig.TRIPLESTORE_URL,
      QUERY_ENGINE: rawConfig.QUERY_ENGINE,
      SPARQL_QUERY: rawConfig.SPARQL_QUERY || 'sparql_query.rq',
      FACETS: rawConfig.FACETS,
      ORDER_BY_DEFAULT: rawConfig.ORDER_BY_DEFAULT || 'score',
      ORDER_BY_OPTIONS: rawConfig.ORDER_BY_OPTIONS || [
        { field: 'score', title: 'Relevance', sort: 'desc' },
        { field: 'name', title: 'Name', sort: 'asc' },
        { field: 'date', title: 'Date', sort: 'desc' }
      ],
      LIMIT_DEFAULT: rawConfig.LIMIT_DEFAULT || 50,
      LIMIT_OPTIONS: rawConfig.LIMIT_OPTIONS || [10, 50, 100, 500]
    };

    return config;
  }

  /**
   * Validate individual facet configuration
   */
  private validateFacetConfig(facet: any): void {
    const requiredFacetFields = ['field', 'title', 'type'];

    for (const field of requiredFacetFields) {
      if (!facet[field]) {
        throw new ConfigurationError(`Facet missing required field: ${field}`);
      }
    }

    const validFacetTypes = ['text', 'rangeyear', 'rangedepth', 'geo', 'unassigned', 'all'];
    if (!validFacetTypes.includes(facet.type)) {
      throw new ConfigurationError(
        `Invalid facet type: ${facet.type}. Must be one of: ${validFacetTypes.join(', ')}`
      );
    }

    // Validate sort option
    const validSortOptions = ['asc', 'desc', 'acs'];
    if (facet.sort && !validSortOptions.includes(facet.sort)) {
      throw new ConfigurationError(
        `Invalid sort option: ${facet.sort}. Must be one of: ${validSortOptions.join(', ')}`
      );
    }

    // Set defaults
    facet.sort = facet.sort || 'asc';
    facet.open = facet.open !== undefined ? facet.open : false;
  }

  /**
   * Create a configuration reader with a specific config file
   */
  static async create(configPath: string): Promise<ConfigurationReader> {
    const reader = new ConfigurationReader();
    await reader.loadConfig(configPath);
    return reader;
  }

  /**
   * Create a configuration reader with default QLever config
   */
  static async createWithQLeverDefaults(): Promise<ConfigurationReader> {
    const defaultConfigPath = '/config/config_qlever.yaml';
    return ConfigurationReader.create(defaultConfigPath);
  }
}