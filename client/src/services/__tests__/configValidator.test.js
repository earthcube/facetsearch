import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../configValidator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid config that passes all required-field checks. */
function baseConfig(overrides = {}) {
  return {
    TRIPLESTORE_URL: 'https://example.com/sparql',
    API_URL: 'https://api.example.com',
    QUERY_ENGINE: 'blazegraph',
    FACETS: [
      { field: 'kw', title: 'Keywords', type: 'text', sort: 'asc', open: true },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Null / non-object input
// ---------------------------------------------------------------------------

test('validateConfig returns error for null config', () => {
  const { errors } = validateConfig(null);
  assert.ok(errors.length > 0, 'should have at least one error');
  assert.ok(errors[0].includes('null or undefined'));
});

test('validateConfig returns error for undefined config', () => {
  const { errors } = validateConfig(undefined);
  assert.ok(errors.length > 0);
});

test('validateConfig returns error for array config', () => {
  const { errors } = validateConfig([]);
  assert.ok(errors.length > 0);
});

// ---------------------------------------------------------------------------
// Required fields
// ---------------------------------------------------------------------------

test('validateConfig passes a fully valid config', () => {
  const { errors, warnings } = validateConfig(baseConfig());
  assert.equal(errors.length, 0, `unexpected errors: ${errors.join('; ')}`);
  assert.equal(warnings.length, 0, `unexpected warnings: ${warnings.join('; ')}`);
});

test('validateConfig reports error when TRIPLESTORE_URL is missing', () => {
  const cfg = baseConfig();
  delete cfg.TRIPLESTORE_URL;
  const { errors } = validateConfig(cfg);
  assert.ok(errors.some((e) => e.includes('TRIPLESTORE_URL')));
});

test('validateConfig reports error when API_URL is missing', () => {
  const cfg = baseConfig();
  delete cfg.API_URL;
  const { errors } = validateConfig(cfg);
  assert.ok(errors.some((e) => e.includes('API_URL')));
});

test('validateConfig reports error when TRIPLESTORE_URL is empty string', () => {
  const { errors } = validateConfig(baseConfig({ TRIPLESTORE_URL: '' }));
  assert.ok(errors.some((e) => e.includes('TRIPLESTORE_URL')));
});

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

test('validateConfig warns when TRIPLESTORE_URL is not a valid URL', () => {
  const { warnings } = validateConfig(baseConfig({ TRIPLESTORE_URL: 'not-a-url' }));
  assert.ok(warnings.some((w) => w.includes('TRIPLESTORE_URL')));
});

test('validateConfig accepts template placeholder URLs for JSONLD_PROXY', () => {
  const cfg = baseConfig({ JSONLD_PROXY: 'https://api.example.com/${o}' });
  const { warnings } = validateConfig(cfg);
  // Should NOT warn about JSONLD_PROXY being an invalid URL
  assert.ok(!warnings.some((w) => w.includes('JSONLD_PROXY')));
});

test('validateConfig warns when TENANT_URL is malformed', () => {
  const cfg = baseConfig({ TENANT_URL: 'ftp://bad-protocol.example.com' });
  const { warnings } = validateConfig(cfg);
  assert.ok(warnings.some((w) => w.includes('TENANT_URL')));
});

test('validateConfig does not warn when TENANT_URL is absent', () => {
  const cfg = baseConfig();
  delete cfg.TENANT_URL;
  const { warnings } = validateConfig(cfg);
  assert.ok(!warnings.some((w) => w.includes('TENANT_URL')));
});

// ---------------------------------------------------------------------------
// QUERY_ENGINE
// ---------------------------------------------------------------------------

test('validateConfig accepts valid QUERY_ENGINE values', () => {
  for (const engine of ['blazegraph', 'qlever', 'fuseki']) {
    const { warnings } = validateConfig(baseConfig({ QUERY_ENGINE: engine }));
    assert.ok(!warnings.some((w) => w.includes('QUERY_ENGINE')), `should accept engine: ${engine}`);
  }
});

test('validateConfig warns on unknown QUERY_ENGINE', () => {
  const { warnings } = validateConfig(baseConfig({ QUERY_ENGINE: 'unknown-engine' }));
  assert.ok(warnings.some((w) => w.includes('QUERY_ENGINE')));
});

// ---------------------------------------------------------------------------
// LIMIT_DEFAULT
// ---------------------------------------------------------------------------

test('validateConfig accepts positive numeric LIMIT_DEFAULT', () => {
  const { warnings } = validateConfig(baseConfig({ LIMIT_DEFAULT: 20 }));
  assert.ok(!warnings.some((w) => w.includes('LIMIT_DEFAULT')));
});

test('validateConfig warns when LIMIT_DEFAULT is zero', () => {
  const { warnings } = validateConfig(baseConfig({ LIMIT_DEFAULT: 0 }));
  assert.ok(warnings.some((w) => w.includes('LIMIT_DEFAULT')));
});

test('validateConfig warns when LIMIT_DEFAULT is a string', () => {
  const { warnings } = validateConfig(baseConfig({ LIMIT_DEFAULT: '20' }));
  assert.ok(warnings.some((w) => w.includes('LIMIT_DEFAULT')));
});

// ---------------------------------------------------------------------------
// LIMIT_OPTIONS
// ---------------------------------------------------------------------------

test('validateConfig accepts valid LIMIT_OPTIONS', () => {
  const { warnings } = validateConfig(baseConfig({ LIMIT_OPTIONS: [10, 50, 100] }));
  assert.ok(!warnings.some((w) => w.includes('LIMIT_OPTIONS')));
});

test('validateConfig warns when LIMIT_OPTIONS is not an array', () => {
  const { warnings } = validateConfig(baseConfig({ LIMIT_OPTIONS: 10 }));
  assert.ok(warnings.some((w) => w.includes('LIMIT_OPTIONS')));
});

test('validateConfig warns when LIMIT_OPTIONS contains a negative value', () => {
  const { warnings } = validateConfig(baseConfig({ LIMIT_OPTIONS: [10, -1, 100] }));
  assert.ok(warnings.some((w) => w.includes('LIMIT_OPTIONS')));
});

// ---------------------------------------------------------------------------
// FACETS array
// ---------------------------------------------------------------------------

test('validateConfig reports error when FACETS is not an array', () => {
  const { errors } = validateConfig(baseConfig({ FACETS: 'kw' }));
  assert.ok(errors.some((e) => e.includes('FACETS')));
});

test('validateConfig warns when FACETS is empty', () => {
  const { warnings } = validateConfig(baseConfig({ FACETS: [] }));
  assert.ok(warnings.some((w) => w.includes('FACETS')));
});

test('validateConfig reports error when a facet entry is missing "field"', () => {
  const cfg = baseConfig({
    FACETS: [{ title: 'Keywords', type: 'text' }],
  });
  const { errors } = validateConfig(cfg);
  assert.ok(errors.some((e) => e.includes('field')));
});

test('validateConfig reports error when a facet entry is missing "type"', () => {
  const cfg = baseConfig({
    FACETS: [{ field: 'kw', title: 'Keywords' }],
  });
  const { errors } = validateConfig(cfg);
  assert.ok(errors.some((e) => e.includes('type')));
});

test('validateConfig warns when a facet has an unknown type', () => {
  const cfg = baseConfig({
    FACETS: [{ field: 'kw', title: 'Keywords', type: 'unknown-type' }],
  });
  const { warnings } = validateConfig(cfg);
  assert.ok(warnings.some((w) => w.includes('unknown-type')));
});

test('validateConfig accepts all known facet types', () => {
  for (const type of ['text', 'range', 'rangeyear', 'rangedepth', 'geo']) {
    const cfg = baseConfig({
      FACETS: [{ field: 'f', title: 'F', type }],
    });
    const { errors, warnings } = validateConfig(cfg);
    assert.ok(!errors.some((e) => e.includes('type')), `type "${type}" should not cause an error`);
    assert.ok(
      !warnings.some((w) => w.includes('unknown type')),
      `type "${type}" should not produce an unknown-type warning`
    );
  }
});

test('validateConfig warns on duplicate FACETS field names', () => {
  const cfg = baseConfig({
    FACETS: [
      { field: 'kw', title: 'Keywords', type: 'text' },
      { field: 'kw', title: 'Keywords duplicate', type: 'text' },
    ],
  });
  const { warnings } = validateConfig(cfg);
  assert.ok(warnings.some((w) => w.includes('duplicate') && w.includes('kw')));
});

// ---------------------------------------------------------------------------
// COLLECTION_FACETS
// ---------------------------------------------------------------------------

test('validateConfig reports error when COLLECTION_FACETS is not an array', () => {
  const { errors } = validateConfig(baseConfig({ COLLECTION_FACETS: 'bad' }));
  assert.ok(errors.some((e) => e.includes('COLLECTION_FACETS')));
});

test('validateConfig accepts valid COLLECTION_FACETS entries', () => {
  const cfg = baseConfig({
    COLLECTION_FACETS: [
      { field: 'all', title: 'All Collections', type: 'all' },
    ],
  });
  const { errors } = validateConfig(cfg);
  assert.equal(errors.length, 0);
});
