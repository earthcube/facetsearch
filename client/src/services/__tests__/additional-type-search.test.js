import test from 'node:test';
import assert from 'node:assert/strict';
import { SparqlQueryBuilder } from '../SparqlQueryBuilder.js';
import { SearchService } from '../SearchService.js';

test('query builder selects and binds additionalType fields', () => {
  const builder = new SparqlQueryBuilder({
    QUERY_ENGINE: 'qlever',
    FACETS: [],
  });

  const query = builder.buildQuery({
    textQuery: '',
    searchExactMatch: false,
    resourceType: 'all',
    filters: {},
    limit: 10,
    offset: 0,
  });

  assert.match(query, /GROUP_CONCAT\(DISTINCT \?additionalType_u; SEPARATOR=", "\) AS \?additionalType/);
  assert.match(query, /GROUP_CONCAT\(DISTINCT \?additionalType_rdf; SEPARATOR=", "\) AS \?additionalTypeRdf/);
  assert.match(query, /\?subj schema:additionalType\|sschema:additionalType \?additionalType_u/);
  assert.match(query, /\?subj a \?additionalType_rdf/);
});

test('processResults merges additionalType values from property and rdf types', () => {
  const service = new SearchService({
    QUERY_ENGINE: 'qlever',
    TRIPLESTORE_URL: 'https://example.org/sparql',
    FACETS: [],
  });

  const rows = service.processResults({
    results: {
      bindings: [
        {
          subj: { value: 'urn:dataset:1' },
          g: { value: 'urn:graph:1' },
          resourceType: { value: 'data' },
          additionalType: { value: 'https://schema.org/WebPage' },
          additionalTypeRdf: { value: 'https://example.org/vocab/GeneratedDataset' },
        },
      ],
    },
  });

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].additionalType, [
    'https://schema.org/WebPage',
    'https://example.org/vocab/GeneratedDataset',
  ]);
});
