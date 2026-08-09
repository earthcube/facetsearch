import test from 'node:test';
import assert from 'node:assert/strict';
import { FilterStateManager } from '../FilterStateManager.js';

function createManager(queryExecutor) {
  return new FilterStateManager(
    {
      FACETS: [],
      LIMIT_DEFAULT: 10,
    },
    queryExecutor
  );
}

test('FilterStateManager stores query text from query executor outcome', async () => {
  const manager = createManager(async () => ({
    query: 'SELECT * WHERE { ?s ?p ?o } LIMIT 10',
    results: [],
    totalCount: 0,
  }));

  await manager.executeQuery();
  assert.equal(manager.state.lastSparqlQuery, 'SELECT * WHERE { ?s ?p ?o } LIMIT 10');
});

test('FilterStateManager clears stored query when outcome is an array', async () => {
  const manager = createManager(async () => []);
  manager.state.lastSparqlQuery = 'SELECT * WHERE { ?s ?p ?o } LIMIT 10';

  await manager.executeQuery();
  assert.equal(manager.state.lastSparqlQuery, '');
});
