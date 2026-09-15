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
