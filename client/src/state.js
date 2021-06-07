import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import axios from "axios"
import jsonld from "jsonld";
import _ from "underscore";
import FacetsConfig from "./config";
//import {bus} from "./main";
import SpaqlQuery from 'raw-loader!./sparql_blaze/sparql_query.txt'
import SpaqlHasToolsQuery from 'raw-loader!./sparql_blaze/sparql_hastools.txt'

let esTemplateOptions = FacetsConfig.ES_TEMPLATE_OPTIONS
let TRIPLESTORE_URL = FacetsConfig.TRIPLESTORE_URL

export const store = new Vuex.Store({
    state: {
        packageVersion: process.env.PACKAGE_VERSION || '0',
        date: process.env.DATE || '2021-Unknown',
        jsonLdObj: {},
        jsonLdCompact: {},
        toolLdObj:{},
        toolLdCompact: {},
        results: [],
        queryTemplates: new Map(),
        lastQueryResults: new Map(), // query, num results
        lastDatasetIds: [],
        connectedTools: new Map(), // object id, hasConnectedTools
        toolsMap: new Map(), // object id, hasConnectedTools
        q: '',
        searchExactMatch: false,
        // add them to simplify changes
        // should I just dump the facet config object in here/?
        esTemplateOptions:esTemplateOptions,
        SpaqlQuery: SpaqlQuery,
        SpaqlHasToolsQuery: SpaqlHasToolsQuery,
        TRIPLESTORE_URL:TRIPLESTORE_URL
        // resultLimit: FacetsConfig.LIMIT_DEFAULT,

    },
    getters: {
        appVersion: (state) => {
            return state.packageVersion
        },
        appDate: (state) => {
            return state.date
        },
        // prep for when we expand queries beyond text
        getLastQuery: (state) => {
            return state.lastTextQueries[0]
        },
        getConnectedTool: (state) => (id) => {
            return state.connectedTools.get(id)
        },
        getQueryTemplate: (state) => (name) => {
            return state.queryTemplates.get(name)
        },
        hasQueryTemplate: (state) => (name) => {
            return state.queryTemplates.has(name)
        },
        getTextQuery:(state) => {
            return state.q;
        },
        // getSearchExactMatch:(state) => {
        //     return state.searchExactMatch
        // }
        getLastQueryResults: (state) => (key) => {
            return state.lastQueryResults.get(key)
        },

    },
    mutations: {
        setJsonLd(state, obj) {

            state.jsonLdObj = obj
        },
        setJsonLdCompact(state, obj) {

            state.jsonLdCompact = obj
        },
        setToolLdObj(state, obj) {

            state.toolLdObj = obj
        },
        setToolLdCompact(state, obj) {

            state.toolLdCompact = obj
        },
        setQueryTemplate(state, payload) {
            let name = payload.name
            let obj = payload.obj
            state.queryTemplates[name] = obj
        },
        setResults(state, obj) {

            state.results = obj
        },
        appendLastTextQuery(state, payload) {

            state.lastTextQueries.push(payload)
        },
        appendLastDatasetId(state, payload) {
            state.lastDatasetIds.push(payload)
        },
        addConnectedTools(state, payload) {
            state.connectedTools.set(payload.id, payload.hasTool)
        },
        setTextQuery(state, obj){
            state.q = obj
        },
        setSearchExactMatch(state, obj){
            state.searchExactMatch = obj
        },
        setLastQueryResults(state, payload){
            state.lastQueryResults.set(payload.key, payload.items)
        },
        // setResultLimit(state, obj){
        //     state.resultLimit = obj
        // },
    },
    actions: {
        async fetchJsonLd(context, o) {
            Vue.$gtag.event('view_item', {
                    items: [{
                        id: o,
                        category : 'dataset',
                        quantity: 1
                    }],
                value: 1
                }

            )
            Vue.$gtag.event('view_dataset', {
                        id: o,
                        category : 'dataset'
                }
            )
            // var self = this;

            //const fetchURL = `https://dx.geodex.org/id/summoned${o}`
            //const proxyLocation = _.template(FacetsConfig.JSONLD_PROXY, esTemplateOptions)
            //const fetchURL = proxyLocation({o: o})
            const fetchURL = FacetsConfig.API_URL +`/dataset/${o}`
            console.log(fetchURL);
            var url = new URL(fetchURL);
            return axios.get(url).then(
                //const content = await rawResponse.json();
                function (r) {
                    var content = r.data;
                    //console.log(contentAsText);
                    if (typeof content === String) {
                        content = content.replace("http://schema.org/", "https://schema.org/")
                    } else {
                        content = JSON.stringify(content)
                        content = content.replace("http://schema.org/", "https://schema.org/")
                    }

                    let jsonLdobj = JSON.parse(content)

                    context.commit('setJsonLd', jsonLdobj)

                    const jsonLdContext = {};
                    jsonld.compact(jsonLdobj, jsonLdContext).then((providers) => {
                        var j = JSON.stringify(providers, null, 2);
                        var jp = JSON.parse(j);
                        console.log(j.toString());
                        context.commit('setJsonLdCompact', jp)
                    })
                }
            ).catch( (exception) => {
                Vue.$gtag.event('exception', {
                    description: `${o} ${exception}`,
                    fatal: false,
                    items: [{
                            id: o,
                            category : 'dataset'
                        }]
                    }
                )
                Vue.$gtag.event('exception_datasetld', {
                        description: exception,
                        error_datasetid: o,
                            category : 'dataset'

                    }
                )
               }
            )

        },
        async fetchToolJsonLd(context, toolArk) {
            Vue.$gtag.event('view_tool', {
                    toolid: toolArk,
                     category : 'tool'
                }
            )
            // var self = this;
            //var url = new URL(toolArk); // adding ?  or ?? to ark returns some info  eg http://n2t.net/ark:/23942/g2600027??
            var url = FacetsConfig.API_URL +`/tools/${toolArk}`

            const config = {
                url: url,
                method: 'get',
                maxRedirects: 0,
                // headers: {
                //     'Accept': 'application/xhtml+xml',
                //     'Content-Type': 'application/xhtml+xml'
                // },
                crossDomain: true,
            }
 //           return axios.get(url,{
//                headers: { 'crossDomain': true },
 //           }
            return axios.request(config
            ).then(
                //const content = await rawResponse.json();
                function (toolResponse) {

                            var content = toolResponse.data;
                            console.log(content);

                          //  let toolLdObj = JSON.parse(content)
                            let toolLdObj = content
                            context.commit('setToolLdObj', toolLdObj)

                            const toolLdContext = {};
                            jsonld.compact(toolLdObj, toolLdContext).then((providers) => {
                                var j = JSON.stringify(providers, null, 2);
                                var jp = JSON.parse(j);
                                console.log(j.toString());
                                context.commit('setToolLdCompact', jp)
                            })
                        }

            ).catch( (exception) => {
                    Vue.$gtag.event('exception_toolld', {
                            description: exception,
                            error_toolid: toolArk,
                                category : 'tool'
                        }
                    )
                Vue.$gtag.event('exception', {
                        description: `${toolArk} ${exception}`,
                        fatal: false,
                        items: [{
                            id: toolArk,
                            category : 'tool'
                        }]
                    }
                )
                }
            )

        },
        async getQueryTemplate(context, payload) {
            let name = payload.name;
            let path = payload.path;
            if (context.getters.hasQueryTemplate(name)) {
                Promise.resolve(); // aka return.
                return
            }
            return axios.get(path).then(function (response) {
                context.commit('setQueryTemplate', {obj: _.template(response.data, esTemplateOptions), name: name})
            }).catch(function (err) {
                console.log(err)
            })
        }
        ,
        // loadQueryTemplate(context, payload) {
        //     let name = payload.name;
        //     let path = payload.object;
        //     if (context.getters.hasQueryTemplate(name)) {
        //         return context.getters.getQueryTemplate(name)
        //
        //     }
        //     const template = _.template(path, esTemplateOptions)
        //     context.commit('setQueryTemplate', {obj: template, name: name})
        //     return context.getters.getQueryTemplate(name)
        //
        // }
        // ,
        async getResults(context, queryObject) {
            //var self = this;

            var q = queryObject.textQuery;
            let o = queryObject.offset;
            let n = queryObject.limit;
            let exact = queryObject.searchExactMatch
            Vue.$gtag.event('search', {
                    //'event_category': 'query',
                    search_term: q
                    //'event_value': number...

                }
            )
            // const template_name='fulltext'
            // const hasToolsTemplate = self.getQueryTemplate(context, {
            //     object: SpaqlQuery,
            //     name: template_name
            // })
            const resultsTemplate = _.template(SpaqlQuery, esTemplateOptions)
            //var sparql = self.state.queryTemplates[template_name]({'n': n, 'o': o, 'q': q})
            var sparql = resultsTemplate({'n': n, 'o': o, 'q': q, 'exact': exact})
            //var url = "https://graph.geodex.org/blazegraph/namespace/nabu/sparql";
            var url = FacetsConfig.TRIPLESTORE_URL;
            //sparql = "PREFIX%20con%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%23%3E%0APREFIX%20luc%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fowlim%2Flucene%23%3E%0APREFIX%20con-inst%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%2Finstance%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0APREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20(GROUP_CONCAT(DISTINCT%20%3Fplacename%3B%20SEPARATOR%3D%22%2C%20%22)%20AS%20%3Fplacenames)%0A%20%20%20%20%20%20%20%20(GROUP_CONCAT(DISTINCT%20%3Fkwu%3B%20SEPARATOR%3D%22%2C%20%22)%20AS%20%3Fkw)%0A%20%20%20%20%20%20%20%20%3Fdatep%20%20(GROUP_CONCAT(DISTINCT%20%3Furl%3B%20SEPARATOR%3D%22%2C%20%22)%20AS%20%3Fdisurl)%20(MAX(%3Fscore1)%20as%20%3Fscore)%0A%20%20%20%20%20%20%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%3Fg%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%5B%5D%20a%20con-inst%3Ageocodes_fts%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20con%3Aquery%20%22water%22%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20con%3Aentities%20%3Fsubj%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20VALUES%20(%3Fdataset)%20%7B%20(%20schema%3ADataset%20)%20(%20sschema%3ADataset%20)%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20a%20%3Fdataset%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20con%3Ascore%20%3Fscore1%7D%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%0A%20%20%20%20%20%20%20%20%20%20graph%20%3Fg%20%7B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20optional%20%7B%3Fsubj%20schema%3Adistribution%2Fschema%3Aurl%7Cschema%3AsubjectOf%2Fschema%3Aurl%20%3Furl%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%7Cschema%3Apublisher%2Fschema%3AlegalName%7Csschema%3Apublisher%2Fsschema%3AlegalName%20%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AspatialCoverage%2Fschema%3Aname%7Csschema%3AspatialCoverage%2Fsschema%3Aname%7Csschema%3AsdPublisher%20%3Fplace_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Akeywords%7Csschema%3Akeywords%20%3Fkwu%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22No%20datePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22No%20Publisher%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22No%20spatialCoverage%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fpubname%20%3Fplacename%20%3Fkwu%20%3Fdatep%20%3Furl%20%20%3Fname%20%3Fdescription%20%20%3FresourceType%20%3Fg%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)%0ALIMIT%2010%0AOFFSET%200"

            // get from cache
            // issue if its the same object, then it will not render, because state does not change.
            // let lastItems = context.getters.getLastQueryResults(sparql)
            // if (lastItems){
            //
            //     //let lastItems = this.lastQueryResults.get(sparql)
            //
            //     Vue.$gtag.event('search_count', {
            //             //'event_category': 'query',
            //             search_term: q,
            //             //'event_value': number...
            //             search_count: lastItems.length
            //             //  querytime: querytime
            //         }
            //     )
            //     context.commit('setResults', lastItems)
            //     return ;
            // }
            var params = new URLSearchParams();
                //  query: encodeURIComponent(sparql),
             params.append( "query", sparql)
             params.append(   "queryLn",'sparql')
            const config = {
                url: url,
                method: 'get',
                headers: {
                    'Accept': 'application/sparql-results+json',
                   // 'Content-Type': 'application/sparql-query'
                },
                params: params
                //data: sparql
            }
            console.log(params["query"]);
            axios.request(config).then(function (response) {
                var items = [];
// add querytime, sometime.
                if (response.data.results.bindings) {
                    Vue.$gtag.event('search_count', {
                            //'event_category': 'query',
                            search_term: q,
                            //'event_value': number...
                            search_count: response.data.results.bindings.length
                      //  querytime: querytime
                        }
                    )
                    items = flattenSparqlResults(response.data.results.bindings)
                    // add to cache
                    context.commit('setLastQueryResults',{key: q, items:items})
                   // context.commit('setLastQueryResults',{key:sparql, items:items})
                    //this.lastQueryResults.get(sparql, items)

                }
                //self.items = items;
                // if we want to remove dupes
                // items = _.uniq(items, false, function(item, key, subj){
                //     return item.subj
                // })
                context.commit('setResults', items)
                // self.initFacetCounts();//items,facets, facetStore,  facetSortOption
                // self.filter();
                //  bus.$emit('facetupdate'); // using emit meant two events trying: https://stackoverflow.com/questions/41879836/vue-js-method-called-multiple-times-using-emit-and-on-when-it-should-only-be-c
                //Promise.resolve();
            }).catch( (exception) => {
                    Vue.$gtag.event('exception', {
                            description: exception,
                            fatal: false,
                            search_term: q,

                        }
                    )
                }
            )
        },

        hasConnectedTools: async function (context, payload) {
            if (context.getters.getConnectedTool(payload)) {
                console.log('hasConnectedTools:cached:' + context.getters.getConnectedTool(payload));
               Promise.resolve(context.getters.getConnectedTool(payload))
                //return

            }
            // const template_name = "hasTools"
            // const hasToolsTemplate = context.dispatch('getQueryTemplate', {
            //     object: SpaqlHasToolsQuery,
            //     name: template_name
            // })
            const resultsTemplate = _.template(SpaqlHasToolsQuery, esTemplateOptions)
            let hasToolsQuery = resultsTemplate({g: payload});

            var url = FacetsConfig.TRIPLESTORE_URL;
            var params = {
                query: hasToolsQuery
            }

            const config = {
                url: url,
                method: 'get',
                headers: {
                    'Accept': 'application/sparql-results+json',
                    'Content-Type': 'application/json'
                },
                params: params
            }
            console.log('hasConnectedTools:ask:')
            console.log(params["query"]);
            return axios.request(config).then(function (response) {
                var hasTool = response.data.boolean
                console.log('hasConnectedTools:ask:result:' + hasTool);
                if (hasTool) {
                    console.log('hasConnectedTools:ask:')
                    console.log(params["query"]);
                }
                context.commit('addConnectedTools', {id: payload, hasTool: hasTool})
                return hasTool;

            })
        }


    }
})

let flattenSparqlResults = function (bindings) {
    var row = 0;
    var items = _.map(bindings, function (item) {

        var flattened = _.mapObject(item, function (value, key) {
            // divide on comma, ignore braces
            var regex = /,(?![^(]*\)) /
            var elements = null;
            if (key === 'kw') {
                elements = value.value.split(regex)
// if elements is zero, what happens if I return null?
                if (elements.length == 1) {
                    if (elements[0].trim() === '') {
                        elements = null;
                    }
                }
                return elements;
            }
            if (key === 'placenames') {
                elements = value.value.split(regex)
                return elements;
            }
            if (key === 'disurl') {
                elements = value.value.split(regex)
                return elements;
            } else {
// if (_.isEmpty(value.value)) {
//     return null;
// }
                return value.value;

            }

        })
        flattened['s3endpoint'] = flattened['g'].replace('urn:gleaner:milled', '').replaceAll(':', '/')
        if (_.isEqual("http///www.bigdata.com/rdf#nullGraph", flattened['s3endpoint'].toString())) {
            flattened['s3endpoint'] = null;
        }
//  if g is http://www.bigdata.com/rdf#nullGraph then empty value, use empty value if empty, don't show
        flattened[row] = row;
        row++;
        return flattened;
    })
    return items;
}


