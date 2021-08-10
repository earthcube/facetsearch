export default {
    API_URL: `${window.location.origin}/ec/api`,
    TRIPLESTORE_URL:'https://graph.geodex.org/blazegraph/namespace/nabu/sparql',
    //TRIPLESTORE_URL:'https://graphdb.geodex.org/repositories/geocodes',
    SPARQL_QUERY:'queries/sparql_query.txt',
    SPARQL_HASTOOLS:'queries/sparql_hastools.txt',
    SPARQL_TOOLS_WEBSERVICE:'queries/sparql_gettools_webservice.txt',
    SPARQL_TOOLS_DOWNLOAD:'queries/sparql_gettools_download.txt',
    JSONLD_PROXY: "${window.location.origin}/ec/api/${o}",
    // allow us to use the same delimiters as lithtml
    ES_TEMPLATE_OPTIONS : {interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g},
    FACETS: [
        {
            field: 'resourceType',
            title: 'Resource Type',
            sort: 'acs',
            open: false,
            type:'text'
        },
        {
            field: 'kw',
            title: 'Keywords',
            sort: 'acs',
            open: true,
            type:'text'

        },
        {
            field: 'placenames',
            title: 'Place',
            sort: 'acs',
            open: true,
            type:'text'

        },
        {
            field: 'pubname',
            title: 'Publisher/Repo',
            sort: 'acs',
            open: false,
            type:'text'

        },
        {
            field: 'datep',
            title: 'Year Published',
            sort: 'acs',
            open: false,
            type:'text'

        },

        {
            field: 'datep',
            title: 'Year Published Range',
            sort: 'acs',
            open: true,
            type:'range'

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
    LIMIT_DEFAULT: 1000,
    LIMIT_OPTIONS: [10,50,100,500,1000,5000],
    RELATEDDATA_COUNT: 10
}
