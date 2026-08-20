# Schema.org Dataset MCP Server

A Model Context Protocol (MCP) server implementation in Python focused on Schema.org Dataset and DataCatalog types using `pydantic-schemaorg` (pydantic_v2 branch).

## Features

- **Dataset Focus**: Specialized support for Schema.org Dataset and DataCatalog types
- **Schema.org Integration**: Uses pydantic models from pydantic-schemaorg library
- **Resources**: Provides access to Dataset, DataCatalog, Person, and Organization schemas
- **Tools**: Create, validate, and work with dataset-focused structured data
- **JSON-LD Output**: Generates proper Schema.org JSON-LD markup
- **Standards Compliant**: Implements the MCP specification

## Installation

```bash
pip install -r requirements.txt
```

## Usage

Run the server:

```bash
python server.py
```

## Available Tools

### Schema.org Tools
- `validate_schema_org`: Validates data against Schema.org types (Dataset, DataCatalog, Person, Organization)
- `create_dataset`: Creates Schema.org Dataset objects with JSON-LD output
- `create_datacatalog`: Creates Schema.org DataCatalog objects with JSON-LD output  
- `get_schema_info`: Retrieves detailed information about Schema.org types including field definitions

### RDF and SPARQL Tools
- `convert_to_rdf`: Converts Schema.org JSON-LD to RDF/Turtle format for triplestore storage
- `sparql_query`: Executes SPARQL queries against a triplestore endpoint
- `insert_rdf`: Inserts RDF data into a triplestore via SPARQL UPDATE
- `dataset_sparql_examples`: Provides example SPARQL queries for dataset discovery and analysis

## Available Resources

- `schema://dataset`: Schema.org Dataset type definition for data publishing
- `schema://datacatalog`: Schema.org DataCatalog type definition for dataset collections
- `schema://person`: Schema.org Person type definition for dataset creators/authors
- `schema://organization`: Schema.org Organization type definition for dataset publishers

## Examples

### Create a Dataset:
```json
{
  "name": "Climate Data Collection",
  "description": "Temperature and precipitation data from weather stations",
  "url": "https://data.example.org/climate",
  "creator": {
    "name": "Dr. Jane Smith",
    "affiliation": "Weather Research Institute"
  },
  "keywords": ["climate", "temperature", "precipitation", "weather"],
  "license": "CC BY 4.0",
  "dateCreated": "2024-01-15"
}
```

### Convert JSON-LD to RDF:
```json
{
  "jsonld_data": {
    "@context": "https://schema.org",
    "@type": "Dataset", 
    "name": "Climate Data",
    "description": "Weather station data"
  },
  "format": "turtle"
}
```

### Execute SPARQL Query:
```json
{
  "query": "PREFIX schema: <https://schema.org/> SELECT ?dataset ?name WHERE { ?dataset a schema:Dataset ; schema:name ?name . }",
  "endpoint": "http://localhost:3030/ds/sparql",
  "return_format": "json"
}
```

### Get Example SPARQL Queries:
```json
{
  "query_type": "find_by_keyword"
}
```

### Insert RDF Data:
```json
{
  "rdf_data": "@prefix schema: <https://schema.org/> . <http://example.org/dataset1> a schema:Dataset ; schema:name \"Test Dataset\" ."
}
```

## SPARQL Triplestore Configuration

The server supports connection to SPARQL endpoints (default: `http://localhost:3030/ds/sparql` for Apache Jena Fuseki).

### Setting up Apache Jena Fuseki:
```bash
# Download and run Fuseki
wget https://downloads.apache.org/jena/binaries/apache-jena-fuseki-4.10.0.tar.gz
tar -xzf apache-jena-fuseki-4.10.0.tar.gz
cd apache-jena-fuseki-4.10.0
./fuseki-server --update --mem /ds
```

### Example SPARQL Queries for Datasets:
- **List all datasets**: `SELECT ?dataset ?name WHERE { ?dataset a schema:Dataset ; schema:name ?name . }`
- **Find by keyword**: `SELECT ?dataset WHERE { ?dataset schema:keywords ?keyword . FILTER(CONTAINS(?keyword, "climate")) }`
- **Find by creator**: `SELECT ?dataset ?creator WHERE { ?dataset schema:creator/schema:name ?creator . }`

## Development

This server demonstrates:
- Dataset-focused Schema.org integration using pydantic models
- RDF conversion from JSON-LD to Turtle/RDF-XML formats
- SPARQL query execution against triplestore endpoints
- RDF data insertion via SPARQL UPDATE operations
- Resource handling for dataset schema definitions
- Specialized tools for dataset and catalog creation
- JSON-LD structured data output with @context and @type
- Example SPARQL queries for common dataset discovery patterns
- Proper async/await patterns
- Standard MCP protocol compliance