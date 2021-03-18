export default {
    RESULT_SIZE: 10,
    API_URL: 'https://dev.earthcube.org',
    TRIPLESTORE_URL:'https://graph.geodex.org/blazegraph/namespace/nabu/sparql',
    SPARQL_QUERY:'queries/sparql_query.txt',
    SPARQL_HASTOOLS:'queries/sparql_hastools.txt',
    SPARQL_TOOLS_WEBSERVICE:'queries/sparql_gettools_webservice.txt',
    SPARQL_TOOLS_DOWNLOAD:'queries/sparql_gettools_download.txt',
    JSONLD_PROXY: "https://dx.geodex.org/id/summoned${o}",
    // allow us to use the same delimiters as lithtml
    ES_TEMPLATE_OPTIONS : {interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g},
    FACETS: [ {
        field: 'resourceType',
        title: 'Resource Type',
        sort: 'acs',
        open: false
    },
        {
            field: 'kw',
            title: 'Keywords',
            sort: 'acs',
            open: true

        },
        {
            field: 'placenames',
            title: 'Place',
            sort: 'acs',
            open: true

        },
        {
            field: 'pubname',
            title: 'Publisher/Repo',
            sort: 'acs',
            open: false

        },
        {
            field: 'datep',
            title: 'Year Published',
            sort: 'acs',
            open: false

        },

    ],
}
