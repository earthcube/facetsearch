/**
 * Base Facet Generator - Abstract base class for all facet generators
 */

import { FacetConfig, QueryEngine, FacetGenerationError } from '../types.js';

export abstract class BaseFacetGenerator {
  protected facetConfig: FacetConfig;
  protected queryEngine: QueryEngine;

  constructor(facetConfig: FacetConfig, queryEngine: QueryEngine) {
    this.facetConfig = facetConfig;
    this.queryEngine = queryEngine;
    this.validateConfig();
  }

  /**
   * Generate discovery fragment (OPTIONAL wrapper for counting)
   */
  abstract generateDiscoveryFragment(): string;

  /**
   * Generate active filtering fragment (required filter)
   */
  abstract generateActiveFragment(filterValue: any): string;

  /**
   * Validate facet configuration
   */
  protected validateConfig(): void {
    if (!this.facetConfig.field) {
      throw new FacetGenerationError(
        'Facet field is required',
        this.facetConfig.type,
        this.facetConfig.field
      );
    }

    if (!this.facetConfig.type) {
      throw new FacetGenerationError(
        'Facet type is required',
        this.facetConfig.type,
        this.facetConfig.field
      );
    }
  }

  /**
   * Escape SPARQL string values
   */
  protected escapeValue(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * Wrap fragment in OPTIONAL clause
   */
  protected wrapOptional(fragment: string): string {
    if (fragment.trim().startsWith('OPTIONAL')) {
      return fragment;
    }
    return `OPTIONAL {\n${fragment}\n}`;
  }

  /**
   * Get facet field name
   */
  getFacetField(): string {
    return this.facetConfig.field;
  }

  /**
   * Get facet type
   */
  getFacetType(): string {
    return this.facetConfig.type;
  }

  /**
   * Get query engine
   */
  getQueryEngine(): QueryEngine {
    return this.queryEngine;
  }

  /**
   * Generate both discovery and active fragments
   */
  generateFragments(filterValue?: any): { discovery: string; active?: string } {
    const discovery = this.generateDiscoveryFragment();
    const active = filterValue !== undefined ? this.generateActiveFragment(filterValue) : undefined;

    return { discovery, active };
  }
}