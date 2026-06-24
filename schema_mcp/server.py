#!/usr/bin/env python3
"""
A MCP server implementation with Schema.org support using pydantic-schemaorg.
"""

import asyncio
import logging
import json
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    CallToolRequest,
    ListResourcesRequest,
    ListToolsRequest,
    ReadResourceRequest,
)
from pydantic import AnyUrl, ValidationError

# RDF and SPARQL imports
import rdflib
from rdflib import Graph, Namespace, URIRef, Literal, BNode
from rdflib.namespace import RDF, RDFS, XSD
from SPARQLWrapper import SPARQLWrapper, JSON, XML, N3, TURTLE
from pyld import jsonld
import requests

# Schema.org imports
from pydantic_schemaorg.Dataset import Dataset
from pydantic_schemaorg.DataCatalog import DataCatalog
from pydantic_schemaorg.Person import Person
from pydantic_schemaorg.Organization import Organization

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("schema-mcp-server")

# Initialize the MCP server
server = Server("schema-mcp-server")

# RDF and SPARQL configuration
SCHEMA_ORG_NS = Namespace("https://schema.org/")
DEFAULT_SPARQL_ENDPOINT = "http://localhost:3030/ds/sparql"  # Default Fuseki endpoint

class RDFConverter:
    """Convert Schema.org JSON-LD to RDF and handle SPARQL operations."""
    
    def __init__(self, sparql_endpoint: str = DEFAULT_SPARQL_ENDPOINT):
        self.sparql_endpoint = sparql_endpoint
        self.graph = Graph()
        self.graph.bind("schema", SCHEMA_ORG_NS)
    
    def jsonld_to_rdf(self, jsonld_data: dict) -> str:
        """Convert JSON-LD to RDF/Turtle format."""
        try:
            # Expand the JSON-LD
            expanded = jsonld.expand(jsonld_data)
            
            # Convert to RDF
            g = Graph()
            g.bind("schema", SCHEMA_ORG_NS)
            
            # Parse the JSON-LD into the graph
            jsonld_str = json.dumps(jsonld_data)
            g.parse(data=jsonld_str, format='json-ld')
            
            return g.serialize(format='turtle')
        except Exception as e:
            logger.error(f"Error converting JSON-LD to RDF: {e}")
            raise
    
    def execute_sparql_query(self, query: str, return_format: str = "json") -> dict:
        """Execute SPARQL query against the triplestore."""
        try:
            sparql = SPARQLWrapper(self.sparql_endpoint)
            sparql.setQuery(query)
            
            if return_format.lower() == "json":
                sparql.setReturnFormat(JSON)
            elif return_format.lower() == "xml":
                sparql.setReturnFormat(XML)
            elif return_format.lower() == "turtle":
                sparql.setReturnFormat(TURTLE)
            else:
                sparql.setReturnFormat(JSON)
            
            results = sparql.query().convert()
            return results
        except Exception as e:
            logger.error(f"Error executing SPARQL query: {e}")
            raise
    
    def insert_rdf_data(self, rdf_data: str) -> bool:
        """Insert RDF data into the triplestore."""
        try:
            # Create SPARQL UPDATE query
            update_query = f"""
            INSERT DATA {{
                {rdf_data}
            }}
            """
            
            # Execute update (this would need a SPARQL UPDATE endpoint)
            update_endpoint = self.sparql_endpoint.replace("/sparql", "/update")
            
            response = requests.post(
                update_endpoint,
                data={"update": update_query},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error inserting RDF data: {e}")
            return False

# Global RDF converter instance
rdf_converter = RDFConverter()


@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """Return available Schema.org resources focused on datasets."""
    return [
        Resource(
            uri=AnyUrl("schema://dataset"),
            name="Dataset Schema",
            description="Schema.org Dataset type definition for data publishing",
            mimeType="application/json",
        ),
        Resource(
            uri=AnyUrl("schema://datacatalog"),
            name="DataCatalog Schema", 
            description="Schema.org DataCatalog type definition for dataset collections",
            mimeType="application/json",
        ),
        Resource(
            uri=AnyUrl("schema://person"),
            name="Person Schema",
            description="Schema.org Person type definition for dataset creators/authors",
            mimeType="application/json",
        ),
        Resource(
            uri=AnyUrl("schema://organization"),
            name="Organization Schema",
            description="Schema.org Organization type definition for dataset publishers",
            mimeType="application/json",
        ),
    ]


@server.read_resource()
async def handle_read_resource(uri: AnyUrl) -> str:
    """Read a specific Schema.org resource."""
    schema_map = {
        "schema://dataset": Dataset,
        "schema://datacatalog": DataCatalog,
        "schema://person": Person,
        "schema://organization": Organization,
    }
    
    if str(uri) in schema_map:
        schema_class = schema_map[str(uri)]
        return json.dumps(schema_class.model_json_schema(), indent=2)
    else:
        raise ValueError(f"Unknown resource: {uri}")


@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """Return available Schema.org tools focused on datasets."""
    return [
        Tool(
            name="validate_schema_org",
            description="Validate data against a Schema.org type (Dataset, DataCatalog, Person, Organization)",
            inputSchema={
                "type": "object",
                "properties": {
                    "schema_type": {
                        "type": "string", 
                        "enum": ["Dataset", "DataCatalog", "Person", "Organization"],
                        "description": "The Schema.org type to validate against"
                    },
                    "data": {"type": "object", "description": "The data to validate"}
                },
                "required": ["schema_type", "data"]
            }
        ),
        Tool(
            name="create_dataset",
            description="Create a Schema.org Dataset with JSON-LD output",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Dataset name"},
                    "description": {"type": "string", "description": "Dataset description"},
                    "url": {"type": "string", "description": "Dataset URL"},
                    "creator": {"type": "object", "description": "Dataset creator (Person or Organization)"},
                    "publisher": {"type": "object", "description": "Dataset publisher (Organization)"},
                    "keywords": {"type": "array", "items": {"type": "string"}, "description": "Dataset keywords"},
                    "license": {"type": "string", "description": "Dataset license"},
                    "dateCreated": {"type": "string", "description": "Creation date"},
                    "dateModified": {"type": "string", "description": "Last modification date"}
                },
                "required": ["name", "description"]
            }
        ),
        Tool(
            name="create_datacatalog",
            description="Create a Schema.org DataCatalog with JSON-LD output",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Catalog name"},
                    "description": {"type": "string", "description": "Catalog description"},
                    "url": {"type": "string", "description": "Catalog URL"},
                    "publisher": {"type": "object", "description": "Catalog publisher (Organization)"},
                    "dataset": {"type": "array", "items": {"type": "object"}, "description": "Datasets in catalog"}
                },
                "required": ["name", "description"]
            }
        ),
        Tool(
            name="get_schema_info",
            description="Get information about a Schema.org type",
            inputSchema={
                "type": "object",
                "properties": {
                    "schema_type": {
                        "type": "string",
                        "enum": ["Dataset", "DataCatalog", "Person", "Organization"],
                        "description": "The Schema.org type to get information about"
                    }
                },
                "required": ["schema_type"]
            }
        ),
        Tool(
            name="convert_to_rdf",
            description="Convert Schema.org JSON-LD to RDF/Turtle format",
            inputSchema={
                "type": "object",
                "properties": {
                    "jsonld_data": {"type": "object", "description": "JSON-LD data to convert to RDF"},
                    "format": {
                        "type": "string",
                        "enum": ["turtle", "rdf/xml", "n3"],
                        "default": "turtle",
                        "description": "RDF serialization format"
                    }
                },
                "required": ["jsonld_data"]
            }
        ),
        Tool(
            name="sparql_query",
            description="Execute SPARQL query against the triplestore",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "SPARQL query to execute"},
                    "endpoint": {
                        "type": "string", 
                        "description": "SPARQL endpoint URL (optional, uses default if not provided)"
                    },
                    "return_format": {
                        "type": "string",
                        "enum": ["json", "xml", "turtle"],
                        "default": "json",
                        "description": "Return format for query results"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="insert_rdf",
            description="Insert RDF data into the triplestore",
            inputSchema={
                "type": "object",
                "properties": {
                    "rdf_data": {"type": "string", "description": "RDF data in Turtle format to insert"},
                    "endpoint": {
                        "type": "string",
                        "description": "SPARQL update endpoint URL (optional, uses default if not provided)"
                    }
                },
                "required": ["rdf_data"]
            }
        ),
        Tool(
            name="dataset_sparql_examples",
            description="Get example SPARQL queries for dataset discovery and analysis",
            inputSchema={
                "type": "object",
                "properties": {
                    "query_type": {
                        "type": "string",
                        "enum": ["list_datasets", "find_by_keyword", "find_by_creator", "dataset_metadata", "catalog_contents"],
                        "description": "Type of example query to generate"
                    }
                },
                "required": ["query_type"]
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle Schema.org tool calls for datasets and catalogs."""
    schema_classes = {
        "Dataset": Dataset,
        "DataCatalog": DataCatalog,
        "Person": Person,
        "Organization": Organization,
    }
    
    try:
        if name == "validate_schema_org":
            schema_type = arguments.get("schema_type")
            data = arguments.get("data")
            
            if schema_type not in schema_classes:
                return [TextContent(type="text", text=f"Error: Unknown schema type '{schema_type}'")]
            
            schema_class = schema_classes[schema_type]
            try:
                validated_obj = schema_class(**data)
                return [TextContent(type="text", text=f"✓ Valid {schema_type} object created successfully")]
            except ValidationError as e:
                return [TextContent(type="text", text=f"✗ Validation failed: {e}")]
        
        elif name == "create_dataset":
            try:
                dataset_obj = Dataset(**arguments)
                json_ld = dataset_obj.model_dump(exclude_none=True)
                json_ld["@type"] = "Dataset"
                json_ld["@context"] = "https://schema.org"
                
                return [TextContent(type="text", text=json.dumps(json_ld, indent=2))]
            except ValidationError as e:
                return [TextContent(type="text", text=f"Error creating Dataset: {e}")]
        
        elif name == "create_datacatalog":
            try:
                catalog_obj = DataCatalog(**arguments)
                json_ld = catalog_obj.model_dump(exclude_none=True)
                json_ld["@type"] = "DataCatalog"
                json_ld["@context"] = "https://schema.org"
                
                return [TextContent(type="text", text=json.dumps(json_ld, indent=2))]
            except ValidationError as e:
                return [TextContent(type="text", text=f"Error creating DataCatalog: {e}")]
        
        elif name == "get_schema_info":
            schema_type = arguments.get("schema_type")
            
            if schema_type not in schema_classes:
                return [TextContent(type="text", text=f"Error: Unknown schema type '{schema_type}'")]
            
            schema_class = schema_classes[schema_type]
            schema_info = {
                "type": schema_type,
                "description": schema_class.__doc__ or f"Schema.org {schema_type} type",
                "fields": list(schema_class.model_fields.keys()),
                "json_schema": schema_class.model_json_schema()
            }
            
            return [TextContent(type="text", text=json.dumps(schema_info, indent=2))]
        
        elif name == "convert_to_rdf":
            jsonld_data = arguments.get("jsonld_data")
            format_type = arguments.get("format", "turtle")
            
            try:
                rdf_data = rdf_converter.jsonld_to_rdf(jsonld_data)
                return [TextContent(type="text", text=rdf_data)]
            except Exception as e:
                return [TextContent(type="text", text=f"Error converting to RDF: {e}")]
        
        elif name == "sparql_query":
            query = arguments.get("query")
            endpoint = arguments.get("endpoint")
            return_format = arguments.get("return_format", "json")
            
            try:
                # Use custom endpoint if provided
                if endpoint:
                    converter = RDFConverter(endpoint)
                else:
                    converter = rdf_converter
                
                results = converter.execute_sparql_query(query, return_format)
                return [TextContent(type="text", text=json.dumps(results, indent=2))]
            except Exception as e:
                return [TextContent(type="text", text=f"Error executing SPARQL query: {e}")]
        
        elif name == "insert_rdf":
            rdf_data = arguments.get("rdf_data")
            endpoint = arguments.get("endpoint")
            
            try:
                # Use custom endpoint if provided
                if endpoint:
                    converter = RDFConverter(endpoint)
                else:
                    converter = rdf_converter
                
                success = converter.insert_rdf_data(rdf_data)
                if success:
                    return [TextContent(type="text", text="✓ RDF data inserted successfully")]
                else:
                    return [TextContent(type="text", text="✗ Failed to insert RDF data")]
            except Exception as e:
                return [TextContent(type="text", text=f"Error inserting RDF data: {e}")]
        
        elif name == "dataset_sparql_examples":
            query_type = arguments.get("query_type")
            
            examples = {
                "list_datasets": """
PREFIX schema: <https://schema.org/>

SELECT ?dataset ?name ?description
WHERE {
    ?dataset a schema:Dataset ;
             schema:name ?name ;
             schema:description ?description .
}
ORDER BY ?name
                """,
                "find_by_keyword": """
PREFIX schema: <https://schema.org/>

SELECT ?dataset ?name ?keyword
WHERE {
    ?dataset a schema:Dataset ;
             schema:name ?name ;
             schema:keywords ?keyword .
    FILTER(CONTAINS(LCASE(?keyword), "climate"))
}
                """,
                "find_by_creator": """
PREFIX schema: <https://schema.org/>

SELECT ?dataset ?name ?creator ?creatorName
WHERE {
    ?dataset a schema:Dataset ;
             schema:name ?name ;
             schema:creator ?creator .
    ?creator schema:name ?creatorName .
    FILTER(CONTAINS(LCASE(?creatorName), "smith"))
}
                """,
                "dataset_metadata": """
PREFIX schema: <https://schema.org/>

SELECT ?dataset ?name ?description ?license ?dateCreated ?url
WHERE {
    ?dataset a schema:Dataset ;
             schema:name ?name ;
             schema:description ?description .
    OPTIONAL { ?dataset schema:license ?license }
    OPTIONAL { ?dataset schema:dateCreated ?dateCreated }
    OPTIONAL { ?dataset schema:url ?url }
}
                """,
                "catalog_contents": """
PREFIX schema: <https://schema.org/>

SELECT ?catalog ?catalogName ?dataset ?datasetName
WHERE {
    ?catalog a schema:DataCatalog ;
             schema:name ?catalogName ;
             schema:dataset ?dataset .
    ?dataset schema:name ?datasetName .
}
ORDER BY ?catalogName ?datasetName
                """
            }
            
            if query_type in examples:
                return [TextContent(type="text", text=examples[query_type].strip())]
            else:
                return [TextContent(type="text", text=f"Error: Unknown query type '{query_type}'")]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
            
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]


async def main():
    """Main entry point for the server."""
    # Import here to avoid issues with event loop
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="schema-mcp-server",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())