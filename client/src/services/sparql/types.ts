/**
 * TypeScript definitions for SPARQL Query Building System
 * Based on the SPARQL_FILTERING_REFACTOR_PLAN.md
 */

// Query Engine Types
export type QueryEngine = 'blazegraph' | 'qlever';

// Facet Types
export type FacetType = 'text' | 'rangeyear' | 'rangedepth' | 'geo' | 'unassigned' | 'all';

// Facet Configuration Interface
export interface FacetConfig {
  field: string;
  title: string;
  sort: 'asc' | 'desc' | 'acs';
  open: boolean;
  type: FacetType;
  range_fields?: string[];
  sparql_property?: string;
  depth_properties?: string[];
}

// Configuration Interface
export interface AppConfig {
  COMMUNITY: string;
  TENANT_URL: string;
  API_URL: string;
  TRIPLESTORE_URL: string;
  SUMMARYSTORE_URL: string;
  QUERY_ENGINE: QueryEngine;
  SPARQL_QUERY: string;
  FACETS: FacetConfig[];
  ORDER_BY_DEFAULT: string;
  ORDER_BY_OPTIONS: Array<{
    field: string;
    title: string;
    sort: 'asc' | 'desc';
  }>;
  LIMIT_DEFAULT: number;
  LIMIT_OPTIONS: number[];
}

// SPARQL Query Options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  selectFields?: string;
  groupBy?: boolean;
  orderBy?: string;
  engine?: QueryEngine;
}

// Facet Filter Values
export interface TextFilterValue {
  values: string[];
}

export interface RangeFilterValue {
  min: number;
  max: number;
}

export interface SpatialFilterValue {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export type FacetFilterValue = TextFilterValue | RangeFilterValue | SpatialFilterValue;

// Query Result Interfaces
export interface SparqlBinding {
  type: 'uri' | 'literal' | 'bnode';
  value: string;
  datatype?: string;
  'xml:lang'?: string;
}

export interface SparqlResult {
  [variable: string]: SparqlBinding;
}

export interface SparqlResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: SparqlResult[];
  };
}

export interface QueryResult {
  success: boolean;
  results: SparqlResult[];
  queryTime: number;
  resultCount: number;
  endpoint: string;
  engine: QueryEngine;
  error?: string;
  fromCache?: boolean;
}

// Fragment Generator Interfaces
export interface FacetFragment {
  discovery: string;
  active: string;
}

export interface QueryTemplate {
  baseTemplate: string;
  engineSpecificPrefixes: string;
  selectFields: string;
  textSearchFragment: string;
  facetFilters: string;
  responseBodyFragment: string;
  groupByClause: string;
  orderByClause: string;
  limitValue: number;
  offsetValue: number;
}

// Cache Interface
export interface CacheKey {
  query: string;
  facetState: Record<string, any>;
  engine: QueryEngine;
}

export interface CacheEntry {
  result: QueryResult;
  timestamp: number;
  ttl: number;
}

// Error Types
export class SparqlQueryError extends Error {
  constructor(
    message: string,
    public readonly queryEngine: QueryEngine,
    public readonly query?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SparqlQueryError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public readonly configPath?: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class FacetGenerationError extends Error {
  constructor(
    message: string,
    public readonly facetType: FacetType,
    public readonly facetField: string
  ) {
    super(message);
    this.name = 'FacetGenerationError';
  }
}