import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import axios from "axios"
import jsonld from "jsonld";
import _ from "underscore";
import FacetsConfig from "./config";
//import {bus} from "./main";
let esTemplateOptions = {interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g}

export const store = new Vuex.Store({
    state: {
        jsonLdObj: {},
        jsonLdCompact: {},
        results: {},
        queryTemplates: {
            fulltext: ''
        },
    },
    mutations: {
        fetchJsonLd(state, obj) {

            state.jsonLdObj = obj
        },
        setJsonLdCompact(state, obj) {

            state.jsonLdCompact = obj
        },
        setQueryTemplate(state, payload) {
            let name = payload.name
            let obj = payload.obj
            state.queryTemplates[name] = obj
        },
        setResults(state, obj) {

            state.results = obj
        },
    },
    actions: {
        async fetchJsonLd(context, o) {

            // var self = this;
            const fetchURL = `https://dx.geodex.org/id/summoned${o}`
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

                    context.commit('fetchJsonLd', jsonLdobj)

                    const jsonLdContext = {};
                    jsonld.compact(jsonLdobj, jsonLdContext).then((providers) => {
                        var j = JSON.stringify(providers, null, 2);
                        var jp = JSON.parse(j);
                        console.log(j.toString());
                        context.commit('setJsonLdCompact', jp)
                    })
                }
            )

        },
        async getQueryTemplate(context, payload) {
            let name = payload.name;
            let path = payload.path;
            return axios.get(path).then(function (response) {
                context.commit('setQueryTemplate', {obj: _.template(response.data, esTemplateOptions), name: name})
            }).catch(function (err) {
                console.log(err)
            })
        }
        ,
        async getResults(context, queryObject) {
            var self = this;
            var q = queryObject.textQuery;
            let o = queryObject.offset;
            let n = queryObject.limit;
            // await this.getQueryTemplate;
            var sparql = self.state.queryTemplates['fulltext']({'n': n, 'o': o, 'q': q})

            //var url = "https://graph.geodex.org/blazegraph/namespace/nabu/sparql";
            var url = FacetsConfig.TRIPLESTORE_URL;
            var params = {
                query: sparql
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
            console.log(params["query"]);
            axios.request(config).then(function (response) {
                var items = [];
                if (response.data.results.bindings) {
                    items = flattenSparqlResults(response.data.results.bindings)

                }
                //self.items = items;
                context.commit('setResults', items)
                // self.initFacetCounts();//items,facets, facetStore,  facetSortOption
                // self.filter();
                //  bus.$emit('facetupdate'); // using emit meant two events trying: https://stackoverflow.com/questions/41879836/vue-js-method-called-multiple-times-using-emit-and-on-when-it-should-only-be-c
                //Promise.resolve();
            })
        },

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


