We will have to modify the sparql to do a text query to limit the stuff.
otherwise we get errors


---


PREFIX schema: <https://schema.org/>
PREFIX sschema: <https://schema.org/>
PREFIX bds: <http://www.bigdata.com/rdf/search#>
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin-functions/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?subj ?name ?description ?url ?datep ?pubname ?temporalCoverage  (GROUP_CONCAT(DISTINCT ?url; SEPARATOR=", ") AS ?disurl)   (GROUP_CONCAT(DISTINCT ?placename; SEPARATOR=", ") AS ?placenames)   (GROUP_CONCAT(DISTINCT ?kw_u; SEPARATOR=", ") AS ?kw)   (GROUP_CONCAT(DISTINCT ?resourceType_u; SEPARATOR=", ") AS ?resourceType)  
WHERE {
?subj ?o ?item .

    ?text ql:contains-entity ?item .
    ?text ql:contains-word "als" .
GRAPH ?g {
VALUES ?sosType {
sschema:Dataset
schema:Dataset
}
?subj a ?sosType .
?subj schema:name|sschema:name ?name .
?subj schema:description|sschema:description ?description .
}
VALUES (?type ?resourceType_u) {
(schema:Dataset "data")
(sschema:Dataset "data")
(schema:ResearchProject "researchProject")
(sschema:ResearchProject "researchProject")
(schema:SoftwareApplication "tool")
(sschema:SoftwareApplication "tool")
(schema:Person "person")
(sschema:Person "person")
(schema:Event "event")
(sschema:Event "event")
(schema:Award "award")
(sschema:Award "award")
(schema:DataCatalog "DataCatalog")
(sschema:DataCatalog "DataCatalog")
}
?subj a ?type .
OPTIONAL {?subj sschema:distribution/sschema:url|sschema:subjectOf/sschema:url|schema:distribution/schema:url|schema:subjectOf/schema:url ?url1 .}
OPTIONAL {?subj schema:datePublished|sschema:datePublished ?datep1 .}
OPTIONAL {?subj schema:dateCreated|sschema:dateCreated ?datec .}
OPTIONAL {?subj schema:dateModified|sschema:dateModified ?datem .}
OPTIONAL {?subj schema:temporalCoverage|sschema:temporalCoverage ?temporalCoverage .}
OPTIONAL {?subj schema:publisher/schema:name|sschema:publisher/sschema:name|schema:publisher/schema:legalName|sschema:publisher/sschema:legalName ?pub_name .}
OPTIONAL {?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name|sschema:sdPublisher ?place_name .}
OPTIONAL {?subj schema:keywords|sschema:keywords ?kwu .}
FILTER(CONTAINS(LCASE(?kwu) , "als")).



BIND (COALESCE(?datec,?datem,?datep1) AS ?datep)
BIND (IF(BOUND(?pub_name), ?pub_name, "No Publisher") AS ?pubname)
BIND (IF(BOUND(?place_name), ?place_name, "No Placenames") AS ?placename)
}
GROUP BY ?g ?subj  ?placename  ?datep ?pubname ?url  ?name ?description ?type  ?temporalCoverage ?kw  ?resourceType
LIMIT 100
OFFSET 0
