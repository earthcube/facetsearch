/**
 * Mock datasets for testing facet counting logic
 * These datasets simulate realistic data from the FacetSearch application
 */

export const basicMultiFacetDataset = [
  {
    subj: "dataset1",
    pubname: "USGS", 
    kw: ["water", "hydrology", "rivers"],
    placenames: ["Colorado", "Utah"],
    resourceType: "data",
    name: "Colorado River Basin Water Quality Data",
    description: "Water quality measurements from the Colorado River Basin",
    g: "urn:gleaner:milled:usgs:dataset1"
  },
  {
    subj: "dataset2",
    pubname: "NOAA",
    kw: ["climate", "temperature", "weather"],
    placenames: ["California"],
    resourceType: "data", 
    name: "California Climate Data",
    description: "Historical climate and temperature records for California",
    g: "urn:gleaner:milled:noaa:dataset2"
  },
  {
    subj: "dataset3",
    pubname: "USGS",
    kw: ["geology", "minerals"],
    placenames: ["Colorado", "Nevada"],
    resourceType: "data",
    name: "Geological Survey of Western States",
    description: "Mineral and geological data from western US states",
    g: "urn:gleaner:milled:usgs:dataset3"
  },
  {
    subj: "dataset4",
    pubname: "NASA",
    kw: ["climate", "satellite", "remote sensing"],
    placenames: ["Global"],
    resourceType: "data",
    name: "Global Climate Satellite Data",
    description: "Satellite-derived climate measurements",
    g: "urn:gleaner:milled:nasa:dataset4"
  },
  {
    subj: "dataset5",
    pubname: "NOAA",
    kw: ["water", "oceanography"],
    placenames: ["Pacific Ocean", "California"],
    resourceType: "data",
    name: "Pacific Ocean Temperature Data",
    description: "Ocean temperature measurements from Pacific monitoring stations",
    g: "urn:gleaner:milled:noaa:dataset5"
  }
];

export const edgeCaseDataset = [
  {
    subj: "dataset_empty_kw",
    pubname: "Test Publisher",
    kw: [],
    placenames: ["Test Location"],
    resourceType: "data",
    name: "Dataset with Empty Keywords",
    description: "Test dataset with empty keyword array",
    g: "urn:gleaner:milled:test:empty_kw"
  },
  {
    subj: "dataset_undefined_fields",
    pubname: "Test Publisher",
    // Missing kw field entirely
    placenames: null,
    resourceType: "data",
    name: "Dataset with Missing Fields",
    description: "Test dataset with undefined/null fields",
    g: "urn:gleaner:milled:test:undefined"
  },
  {
    subj: "dataset_single_values",
    pubname: "Test Publisher",
    kw: "single_keyword", // Single string instead of array
    placenames: "Single Location", // Single string instead of array
    resourceType: "data",
    name: "Dataset with Single String Values",
    description: "Test dataset with single string values instead of arrays",
    g: "urn:gleaner:milled:test:single"
  }
];

export const largeDataset = Array.from({ length: 100 }, (_, i) => ({
  subj: `large_dataset_${i}`,
  pubname: `Publisher_${i % 10}`, // 10 different publishers
  kw: [`keyword_${i % 20}`, `keyword_${(i + 1) % 20}`], // 20 different keywords, 2 per dataset
  placenames: [`Location_${i % 15}`], // 15 different locations
  resourceType: i % 10 === 0 ? "tool" : "data", // 10% tools, 90% data
  name: `Large Dataset ${i}`,
  description: `Description for large dataset number ${i}`,
  g: `urn:gleaner:milled:large:dataset_${i}`
}));

export const rangeFilterDataset = [
  {
    subj: "depth_dataset_1",
    pubname: "Ocean Institute",
    kw: ["oceanography", "depth"],
    placenames: ["Atlantic Ocean"],
    resourceType: "data",
    name: "Shallow Water Data",
    description: "Ocean measurements from shallow waters",
    minDepth: 0,
    maxDepth: 100,
    datePublished: "2023-01-01",
    g: "urn:gleaner:milled:ocean:shallow"
  },
  {
    subj: "depth_dataset_2", 
    pubname: "Ocean Institute",
    kw: ["oceanography", "deep sea"],
    placenames: ["Pacific Ocean"],
    resourceType: "data",
    name: "Deep Sea Data",
    description: "Ocean measurements from deep sea locations",
    minDepth: 1000,
    maxDepth: 5000,
    datePublished: "2022-06-15",
    g: "urn:gleaner:milled:ocean:deep"
  },
  {
    subj: "depth_dataset_3",
    pubname: "Marine Research",
    kw: ["marine biology", "ecology"],
    placenames: ["Caribbean Sea"],
    resourceType: "data", 
    name: "Mid-depth Marine Data",
    description: "Marine biological data from mid-depth waters",
    minDepth: 200,
    maxDepth: 800,
    datePublished: "2023-03-20",
    g: "urn:gleaner:milled:marine:middepth"
  }
];

/**
 * Mock facet configuration that matches the structure expected by the application
 */
export const mockFacetsConfig = [
  {
    title: "Publisher",
    field: "pubname",
    type: "text",
    limit: 10,
    sort: "count"
  },
  {
    title: "Keywords", 
    field: "kw",
    type: "text",
    limit: 15,
    sort: "count"
  },
  {
    title: "Spatial Coverage",
    field: "placenames", 
    type: "text",
    limit: 12,
    sort: "count"
  },
  {
    title: "Resource Type",
    field: "resourceType",
    type: "text",
    limit: 5,
    sort: "count"
  },
  {
    title: "Depth Range",
    field: "depth",
    type: "range",
    minField: "minDepth",
    maxField: "maxDepth",
    filtertype: "numericRange"
  }
];

/**
 * Expected count scenarios for testing
 */
export const expectedCounts = {
  // For basicMultiFacetDataset with no filters applied
  noFilters: {
    pubname: {
      "USGS": 2,
      "NOAA": 2, 
      "NASA": 1
    },
    kw: {
      "water": 2,
      "hydrology": 1,
      "rivers": 1,
      "climate": 2,
      "temperature": 1,
      "weather": 1,
      "geology": 1,
      "minerals": 1,
      "satellite": 1,
      "remote sensing": 1,
      "oceanography": 1
    },
    placenames: {
      "Colorado": 2,
      "Utah": 1,
      "California": 2,
      "Nevada": 1,
      "Global": 1,
      "Pacific Ocean": 1
    }
  },

  // With publisher="USGS" filter applied
  usgsFilter: {
    pubname: {
      "USGS": 2,
      "NOAA": 0, // Should show "+" when other filters active
      "NASA": 0  // Should show "+"
    },
    kw: {
      "water": 1,
      "hydrology": 1,
      "rivers": 1,
      "geology": 1,
      "minerals": 1,
      // Other keywords should be 0 (shown as "+")
    },
    placenames: {
      "Colorado": 2,
      "Utah": 1,
      "Nevada": 1
      // Other locations should be 0 (shown as "+")
    }
  },

  // With publisher="USGS" AND kw contains "water" 
  usgsAndWaterFilter: {
    pubname: {
      "USGS": 1,
      "NOAA": 0, // "+"
      "NASA": 0  // "+"
    },
    kw: {
      "water": 1,
      "hydrology": 1,
      "rivers": 1
      // Other keywords should be 0 ("+")
    },
    placenames: {
      "Colorado": 1,
      "Utah": 1
      // Other locations should be 0 ("+")
    }
  }
};

export default {
  basicMultiFacetDataset,
  edgeCaseDataset,
  largeDataset,
  rangeFilterDataset,
  mockFacetsConfig,
  expectedCounts
};