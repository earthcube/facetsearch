/**
 * FacetSearch Configuration Validator
 *
 * Validates a parsed FacetSearch YAML configuration object and returns
 * structured lists of errors (fatal problems) and warnings (likely mistakes).
 *
 * Usage:
 *   import { validateConfig } from '@/services/configValidator.js';
 *   const { errors, warnings } = validateConfig(config);
 */

/** Fields that must be present and non-empty strings for the app to function. */
const REQUIRED_STRING_FIELDS = ['TRIPLESTORE_URL', 'API_URL'];

/** Fields that, when present, must be valid absolute URLs. */
const URL_FIELDS = [
  'TRIPLESTORE_URL',
  'API_URL',
  'TENANT_URL',
  'SUMMARYSTORE_URL',
  'ECRR_TRIPLESTORE_URL',
  'THROUGHPUTDB_URL',
  'S3_REPORTS_URL',
  'SPARQL_NB',
  'SPARQL_YASGUI',
];

/**
 * URL fields that contain template placeholders like ${o} or ${q}.
 * These are validated only up to the host portion, ignoring the path template.
 */
const TEMPLATE_URL_FIELDS = ['JSONLD_PROXY', 'SPARQL_NB', 'SPARQL_YASGUI'];

/** Valid values for the QUERY_ENGINE field. */
const VALID_QUERY_ENGINES = ['blazegraph', 'qlever', 'fuseki'];

/** Valid facet types understood by the UI components (see Facets2.vue). */
const VALID_FACET_TYPES = ['text', 'range', 'rangeyear', 'rangedepth', 'geo'];

/** Valid collection facet types. */
const VALID_COLLECTION_FACET_TYPES = ['unassigned', 'all'];

/**
 * Test whether a string is a parseable absolute HTTP/HTTPS URL.
 * Template placeholders like ${o} are stripped before parsing so that
 * URLs such as "https://example.com/api/${o}" are still accepted.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isValidUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  // Replace template variables so the URL can be parsed
  const cleaned = value.replace(/\$\{[^}]+\}/g, 'PLACEHOLDER');
  try {
    const u = new URL(cleaned);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a single FACETS entry.
 *
 * @param {object} facet
 * @param {number} index
 * @param {'FACETS'|'COLLECTION_FACETS'} arrayName
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateFacetEntry(facet, index, arrayName) {
  const errors = [];
  const warnings = [];
  const prefix = `${arrayName}[${index}]`;

  if (typeof facet !== 'object' || facet === null || Array.isArray(facet)) {
    errors.push(`${prefix}: each entry must be an object.`);
    return { errors, warnings };
  }

  if (!facet.field || typeof facet.field !== 'string') {
    errors.push(`${prefix}: missing required string field "field".`);
  }

  if (!facet.title || typeof facet.title !== 'string') {
    warnings.push(`${prefix}: missing or non-string "title" — the facet label will be blank.`);
  }

  if (!facet.type || typeof facet.type !== 'string') {
    errors.push(`${prefix} (field="${facet.field}"): missing required string field "type".`);
  } else {
    const validTypes =
      arrayName === 'COLLECTION_FACETS'
        ? [...VALID_FACET_TYPES, ...VALID_COLLECTION_FACET_TYPES]
        : VALID_FACET_TYPES;

    if (!validTypes.includes(facet.type)) {
      warnings.push(
        `${prefix} (field="${facet.field}"): unknown type "${facet.type}". ` +
          `Valid types are: ${validTypes.join(', ')}.`
      );
    }
  }

  return { errors, warnings };
}

/**
 * Validate a parsed FacetSearch configuration object.
 *
 * @param {object|null|undefined} config - The parsed YAML config.
 * @returns {{ errors: string[], warnings: string[] }}
 *   errors   — problems that will break the application.
 *   warnings — likely mistakes that may cause degraded behaviour.
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];

  if (config === null || config === undefined) {
    errors.push('Config is null or undefined — the YAML file could not be loaded or is empty.');
    return { errors, warnings };
  }

  if (typeof config !== 'object' || Array.isArray(config)) {
    errors.push('Config must be a YAML mapping (object), not an array or primitive.');
    return { errors, warnings };
  }

  // --- Required string fields ---
  for (const field of REQUIRED_STRING_FIELDS) {
    if (!config[field] || typeof config[field] !== 'string') {
      errors.push(`Missing required field "${field}".`);
    }
  }

  // --- URL format validation ---
  for (const field of URL_FIELDS) {
    const value = config[field];
    if (value === undefined || value === null) continue; // not present → skip (may be required above)
    const isTemplate = TEMPLATE_URL_FIELDS.includes(field);
    if (!isValidUrl(value)) {
      const hint = isTemplate ? ' (template placeholders like ${o} are allowed)' : '';
      warnings.push(
        `Field "${field}" has value "${value}" which does not appear to be a valid HTTP/HTTPS URL${hint}.`
      );
    }
  }

  // Validate template URL fields separately if present
  for (const field of TEMPLATE_URL_FIELDS) {
    if (!URL_FIELDS.includes(field)) {
      const value = config[field];
      if (value !== undefined && value !== null && !isValidUrl(value)) {
        warnings.push(
          `Field "${field}" has value "${value}" which does not appear to be a valid HTTP/HTTPS URL ` +
            `(template placeholders like \${o} are allowed).`
        );
      }
    }
  }

  // --- QUERY_ENGINE ---
  if (config.QUERY_ENGINE !== undefined) {
    const engine = String(config.QUERY_ENGINE).toLowerCase();
    if (!VALID_QUERY_ENGINES.includes(engine)) {
      warnings.push(
        `Field "QUERY_ENGINE" has value "${config.QUERY_ENGINE}". ` +
          `Expected one of: ${VALID_QUERY_ENGINES.join(', ')}.`
      );
    }
  }

  // --- LIMIT_DEFAULT ---
  if (config.LIMIT_DEFAULT !== undefined) {
    if (typeof config.LIMIT_DEFAULT !== 'number' || !Number.isFinite(config.LIMIT_DEFAULT) || config.LIMIT_DEFAULT <= 0) {
      warnings.push(
        `Field "LIMIT_DEFAULT" should be a positive number (got "${config.LIMIT_DEFAULT}").`
      );
    }
  }

  // --- LIMIT_OPTIONS ---
  if (config.LIMIT_OPTIONS !== undefined) {
    if (!Array.isArray(config.LIMIT_OPTIONS)) {
      warnings.push('Field "LIMIT_OPTIONS" should be an array of positive numbers.');
    } else if (config.LIMIT_OPTIONS.some((v) => typeof v !== 'number' || v <= 0)) {
      warnings.push('Field "LIMIT_OPTIONS" entries should all be positive numbers.');
    }
  }

  // --- FACETS ---
  if (config.FACETS !== undefined) {
    if (!Array.isArray(config.FACETS)) {
      errors.push('Field "FACETS" must be an array.');
    } else if (config.FACETS.length === 0) {
      warnings.push('Field "FACETS" is an empty array — no facets will be displayed.');
    } else {
      for (let i = 0; i < config.FACETS.length; i++) {
        const { errors: fe, warnings: fw } = validateFacetEntry(config.FACETS[i], i, 'FACETS');
        errors.push(...fe);
        warnings.push(...fw);
      }

      // Duplicate field names
      const fields = config.FACETS.filter((f) => f && f.field).map((f) => f.field);
      const seen = new Set();
      for (const f of fields) {
        if (seen.has(f)) {
          warnings.push(`FACETS contains duplicate field name "${f}".`);
        }
        seen.add(f);
      }
    }
  }

  // --- COLLECTION_FACETS ---
  if (config.COLLECTION_FACETS !== undefined) {
    if (!Array.isArray(config.COLLECTION_FACETS)) {
      errors.push('Field "COLLECTION_FACETS" must be an array.');
    } else {
      for (let i = 0; i < config.COLLECTION_FACETS.length; i++) {
        const { errors: fe, warnings: fw } = validateFacetEntry(
          config.COLLECTION_FACETS[i],
          i,
          'COLLECTION_FACETS'
        );
        errors.push(...fe);
        warnings.push(...fw);
      }
    }
  }

  return { errors, warnings };
}

/**
 * Run validateConfig and log any problems to the console.
 *
 * Errors are logged with console.error; warnings with console.warn.
 * Returns true when the config has no errors (warnings are still reported).
 *
 * @param {object} config
 * @param {string} [source] - Informational label (e.g. the config filename).
 * @returns {boolean} true if there are no errors.
 */
export function validateAndLogConfig(config, source = 'FacetsConfig') {
  const { errors, warnings } = validateConfig(config);

  if (warnings.length > 0) {
    console.warn(`[${source}] Configuration warnings (${warnings.length}):`);
    for (const w of warnings) {
      console.warn(`  ⚠ ${w}`);
    }
  }

  if (errors.length > 0) {
    console.error(`[${source}] Configuration errors (${errors.length}) — the application may not work correctly:`);
    for (const e of errors) {
      console.error(`  ✖ ${e}`);
    }
    return false;
  }

  return true;
}
