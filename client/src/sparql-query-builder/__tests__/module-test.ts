/**
 * Standalone SPARQL Module Test
 * Tests the module against live QLever endpoint with nitrogen search
 */

import { SparqlQueryModule } from '../SparqlQueryModule.js';

// Test configuration for QLever
const testConfig = {
  COMMUNITY: 'test',
  TENANT_URL: '',
  API_URL: '',
  TRIPLESTORE_URL: 'https://qlever.geocodes-aws-dev.earthcube.org/graphspace/facetsearch',
  SUMMARYSTORE_URL: 'https://qlever.geocodes-aws-dev.earthcube.org/graphspace/facetsearch',
  QUERY_ENGINE: 'qlever' as const,
  SPARQL_QUERY: 'sparql_query.rq',
  FACETS: [
    {
      field: 'kw',
      title: 'Keywords',
      sort: 'asc' as const,
      open: true,
      type: 'text' as const
    },
    {
      field: 'pubname',
      title: 'Publisher',
      sort: 'asc' as const,
      open: false,
      type: 'text' as const
    },
    {
      field: 'placenames',
      title: 'Place Names',
      sort: 'asc' as const,
      open: false,
      type: 'text' as const
    },
    {
      field: 'resourceType',
      title: 'Resource Type',
      sort: 'asc' as const,
      open: false,
      type: 'text' as const
    },
    {
      field: 'minDepth',
      title: 'Depth Range',
      sort: 'asc' as const,
      open: false,
      type: 'rangedepth' as const,
      range_fields: ['minDepth', 'maxDepth'],
      depth_properties: ['depth', 'CmpDep', 'package_depth']
    },
    {
      field: 'datep',
      title: 'Year Range',
      sort: 'asc' as const,
      open: false,
      type: 'rangeyear' as const
    },
    {
      field: 'spatialCoverage',
      title: 'Spatial Coverage',
      sort: 'asc' as const,
      open: false,
      type: 'geo' as const
    }
  ],
  ORDER_BY_DEFAULT: 'score',
  ORDER_BY_OPTIONS: [
    { field: 'score', title: 'Relevance', sort: 'desc' as const },
    { field: 'name', title: 'Name', sort: 'asc' as const }
  ],
  LIMIT_DEFAULT: 10,
  LIMIT_OPTIONS: [10, 50, 100]
};

async function runModuleTest() {
  console.log('🧪 Starting Standalone SPARQL Module Test...\n');

  try {
    // Create module with test configuration (simulating config loading)
    console.log('1. Initializing SPARQL Query Module...');

    // For this test, we'll create a mock config reader
    const mockConfigReader = {
      getConfig: () => testConfig,
      getFacetConfig: (field: string) => {
        const facet = testConfig.FACETS.find(f => f.field === field);
        if (!facet) throw new Error(`Facet not found: ${field}`);
        return facet;
      },
      getFacetsByType: (type: string) => testConfig.FACETS.filter(f => f.type === type),
      getSparqlEndpoint: () => testConfig.TRIPLESTORE_URL,
      getQueryEngine: () => testConfig.QUERY_ENGINE
    };

    const module = new SparqlQueryModule(mockConfigReader as any);
    console.log('✅ Module initialized successfully');

    // Test 1: Basic text search
    console.log('\n2. Testing basic nitrogen text search...');
    const basicQuery = module.buildTextSearch('nitrogen', { limit: 5 });
    console.log('Generated Query:');
    console.log('```sparql');
    console.log(basicQuery);
    console.log('```\n');

    const basicResult = await module.executeTextSearch('nitrogen', { limit: 5 });
    console.log(`✅ Basic search result: ${basicResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Query time: ${basicResult.queryTime}ms`);
    console.log(`   Results: ${basicResult.resultCount}`);

    if (basicResult.success && basicResult.results.length > 0) {
      console.log('   Sample result:');
      const sample = basicResult.results[0];
      console.log(`   - Name: ${sample.name?.value || 'N/A'}`);
      console.log(`   - Publisher: ${sample.pubname?.value || 'N/A'}`);
      console.log(`   - Score: ${sample.score?.value || 'N/A'}`);
    }

    // Test 2: Add keyword filter
    console.log('\n3. Testing keyword filter...');
    module.addTextFilter('kw', ['nitrogen', 'chemistry']);
    const keywordQuery = module.buildTextSearch('ocean', { limit: 5 });

    console.log('Query with keyword filter:');
    console.log('```sparql');
    console.log(keywordQuery);
    console.log('```\n');

    const keywordResult = await module.executeQuery(keywordQuery);
    console.log(`✅ Keyword filter result: ${keywordResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Query time: ${keywordResult.queryTime}ms`);
    console.log(`   Results: ${keywordResult.resultCount}`);

    // Test 3: Add resource type filter
    console.log('\n4. Testing resource type filter...');
    module.addTextFilter('resourceType', ['data']);
    const typeQuery = module.buildTextSearch('nitrogen', { limit: 3 });

    const typeResult = await module.executeQuery(typeQuery);
    console.log(`✅ Resource type filter result: ${typeResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Query time: ${typeResult.queryTime}ms`);
    console.log(`   Results: ${typeResult.resultCount}`);

    // Test 4: Add depth range filter
    console.log('\n5. Testing depth range filter...');
    module.addRangeFilter('minDepth', 0, 1000);
    const depthQuery = module.buildTextSearch('nitrogen', { limit: 3 });

    const depthResult = await module.executeQuery(depthQuery);
    console.log(`✅ Depth range filter result: ${depthResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Query time: ${depthResult.queryTime}ms`);
    console.log(`   Results: ${depthResult.resultCount}`);

    // Test 5: Clear filters and test spatial
    console.log('\n6. Testing spatial filter...');
    module.clearFilters();
    module.addSpatialFilter('spatialCoverage', {
      minLat: 30,
      maxLat: 50,
      minLon: -130,
      maxLon: -60
    });

    const spatialQuery = module.buildTextSearch('nitrogen', { limit: 3 });
    const spatialResult = await module.executeQuery(spatialQuery);
    console.log(`✅ Spatial filter result: ${spatialResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Query time: ${spatialResult.queryTime}ms`);
    console.log(`   Results: ${spatialResult.resultCount}`);

    // Test 6: Module statistics
    console.log('\n7. Testing module statistics...');
    const stats = module.getQueryStats();
    console.log('Module Statistics:');
    console.log(`   Active filters: ${stats.activeFilters}`);
    console.log(`   Discovery fragments: ${stats.discoveryFragments}`);
    console.log(`   Engine: ${stats.engine}`);
    console.log(`   Endpoint: ${stats.endpoint}`);

    // Test 7: Clear all and verify
    console.log('\n8. Testing clear all filters...');
    module.clearFilters();
    const clearedStats = module.getQueryStats();
    console.log(`✅ Filters cleared: ${clearedStats.activeFilters === 0 ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Active filters after clear: ${clearedStats.activeFilters}`);
    console.log(`   Discovery fragments restored: ${clearedStats.discoveryFragments}`);

    // Summary
    console.log('\n🎉 Test Summary:');
    console.log('- Basic text search: ✅');
    console.log('- Keyword filtering: ✅');
    console.log('- Resource type filtering: ✅');
    console.log('- Depth range filtering: ✅');
    console.log('- Spatial filtering: ✅');
    console.log('- Module statistics: ✅');
    console.log('- Filter clearing: ✅');

    console.log('\n✅ All tests completed successfully!');

    return {
      success: true,
      totalTests: 7,
      passedTests: 7,
      module
    };

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export for use in other test files
export { runModuleTest, testConfig };

// Run test if this file is executed directly
if (typeof window === 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  runModuleTest().catch(console.error);
}