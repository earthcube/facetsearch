export default {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    API_URL: `https://alpha.geocodes.earthcube.org/ec/api`,
    TRIPLESTORE_URL:'https://graph.geocodes.earthcube.org/blazegraph/namespace/nabu/sparql',
    THROUGHPUTDB_URL: 'https://throughputdb.com/api/ccdrs/annotations',
    //TRIPLESTORE_URL:'https://graphdb.geodex.org/repositories/geocodes',
    SPARQL_QUERY:'queries/sparql_query.txt',
    SPARQL_HASTOOLS:'queries/sparql_hastools.txt',
    SPARQL_TOOLS_WEBSERVICE:'queries/sparql_gettools_webservice.txt',
    SPARQL_TOOLS_DOWNLOAD:'queries/sparql_gettools_download.txt',
    JSONLD_PROXY: "https://alpha.geocodes.earthcube.org/ec/api/dataset/${o}",
    SPARQL_NB: "https://beta.geocodes.earthcube.org/notebook/mkQ?q=${q}",
    SPARQL_YASGUI: "https://alpha.geocodes.earthcube.org/sparqlgui",
    // allow us to use the same delimiters as lithtml
    ES_TEMPLATE_OPTIONS : {interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g},
    FACETS:  [
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
    LIMIT_DEFAULT: 100,
    LIMIT_OPTIONS: [10,50,100,500,1000,5000],
    RELATEDDATA_COUNT: 10,
    NOTEBOOKS: [
        {
            name:'Collab-Developer',
            badge:"",
            baseurl:"http://141.142.218.86:3031/mknb",
            binderEncodeParameters: false,
            contentQuery:'url=${contentUrl}&ext=${format}&urn=${urn}&encoding=${format}',
            pageTemplate:"",
            formats:['*']
        },
        {
            name:'Collab-Service',
            badge:"https://camo.githubusercontent.com/84f0493939e0c4de4e6dbe113251b4bfb5353e57134ffd9fcab6b8714514d4d1/68747470733a2f2f636f6c61622e72657365617263682e676f6f676c652e636f6d2f6173736574732f636f6c61622d62616467652e737667",
            baseurl:"https://beta.geocodes.earthcube.org/notebook/mknb",
            binderEncodeParameters: false,
            contentQuery:'url=${contentUrl}&ext=${format}&urn=${urn}&encoding=${format}',
            pageTemplate:"",
            formats:['*']
        },
        {
            name:'Collab-NoLogin',
            badge:"",
            baseurl:"https://beta.geocodes.earthcube.org/notebook2/mknb",
            binderEncodeParameters: false,
            contentQuery:'url=${contentUrl}&ext=${format}&urn=${urn}&encoding=${format}',
            pageTemplate:"",
            formats:['*']
        },
    ]
}
