import test from 'node:test';
import assert from 'node:assert/strict';
import { FilterStateManager } from '../FilterStateManager.js';

function createManager() {
  return new FilterStateManager(
    {
      FACETS: [{ field: 'temporalCoverage', type: 'rangeyear' }],
      LIMIT_DEFAULT: 10,
    },
    async () => ({ results: [], totalCount: 0 })
  );
}

test('updateFromUrl parses temporalCoverage_min/max and normalizes order', () => {
  const manager = createManager();
  manager.updateFromUrl('temporalCoverage_min=2018&temporalCoverage_max=2006');
  assert.deepEqual(manager.state.activeFilters.temporalCoverage, [2006, 2018]);
});

test('updateFromUrl keeps backward compatibility for duplicate range keys', () => {
  const manager = createManager();
  manager.updateFromUrl('temporalCoverage=2018&temporalCoverage=2006');
  assert.deepEqual(manager.state.activeFilters.temporalCoverage, [2006, 2018]);
});

test('updateFromUrl keeps backward compatibility for comma range value', () => {
  const manager = createManager();
  manager.updateFromUrl('temporalCoverage=2018,2006');
  assert.deepEqual(manager.state.activeFilters.temporalCoverage, [2006, 2018]);
});

test('getUrlParams serializes temporalCoverage as min/max keys', () => {
  const manager = createManager();
  manager.setFilter('temporalCoverage', [2018, 2006]);
  const params = manager.getUrlParams();

  assert.match(params, /temporalCoverage_min=2006/);
  assert.match(params, /temporalCoverage_max=2018/);
  assert.doesNotMatch(params, /temporalCoverage=2006/);
  assert.doesNotMatch(params, /temporalCoverage=2018/);
});
