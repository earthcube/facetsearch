/**
 * Text Facet Generator - Configuration-driven text facet handling
 * Generates SPARQL fragments based on facet configuration with sparql_property and sparql_filter
 */

import { BaseFacetGenerator } from './BaseFacetGenerator.js';
import { FacetConfig, QueryEngine, TextFilterValue } from '../types.js';

export class TextFacetGenerator extends BaseFacetGenerator {

  constructor(facetConfig: FacetConfig, queryEngine: QueryEngine) {
    super(facetConfig, queryEngine);
    this.validateTextFacetConfig();
  }

  /**
   * Validate text facet configuration
   */
  private validateTextFacetConfig(): void {
    if (!this.facetConfig.sparql_property && !this.hasBuiltInSupport()) {
      throw new Error(
        `Text facet '${this.facetConfig.field}' requires 'sparql_property' configuration or built-in support`
      );
    }
  }

  /**
   * Check if this facet has built-in support (for backward compatibility)
   */
  private hasBuiltInSupport(): boolean {
    const builtInFields = ['kw', 'pubname', 'placenames', 'resourceType'];
    return builtInFields.includes(this.facetConfig.field);
  }

  /**
   * Generate discovery fragment (OPTIONAL wrapper)
   */
  generateDiscoveryFragment(): string {
    // Use configured sparql_property if available
    if (this.facetConfig.sparql_property) {
      return this.generateConfiguredDiscoveryFragment();
    }

    // Fall back to built-in implementations for backward compatibility
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
      // Multi-line SPARQL property (like date binding)
      return sparqlProperty.join('\n');
    } else {
      // Simple SPARQL property
      const variable = `?${this.facetConfig.field}1`;
      return `OPTIONAL { ${this.interpolateTemplate(sparqlProperty, { variable })} }`;
    }
  }

  /**
   * Generate built-in discovery fragment for backward compatibility
   */
  private generateBuiltInDiscoveryFragment(): string {
    const field = this.facetConfig.field;

    switch (field) {
      case 'kw':
        return 'OPTIONAL { ?subj schema:keywords|sschema:keywords ?kwu . }';

      case 'pubname':
        return `
OPTIONAL {
    ?subj schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?legalName .
}
OPTIONAL {
    ?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?publisher .
}
BIND (COALESCE(?publisher, ?legalName, "No Publisher") AS ?pubname)`;

      case 'placenames':
        return `
OPTIONAL {
    ?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name|sschema:sdPublisher ?place_name .
}
BIND (IF (BOUND(?place_name), ?place_name, "No Placenames") AS ?placename)`;

      case 'resourceType':
        return `
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
?subj a ?type`;

      default:
        throw new Error(`No built-in support for field: ${field}. Please configure sparql_property.`);
    }
  }

  /**
   * Generate active filtering fragment
   */
  generateActiveFragment(filterValue: string[] | TextFilterValue): string {
    const values = Array.isArray(filterValue) ? filterValue : filterValue.values;

    if (!values || values.length === 0) {
      throw new Error('Text filter values must be a non-empty array');
    }

    // Use configured sparql_filter if available
    if (this.facetConfig.sparql_filter) {
      return this.generateConfiguredActiveFragment(values);
    }

    // Fall back to built-in implementations
    return this.generateBuiltInActiveFragment(values);
  }

  /**
   * Generate active fragment from configuration
   */
  private generateConfiguredActiveFragment(values: string[]): string {
    const sparqlFilter = this.facetConfig.sparql_filter;

    if (!sparqlFilter) {
      throw new Error(`No sparql_filter configured for field: ${this.facetConfig.field}`);
    }

    // Handle both string and array configurations
    if (Array.isArray(sparqlFilter)) {
      // Multi-line SPARQL filter
      return this.interpolateFilterTemplate(sparqlFilter.join('\n'), values);
    } else {
      // Single SPARQL filter
      return this.interpolateFilterTemplate(sparqlFilter, values);
    }
  }

  /**
   * Generate built-in active fragment for backward compatibility
   */
  private generateBuiltInActiveFragment(values: string[]): string {
    const field = this.facetConfig.field;
    const escapedValues = values.map(v => `"${this.escapeValue(v)}"`);

    switch (field) {
      case 'kw':
        return this.generateKeywordFilter(escapedValues);
      case 'pubname':
        return this.generatePublisherFilter(escapedValues);
      case 'placenames':
        return this.generatePlaceFilter(escapedValues);
      case 'resourceType':
        return this.generateResourceTypeFilter(values);
      default:
        throw new Error(`No built-in filter support for field: ${field}. Please configure sparql_filter.`);
    }
  }

  /**
   * Interpolate template variables in SPARQL fragments
   */
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `$${key}`;
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      result = result.replace(new RegExp(`\\$${key}\\b`, 'g'), value);
    }

    return result;
  }

  /**
   * Interpolate filter template with values
   */
  private interpolateFilterTemplate(template: string, values: string[]): string {
    let result = template;

    // Handle different value interpolation patterns
    const escapedValues = values.map(v => `"${this.escapeValue(v)}"`);

    // Replace ${values} with IN clause
    result = result.replace(/\$\{values\}/g, `(${escapedValues.join(', ')})`);

    // Replace ${Keywords} or ${field} with individual values (for multiple filters)
    const fieldPlaceholder = `\${${this.facetConfig.field}}`;
    result = result.replace(new RegExp(fieldPlaceholder, 'g'), escapedValues[0]);

    // Replace individual value placeholders
    values.forEach((value, index) => {
      const placeholder = `\${value${index}}`;
      result = result.replace(new RegExp(placeholder, 'g'), `"${this.escapeValue(value)}"`);
    });

    // Replace generic ${value} with first value
    result = result.replace(/\$\{value\}/g, `"${this.escapeValue(values[0])}"`);

    return result;
  }

  // Built-in filter implementations (for backward compatibility)
  private generateKeywordFilter(escapedValues: string[]): string {
    const partialMatches = escapedValues.map(v => `CONTAINS(LCASE(?kwu), LCASE(${v}))`).join(' || ');

    return `
?subj schema:keywords|sschema:keywords ?kwu .
FILTER (
    (${partialMatches}) ||
    (${escapedValues.map(v => `?kwu = ${v}`).join(' || ')})
)`;
  }

  private generatePublisherFilter(escapedValues: string[]): string {
    return `
{
    ?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?pub_name .
    FILTER(?pub_name IN (${escapedValues.join(', ')}))
} UNION {
    ?subj schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?legal_name .
    FILTER(?legal_name IN (${escapedValues.join(', ')}))
}`;
  }

  private generatePlaceFilter(escapedValues: string[]): string {
    return `
?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name ?place_name .
FILTER(
    ${escapedValues.map(v => `CONTAINS(LCASE(?place_name), LCASE(${v}))`).join(' || ')}
)`;
  }

  private generateResourceTypeFilter(selectedValues: string[]): string {
    const typeMapping: Record<string, string[]> = {
      'data': ['schema:Dataset', 'sschema:Dataset'],
      'tool': ['schema:SoftwareApplication', 'sschema:SoftwareApplication'],
      'person': ['schema:Person', 'sschema:Person'],
      'project': ['schema:ResearchProject', 'sschema:ResearchProject'],
      'researchProject': ['schema:ResearchProject', 'sschema:ResearchProject'],
      'event': ['schema:Event', 'sschema:Event'],
      'award': ['schema:Award', 'sschema:Award'],
      'DataCatalog': ['schema:DataCatalog', 'sschema:DataCatalog']
    };

    const allTypes = selectedValues.flatMap(v => typeMapping[v] || []);
    const typeValues = allTypes.map(t => `<${t.replace('schema:', 'http://schema.org/').replace('sschema:', 'https://schema.org/')}>`);

    return `
?subj a ?selectedType .
VALUES ?selectedType { ${typeValues.join(' ')} }`;
  }

  /**
   * Get configuration-driven properties for this facet
   */
  getConfiguredProperties(): {
    sparql_property?: string | string[];
    sparql_filter?: string | string[];
  } {
    return {
      sparql_property: this.facetConfig.sparql_property,
      sparql_filter: this.facetConfig.sparql_filter
    };
  }

  /**
   * Check if this facet is using configuration-driven approach
   */
  isConfigurationDriven(): boolean {
    return !!(this.facetConfig.sparql_property || this.facetConfig.sparql_filter);
  }
}