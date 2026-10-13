import test from 'node:test';
import assert from 'node:assert/strict';
import { SparqlQueryBuilder } from '../SparqlQueryBuilder.js';

test('buildPropertyValueNameFilter uses case-insensitive exact match', () => {
  const builder = new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [{ field: 'variableMeasured', type: 'propertyvalue' }],
  });

  const fragment = builder.buildPropertyValueNameFilter(
    'variableMeasured',
    ['Abundance'],
    {}
  );

  assert.match(
    fragment,
    /LCASE\(STR\(\?variableMeasured_pvName\)\) = LCASE\("Abundance"\)/
  );
  assert.doesNotMatch(fragment, /CONTAINS\(/);
});

test('buildPropertyValueNameFilter escapes values and combines selections with OR', () => {
  const builder = new SparqlQueryBuilder({ QUERY_ENGINE: 'qlever' });

  const fragment = builder.buildPropertyValueNameFilter(
    'variableMeasured',
    ['Abundance "index"', 'C:\\data'],
    {}
  );

  assert.match(fragment, /schema:variableMeasured\|sschema:variableMeasured/);
  assert.match(fragment, /LCASE\(STR\(\?variableMeasured_pvName\)\) = LCASE\("Abundance \\"index\\""\)/);
  assert.match(fragment, /LCASE\(STR\(\?variableMeasured_pvName\)\) = LCASE\("C:\\\\data"\)/);
  assert.match(fragment, / \|\| /);
  assert.match(fragment, /VALUES \?variableMeasured_pvType \{ schema:PropertyValue sschema:PropertyValue \}/);
});

test('buildPropertyValueNamePattern uses the configured property path', () => {
  const builder = new SparqlQueryBuilder({ QUERY_ENGINE: 'qlever' });

  const pattern = builder.buildPropertyValueNamePattern('technique', {
    sparql_property: 'schema:measurementTechnique|sschema:measurementTechnique',
  });

  assert.match(pattern, /schema:measurementTechnique\|sschema:measurementTechnique/);
  assert.match(pattern, /\?technique_pv_opt schema:name\|sschema:name \?value/);
});
