# FacetSearch Facet Configuration Documentation

This document describes the different facet types available in the FacetSearch application and how to configure them in YAML configuration files.

## Overview

Facets are configured in the `FACETS` section of configuration YAML files (e.g., `client/public/config/config_deepoceans.yaml`). Each facet defines how users can filter and explore datasets through the search interface.

## Common Facet Properties

All facets share these common properties:

- `field`: The data field this facet operates on
- `title`: Display name shown in the UI
- `sort`: Sort order (`acs` for ascending, `desc` for descending)
- `open`: Boolean indicating if the facet should be expanded by default
- `type`: The facet type (determines behavior and UI)

## Facet Types

### 1. Text Facets (`type: text`)

Text facets provide multi-select filtering for categorical data.

#### Example Configuration:
```yaml
FACETS:
  - field: resourceType
    title: Resource Type
    sort: acs
    open: false
    type: text
  
  - field: kw
    title: Keywords
    sort: acs
    open: true
    type: text
  
  - field: placenames
    title: Place
    sort: acs
    open: true
    type: text
  
  - field: pubname
    title: Publisher/Repo
    sort: acs
    open: false
    type: text
```

#### Behavior:
- Displays a list of available values with checkboxes
- Users can select multiple values to filter results
- Shows count of items for each value
- Supports search within facet values

### 2. Range Year Facets (`type: rangeyear`)

Range year facets provide date range filtering with a slider interface.

#### Example Configuration:
```yaml
FACETS:
  - field: datep
    title: Year Published Range
    sort: acs
    open: true
    type: rangeyear
  
  - field: temporalCoverage
    title: Temporal Coverage
    sort: acs
    open: true
    type: rangeyear
```

#### Behavior:
- Displays a dual-handle slider for selecting date ranges
- Shows min/max years available in the dataset
- Users can drag handles to set start and end years
- Filters results to items within the selected year range

### 3. Range Depth Facets (`type: rangedepth`)

Range depth facets provide depth range filtering, typically for oceanographic data.

#### Example Configuration:
```yaml
FACETS:
  - field: minDepth
    range_fields:
      - minDepth
      - maxDepth
    title: Depth Range
    sort: acs
    open: true
    type: rangedepth
```

#### Special Properties:
- `range_fields`: Array of field names used for min/max depth values

#### Behavior:
- Displays a dual-handle slider for selecting depth ranges
- Shows depth values (typically in meters)
- Users can set minimum and maximum depth constraints
- Filters results to items with depth data within the selected range

### 4. Geographic Facets (`type: geo`)

Geographic facets provide spatial filtering with map-based selection.

#### Example Configuration:
```yaml
FACETS:
  - field: spatialCoverage
    title: Spatial Filter
    sort: acs
    open: true
    type: geo
```

#### Behavior:
- Displays an interactive map interface
- Users can draw bounding boxes or polygons to define search areas
- Filters results to items with spatial coverage intersecting the selected area
- Integrates with mapping libraries (e.g., Leaflet)

## Additional Facet Types

The configuration files also reference these additional types:

- `depthrange`: Legacy depth range type (similar to `rangedepth`)
- `depthyear`: Specialized temporal coverage for depth-related datasets

## Configuration Best Practices

1. **Field Mapping**: Ensure `field` values match the actual data fields in your SPARQL queries
2. **User Experience**: Use `open: true` for commonly used facets
3. **Performance**: Consider the data volume when enabling facets - large categorical datasets may need optimization
4. **Sorting**: Use appropriate sort orders (`acs`/`desc`) based on data type and user expectations

## Example Complete Configuration

```yaml
FACETS:
  - field: resourceType
    title: Resource Type
    sort: acs
    open: false
    type: text
  
  - field: kw
    title: Keywords
    sort: acs
    open: true
    type: text
  
  - field: datep
    title: Year Published Range
    sort: acs
    open: true
    type: rangeyear
  
  - field: minDepth
    range_fields:
      - minDepth
      - maxDepth
    title: Depth Range
    sort: acs
    open: true
    type: rangedepth
  
  - field: spatialCoverage
    title: Spatial Filter
    sort: acs
    open: true
    type: geo
```

This configuration provides users with comprehensive filtering options including categorical filters (text), temporal ranges (rangeyear), depth constraints (rangedepth), and spatial boundaries (geo).