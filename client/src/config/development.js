export default {
    API_URL: 'http://localhost:3000',
    TRIPLESTORE_URL:'https://graph.geodex.org/blazegraph/namespace/nabu/sparql',
    SPARQL_QUERY:'queries/sparql_query.txt',
    SPARQL_HASTOOLS:'queries/sparql_hastools.txt',
    SPARQL_TOOLS_WEBSERVICE:'queries/sparql_gettools_webservice.txt',
    SPARQL_TOOLS_DOWNLOAD:'queries/sparql_gettools_download.txt',
    JSONLD_PROXY: "http://localhost:3000${o}",
    // allow us to use the same delimiters as lithtml
    ES_TEMPLATE_OPTIONS : {interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g},
    FACETS: [
        {
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
    ORDER_BY_DEFAULT: 'score',
    ORDER_BY_OPTIONS:
        [
            {field:'name', title: 'Name', sort: 'asc' },
            {field:'pubname', title: 'Publisher', sort:  'asc' },
            {field:'date', title: 'Date', sort:  'asc' },
            {field:'score', title: 'Relevance', sort: 'asc' },

        ]
    ,
    LIMIT_DEFAULT: 10,
    LIMIT_OPTIONS: [10,50,100,1000,5000],
}
