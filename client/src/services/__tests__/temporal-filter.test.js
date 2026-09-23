import test from 'node:test';
import assert from 'node:assert/strict';
import { SparqlQueryBuilder } from '../SparqlQueryBuilder.js';

function createBuilder() {
  return new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [
      { field: 'temporalCoverage', type: 'rangeyear' },
      { field: 'datep', type: 'rangeyear' },
    ],
  });
}

test('temporalCoverage filter tests interval overlap, not just start year', () => {
  const fragment = createBuilder().buildRangeFilterExists(
    'temporalCoverage',
    [2010, 2015],
    {}
  );

  // End year parsed from the ISO interval ("start/end") side.
  assert.match(fragment, /STRBEFORE\(\?tc_str, "\/"\)/);
  assert.match(fragment, /STRAFTER\(\?tc_str, "\/"\)/);
  // Overlap test: dataset start <= filter max, dataset end >= filter min.
  assert.match(fragment, /\?tc_s <= 2015/);
  assert.match(fragment, /\?tc_e >= 2010/);
  // Open-ended interval sentinels via COALESCE.
  assert.match(fragment, /COALESCE\(\?tc_endYear, 9999\)/);
  assert.match(fragment, /COALESCE\(\?tc_startYear, 0\)/);
  // Values that parse on neither side stay excluded.
  assert.match(fragment, /BOUND\(\?tc_startYear\) \|\| BOUND\(\?tc_endYear\)/);
});

test('temporalCoverage filter normalizes inverted ranges', () => {
  const fragment = createBuilder().buildRangeFilterExists(
    'temporalCoverage',
    [2015, 2010],
    {}
  );
  assert.match(fragment, /\?tc_s <= 2015/);
  assert.match(fragment, /\?tc_e >= 2010/);
});

test('datep filter keeps point-in-range semantics', () => {
  const fragment = createBuilder().buildRangeFilterExists(
    'datep',
    [2020, 2026],
    {}
  );
  assert.match(
    fragment,
    /xsd:integer\(SUBSTR\(STR\(\?datep_f\), 1, 4\)\) >= 2020/
  );
  assert.doesNotMatch(fragment, /STRAFTER/);
});

test('range filter returns empty string for invalid values', () => {
  const builder = createBuilder();
  assert.equal(builder.buildRangeFilterExists('temporalCoverage', [2010], {}), '');
  assert.equal(
    builder.buildRangeFilterExists('temporalCoverage', ['a', 'b'], {}),
    ''
  );
  assert.equal(builder.buildRangeFilterExists('temporalCoverage', null, {}), '');
});
