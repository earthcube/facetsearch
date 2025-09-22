/**
 * Basic setup test to verify Jest configuration is working
 * This test does not depend on Vue or complex dependencies
 */

describe('Test Setup Verification', () => {
  test('should run basic JavaScript tests', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have access to jest functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('should have access to underscore.js', () => {
    const _ = require('underscore');
    const data = [1, 2, 3];
    const doubled = _.map(data, x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  test('should load mock data correctly', () => {
    const { basicMultiFacetDataset } = require('./mockDatasets');
    expect(basicMultiFacetDataset).toBeDefined();
    expect(basicMultiFacetDataset.length).toBe(5);
    expect(basicMultiFacetDataset[0].subj).toBe('dataset1');
  });

  test('should load facet configuration correctly', () => {
    const { mockFacetsConfig } = require('./mockDatasets');
    expect(mockFacetsConfig).toBeDefined();
    expect(mockFacetsConfig.length).toBe(5);
    expect(mockFacetsConfig[0].field).toBe('pubname');
  });
});