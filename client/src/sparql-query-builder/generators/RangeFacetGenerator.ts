/**
 * Range Facet Generator - Configuration-driven range facet handling
 * Generates SPARQL fragments based on facet configuration with sparql_property and sparql_filter
 */

import { BaseFacetGenerator } from './BaseFacetGenerator.js';
import { FacetConfig, QueryEngine, RangeFilterValue } from '../types.js';

export class RangeFacetGenerator extends BaseFacetGenerator {
  private rangeType: 'depth' | 'temporal' | 'year' | 'numeric' | 'propertyrange' | 'propertyvalue';

  constructor(facetConfig: FacetConfig, queryEngine: QueryEngine) {
    super(facetConfig, queryEngine);
    this.rangeType = this.determineRangeType();
    this.validateRangeFacetConfig();
  }

  /**
   * Determine the type of range based on field name and configuration
   */
  private determineRangeType(): 'depth' | 'temporal' | 'year' | 'numeric' | 'propertyrange' | 'propertyvalue' {
    const field = this.facetConfig.field;
    const type = this.facetConfig.type;

    // Check explicit type configuration first
    if (type === 'rangedepth' || type === 'depthrange') return 'depth';
    if (type === 'rangeyear' || type === 'depthyear') return 'year';
    if (type === 'propertyrange') return 'propertyrange';
    if (type === 'propertyvalue') return 'propertyvalue';

    // Infer from field name
    if (field.includes('depth')) return 'depth';
    if (field.includes('temporal') || field.includes('date')) {
      return field.includes('year') ? 'year' : 'temporal';
    }

    return 'numeric';
  }

  /**
   * Validate range facet configuration
   */
  private validateRangeFacetConfig(): void {
    if (!this.facetConfig.sparql_property && !this.hasBuiltInSupport()) {
      throw new Error(
        `Range facet '${this.facetConfig.field}' requires 'sparql_property' configuration or built-in support`
      );
    }

    // Validate property-specific configurations
    if ((this.rangeType === 'propertyrange' || this.rangeType === 'propertyvalue')) {
      if (!this.facetConfig.property_names && !this.facetConfig.depth_properties) {
        throw new Error(
          `Property range facet '${this.facetConfig.field}' requires 'property_names' or 'depth_properties' configuration`
        );
      }
    }
  }

  /**
   * Check if this facet has built-in support (for backward compatibility)
   */
  private hasBuiltInSupport(): boolean {
    const builtInFields = ['minDepth', 'maxDepth', 'depth', 'datep', 'temporalCoverage'];
    return builtInFields.includes(this.facetConfig.field) || this.facetConfig.depth_properties;
  }

  /**
   * Generate discovery fragment for range data
   */
  generateDiscoveryFragment(): string {
    // Use configured sparql_property if available
    if (this.facetConfig.sparql_property) {
      return this.generateConfiguredDiscoveryFragment();
    }

    // Fall back to built-in implementations
    return this.generateBuiltInDiscoveryFragment();
  }

  /**
   * Generate discovery fragment from configuration
   */
  private generateConfiguredDiscoveryFragment(): string {
    const sparqlProperty = this.facetConfig.sparql_property;

    if (!sparqlProperty) {
      throw new Error(`No sparql_property configured for field: ${this.facetConfig.field}`);
    }

    // Handle both string and array configurations
    if (Array.isArray(sparqlProperty)) {
      // Multi-line SPARQL property (common for range facets)
      return sparqlProperty.join('\n');
    } else {
      // Simple SPARQL property
      return `OPTIONAL { ${this.interpolateTemplate(sparqlProperty, {})} }`;
    }
  }

  /**
   * Generate built-in discovery fragment for backward compatibility
   */
  private generateBuiltInDiscoveryFragment(): string {
    switch (this.rangeType) {
      case 'depth':
        return this.generateDepthDiscoveryFragment();
      case 'temporal':
        return this.generateTemporalDiscoveryFragment();
      case 'year':
        return this.generateYearDiscoveryFragment();
      default:
        return this.generateNumericDiscoveryFragment();
    }
  }

  /**
   * Generate active filtering fragment
   */
  generateActiveFragment(rangeValues: RangeFilterValue | { min: number; max: number } | [number, number]): string {
    const { minValue, maxValue } = this.parseRangeValues(rangeValues);

    // Use configured sparql_filter if available
    if (this.facetConfig.sparql_filter) {
      return this.generateConfiguredActiveFragment(minValue, maxValue);
    }

    // Fall back to built-in implementations
    return this.generateBuiltInActiveFragment(minValue, maxValue);
  }

  /**
   * Generate active fragment from configuration
   */
  private generateConfiguredActiveFragment(minValue: number, maxValue: number): string {
    const sparqlFilter = this.facetConfig.sparql_filter;

    if (!sparqlFilter) {
      throw new Error(`No sparql_filter configured for field: ${this.facetConfig.field}`);
    }

    // Handle both string and array configurations
    const template = Array.isArray(sparqlFilter)
      ? sparqlFilter.join('\n')
      : sparqlFilter;

    return this.interpolateRangeTemplate(template, minValue, maxValue);
  }

  /**
   * Generate built-in active fragment for backward compatibility
   */
  private generateBuiltInActiveFragment(minValue: number, maxValue: number): string {
    switch (this.rangeType) {
      case 'depth':
        return this.generateDepthFilterFragment(minValue, maxValue);
      case 'temporal':
        return this.generateTemporalFilterFragment(minValue, maxValue);
      case 'year':
        return this.generateYearFilterFragment(minValue, maxValue);
      default:
        return this.generateNumericFilterFragment(minValue, maxValue);
    }
  }

  /**
   * Interpolate template variables in SPARQL fragments
   */
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      result = result.replace(new RegExp(`\\$${key}\\b`, 'g'), value);
    }

    return result;
  }

  /**
   * Interpolate range template with min/max values
   */
  private interpolateRangeTemplate(template: string, minValue: number, maxValue: number): string {
    let result = template;

    // Handle common range interpolation patterns
    result = result.replace(/\$\{minvalue\}/g, minValue.toString());
    result = result.replace(/\$\{maxvalue\}/g, maxValue.toString());
    result = result.replace(/\$\{min\}/g, minValue.toString());
    result = result.replace(/\$\{max\}/g, maxValue.toString());

    // Handle date-specific patterns
    if (this.rangeType === 'temporal' || this.rangeType === 'year') {
      const startDate = this.formatDateForSparql(minValue);
      const endDate = this.formatDateForSparql(maxValue);
      result = result.replace(/\$\{startdate\}/g, startDate);
      result = result.replace(/\$\{enddate\}/g, endDate);
    }

    // Handle depth-specific patterns
    if (this.rangeType === 'depth' || this.rangeType === 'propertyrange') {
      result = result.replace(/\$\{depthmin\}/g, minValue.toString());
      result = result.replace(/\$\{depthmax\}/g, maxValue.toString());
      result = result.replace(/\$\{depthsearch\}/g, `${minValue}`); // For property value searches
    }

    // Handle property names if configured
    if (this.facetConfig.property_names) {
      const propertyFilter = this.facetConfig.property_names
        .map(name => `"${name}"`)
        .join(', ');
      result = result.replace(/\$\{property_names\}/g, `(${propertyFilter})`);
    }

    if (this.facetConfig.depth_properties) {
      const depthFilter = this.facetConfig.depth_properties
        .map(name => `"${name.toLowerCase()}"`)
        .join(', ');
      result = result.replace(/\$\{depth_properties\}/g, `(${depthFilter})`);
    }

    return result;
  }

  // Built-in implementations (for backward compatibility)
  private generateDepthDiscoveryFragment(): string {
    const depthProperties = this.facetConfig.depth_properties ||
      ["depth", "CmpDep", "package_depth", "collection_depth", "Bottle Depth", "sample depth", "tow depth"];

    const depthFilter = depthProperties.map(prop => `"${prop.toLowerCase()}"`).join(', ');

    return `
OPTIONAL {
    ?subj sschema:variableMeasured ?vmd .
    ?vmd a sschema:PropertyValue .
    ?vmd sschema:name ?namedepth .
    FILTER (LCASE(?namedepth) IN (${depthFilter})) .
    ?vmd sschema:maxValue ?maxDepth_d .
    ?vmd sschema:minValue ?minDepth_d .
}
BIND (COALESCE(?maxDepth_d) AS ?maxDepth)
BIND (COALESCE(?minDepth_d) AS ?minDepth)`;
  }

  private generateTemporalDiscoveryFragment(): string {
    return `
OPTIONAL { ?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage . }
OPTIONAL { ?subj schema:datePublished|sschema:datePublished ?datep1 . }
OPTIONAL { ?subj schema:dateCreated|sschema:dateCreated ?datec . }
OPTIONAL { ?subj schema:dateModified|sschema:dateModified ?datem . }
BIND (COALESCE(?datec, ?datem, ?datep1) AS ?datep)`;
  }

  private generateYearDiscoveryFragment(): string {
    return `
OPTIONAL { ?subj schema:datePublished|sschema:datePublished ?datep1 . }
OPTIONAL { ?subj schema:dateCreated|sschema:dateCreated ?datec . }
OPTIONAL { ?subj schema:dateModified|sschema:dateModified ?datem . }
BIND (COALESCE(?datec, ?datem, ?datep1) AS ?datep)
BIND (YEAR(?datep) AS ?year)`;
  }

  private generateNumericDiscoveryFragment(): string {
    const field = this.facetConfig.field;
    const sparqlProperty = `schema:${field}|sschema:${field}`;

    return `
OPTIONAL {
    ?subj ${sparqlProperty} ?${field}Value .
    FILTER(isNumeric(?${field}Value))
}`;
  }

  private generateDepthFilterFragment(minDepth: number, maxDepth: number): string {
    const depthProperties = this.facetConfig.depth_properties ||
      ["depth", "CmpDep", "package_depth", "collection_depth", "Bottle Depth", "sample depth", "tow depth"];

    const depthFilter = depthProperties.map(prop => `"${prop.toLowerCase()}"`).join(', ');

    return `
?subj sschema:variableMeasured ?vm .
?vm a sschema:PropertyValue .
?vm sschema:name ?namedepth .
FILTER (LCASE(?namedepth) IN (${depthFilter})) .
?vm sschema:maxValue ?maxDepth_d .
?vm sschema:minValue ?minDepth_d .

# Range overlap: item range intersects with search range
FILTER (
    ?minDepth_d <= ${maxDepth} && ?maxDepth_d >= ${minDepth}
)`;
  }

  private generateTemporalFilterFragment(startDate: number, endDate: number): string {
    const startDateStr = this.formatDateForSparql(startDate);
    const endDateStr = this.formatDateForSparql(endDate);
    const startYear = this.extractYear(startDate);
    const endYear = this.extractYear(endDate);

    return `
?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .

FILTER (
    # ISO date range format: 2020-01-01/2020-12-31
    (REGEX(?temporalCoverage, "^\\\\d{4}-\\\\d{2}-\\\\d{2}/\\\\d{4}-\\\\d{2}-\\\\d{2}$") &&
     xsd:date(SUBSTR(?temporalCoverage, 1, 10)) <= xsd:date("${endDateStr}") &&
     xsd:date(SUBSTR(?temporalCoverage, 12, 10)) >= xsd:date("${startDateStr}")) ||

    # Year range format: 2020/2023
    (REGEX(?temporalCoverage, "^\\\\d{4}/\\\\d{4}$") &&
     xsd:integer(SUBSTR(?temporalCoverage, 1, 4)) <= ${endYear} &&
     xsd:integer(SUBSTR(?temporalCoverage, 6, 4)) >= ${startYear}) ||

    # Single year format: 2020
    (REGEX(?temporalCoverage, "^\\\\d{4}$") &&
     xsd:integer(?temporalCoverage) >= ${startYear} &&
     xsd:integer(?temporalCoverage) <= ${endYear})
)`;
  }

  private generateYearFilterFragment(startYear: number, endYear: number): string {
    return `
{
    ?subj schema:datePublished|sschema:datePublished ?date .
    FILTER (YEAR(?date) >= ${startYear} && YEAR(?date) <= ${endYear})
} UNION {
    ?subj schema:dateCreated|sschema:dateCreated ?date .
    FILTER (YEAR(?date) >= ${startYear} && YEAR(?date) <= ${endYear})
} UNION {
    ?subj schema:dateModified|sschema:dateModified ?date .
    FILTER (YEAR(?date) >= ${startYear} && YEAR(?date) <= ${endYear})
}`;
  }

  private generateNumericFilterFragment(minValue: number, maxValue: number): string {
    const field = this.facetConfig.field;
    const sparqlProperty = `schema:${field}|sschema:${field}`;

    return `
?subj ${sparqlProperty} ?${field}Value .
FILTER(?${field}Value >= ${minValue} && ?${field}Value <= ${maxValue})`;
  }

  /**
   * Parse range values from various input formats
   */
  private parseRangeValues(rangeValues: any): { minValue: number; maxValue: number } {
    if (Array.isArray(rangeValues) && rangeValues.length === 2) {
      return { minValue: rangeValues[0], maxValue: rangeValues[1] };
    }

    if (typeof rangeValues === 'object' && rangeValues !== null) {
      const minValue = rangeValues.min ?? rangeValues.minValue;
      const maxValue = rangeValues.max ?? rangeValues.maxValue;

      if (minValue !== undefined && maxValue !== undefined) {
        return { minValue, maxValue };
      }
    }

    throw new Error('Range values must be an array [min, max] or object {min, max}');
  }

  /**
   * Format date for SPARQL (simple implementation)
   */
  private formatDateForSparql(dateValue: number): string {
    if (dateValue < 10000) {
      // Assume it's a year
      return `${dateValue}-01-01`;
    }
    // Assume it's a timestamp
    return new Date(dateValue).toISOString().split('T')[0];
  }

  /**
   * Extract year from date value
   */
  private extractYear(dateValue: number): number {
    if (dateValue < 10000) {
      return dateValue; // Already a year
    }
    return new Date(dateValue).getFullYear();
  }

  /**
   * Get range type
   */
  getRangeType(): string {
    return this.rangeType;
  }

  /**
   * Get configuration-driven properties for this facet
   */
  getConfiguredProperties(): {
    sparql_property?: string | string[];
    sparql_filter?: string | string[];
    property_names?: string[];
  } {
    return {
      sparql_property: this.facetConfig.sparql_property,
      sparql_filter: this.facetConfig.sparql_filter,
      property_names: this.facetConfig.property_names
    };
  }

  /**
   * Check if this facet is using configuration-driven approach
   */
  isConfigurationDriven(): boolean {
    return !!(this.facetConfig.sparql_property || this.facetConfig.sparql_filter);
  }
}