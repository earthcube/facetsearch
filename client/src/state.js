//import Vue from 'vue'
//import Vuex from 'vuex'
import { createStore as _createStore } from "vuex";
//Vue.use(Vuex)
import { event } from "vue-gtag";
import axios from "axios";
import jsonld from "jsonld";
import _, { isArray } from "underscore";
//import FacetsConfig from "./config";
//import {bus} from "./main";
//import SpaqlQuery from 'raw-loader!./src/sparql_blaze/sparql_query.txt'
//import SpaqlHasToolsQuery from 'raw-loader!./src/sparql_blaze/sparql_hastools.txt'
import SpaqlQuery from "@/sparql_blaze/sparql_query.txt?raw";
import SpaqlHasToolsQuery from "@/sparql_blaze/sparql_hastools.txt?raw";
import { default as LRUCache } from "lru-cache";
import localforage from "localforage";
import yaml from "js-yaml";

//let esTemplateOptions = FacetsConfig.ES_TEMPLATE_OPTIONS
let esTemplateOptions = { interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g };
//let TRIPLESTORE_URL = FacetsConfig.TRIPLESTORE_URL

//let TRIPLESTORE_URL=FacetsConfigValue.TRIPLESTORE_URL
export async function storeRemoteConfig(remoteConfig = "config/config.yaml") {
  //return await  fetch(process.env.BASE_URL + remoteConfig)
  return await fetch(import.meta.env.BASE_URL + remoteConfig)
    .then((response) => response.text())
    .then((config) => {
      let y = yaml.load(config);
      let base = store;
      base.commit("setFacetsConfig", y);
      base.commit("setTripleStoreURL", y.TRIPLESTORE_URL);
      return base;
    })
    .catch(function (err) {
      console.log(err);
    });
}

export const store = _createStore({
  state: {
    // packageVersion: process.env.PACKAGE_VERSION || '0',
    packageVersion: import.meta.env.VITE_APP_PACKAGE_VERSION || "0",
    //   date: process.env.DATE || '2021-Unknown',
    date: import.meta.env.VITE_APP_DATE|| "2021-Unknown",
    jsonLdObj: {},
    jsonLdCompact: {},
    toolLdObj: {},
    toolLdCompact: {},
    results: [],
    queryTemplates: new Map(),
    lastQueryResults: new Map(), // query, num results
    lastDatasetIds: [],
    connectedTools: new LRUCache({
      max: 100000, // 100k entries.
      // maxAge: 36000 // Important: entries expires after 1 second.
    }), // object id, hasConnectedTools
    toolsMap: new Map(), // object id, hasConnectedTools
    q: "",
    rt: "all", // resourceType all
    textMatchAll: false,
    searchExactMatch: false,
    // add them to simplify changes
    // should I just dump the facet config object in here/?
    esTemplateOptions: esTemplateOptions,
    SpaqlQuery: SpaqlQuery,
    SpaqlHasToolsQuery: SpaqlHasToolsQuery,
    TRIPLESTORE_URL: "https://localhost/blazegraph/namespace/earthcube/sparql'",
    // resultLimit: FacetsConfig.LIMIT_DEFAULT,
    resourceTypeList: new Map([
      [
        "data",
        "{ ?subj rdf:type schema:Dataset . } UNION { ?subj rdf:type sschema:Dataset . } ",
      ],
      [
        "tool",
        "{ ?subj rdf:type schema:SoftwareApplication . } UNION { ?subj rdf:type sschema:SoftwareApplication . } ",
      ],
      //     ['project', "{ ?subj rdf:type schema:ResearchProject . } UNION { ?subj rdf:type sschema:ResearchProject . } "],
    ]),
    microCache: new LRUCache({
      max: 100000, // 100k entries.
      // maxAge: 36000 // Important: entries expires after 1 second.
    }),
    collection: {}, // key: name,
    FacetsConfig: null,
  },
  getters: {
    FacetsConfig: (state) => {
      // now read on creation
      return state.FacetsConfig;
      // if (state.FacetsConfig != null){
      //     return state.FacetsConfig
      // } else {
      //     this.initializeFacetsConfig()
      // }
    },
    getesTemplateOptions: (state) => {
      return state.esTemplateOptions;
    },
    getCollections: () => {
      var colls = [];
      localforage
        .iterate(function (value, key) {
          console.log([key, value]);
          colls.push(value);
          // Vue.set(self.collections, self.collections.length, value)
        })
        .then(function () {
          console.log("Iteration has completed");
          console.log(colls);
          return colls;
        })
        .catch(function (err) {
          // This code runs if there were any errors
          console.log(err);
        });
    },

    hasMicroCache: (state) => (key) => {
      //return false;
      // there is some object proxy issues..
      // version roll back, and fix error
      return state.microCache.has(key);
    },
    getMicroCache: (state) => (key) => {
      return state.microCache.get(key);
    },
    appVersion: (state) => {
      return state.packageVersion;
    },
    appDate: (state) => {
      return state.date;
    },
    // prep for when we expand queries beyond text
    getLastQuery: (state) => {
      return state.lastTextQueries[0];
    },
    hasConnectedTool: (state) => (key) => {
      return state.connectedTools.has(key);
    },
    getConnectedTool: (state) => (id) => {
      return state.connectedTools.get(id);
    },
    getQueryTemplate: (state) => (name) => {
      return state.queryTemplates.get(name);
    },
    hasQueryTemplate: (state) => (name) => {
      return state.queryTemplates.has(name);
    },
    getTextQuery: (state) => {
      return state.q;
    },
    // getSearchExactMatch:(state) => {
    //     return state.searchExactMatch
    // }
    getLastQueryResults: (state) => (key) => {
      return state.microCache.get(key);
    },
  },
  mutations: {
    setFacetsConfig: (state, obj) => {
      state.FacetsConfig = obj;
    },
    setNewCollection: (state, obj) => {
      localforage.getItem(obj.key, function (err, value) {
        if (value === null) {
          localforage
            .setItem(obj.key, {
              type: "collection name",
              collection: "collection name",
              value: obj.key,
            })
            .then((value) => {
              console.log(
                "store: " +
                  "collection name " +
                  obj.key +
                  value.g +
                  " to localstorage"
              );
            })
            .catch((err) => {
              console.log(
                "oops! the account was too far gone, there was nothing we could do to save him ",
                err
              );
            });
          console.log("add to collection");
        } else {
          // localforage.setItem(newFilename, value, function () {
          //   localforage.removeItem(filename, function () { return callback(); });
          // });
          console.log(value);
        }
      });
    },
    addtoMicroCache: (state, obj) => {
      console.log("obj.key," + obj.key + ", obj.value" + obj.value);
      state.microCache.set(obj.key, obj.value);
    },
    setJsonLd(state, obj) {
      state.jsonLdObj = obj;
    },
    setJsonLdCompact(state, obj) {
      state.jsonLdCompact = obj;
    },
    setToolLdObj(state, obj) {
      state.toolLdObj = obj;
    },
    setToolLdCompact(state, obj) {
      state.toolLdCompact = obj;
    },
    setQueryTemplate(state, payload) {
      let name = payload.name;
      let obj = payload.obj;
      state.queryTemplates[name] = obj;
    },
    setTextMatchAll(state, obj) {
      state.textMatchAll = obj;
    },
    setResults(state, obj) {
      state.results = obj;
    },
    appendLastTextQuery(state, payload) {
      state.lastTextQueries.push(payload);
    },
    appendLastDatasetId(state, payload) {
      state.lastDatasetIds.push(payload);
    },
    addConnectedTools(state, payload) {
      state.connectedTools.set(payload.id, payload.hasTool);
    },
    setTextQuery(state, obj) {
      state.q = obj;
    },
    setResourceTypeQuery(state, obj) {
      state.rt = obj;
    },
    setSearchExactMatch(state, obj) {
      state.searchExactMatch = obj;
    },
    setLastQueryResults(state, payload) {
      state.microCache.set(payload.key, payload.items);
    },
    setTripleStoreURL(state, string) {
      state.TRIPLESTORE_URL = string;
    },
    // setResultLimit(state, obj){
    //     state.resultLimit = obj
    // },
  },
  actions: {
    // eslint-disable-next-line
        async facetClick(context, facetFilter){
      //  var filter = self.getFilterById(event.target.id);
    },
    async getItemsForCollection(context, CollName) {
      var collection = {
        description: {
          name: "",
          brief: "Earthcube Collection",
        },
        queries: [],
        tools: [],
        datasets: [],
      };
      const collObj = await localforage.getItem(CollName);
      collection.description.name = collObj.value;
      await localforage
        .iterate(function (value, key) {
          console.log([key, value]);
          if (value?.assignedCollections?.length > 0) {
            if (isArray(value.assignedCollections)) {
              const collections = value.assignedCollections;
              if (collections.find((a) => a === CollName)) {
                if (value.type === "data") {
                  const datadescr = value.value;
                  delete datadescr.description;
                  delete datadescr.placenames;
                  delete datadescr.kw;
                  delete datadescr.score;
                  delete datadescr.s3endpoint;
                  collection.datasets.push(datadescr);
                } else if (value.type === "tool") {
                  const datadescr = value.value;
                  delete datadescr.description;
                  delete datadescr.placenames;
                  delete datadescr.kw;
                  delete datadescr.score;
                  delete datadescr.s3endpoint;
                  collection.tools.push(datadescr);
                } else if (value.type === "query") {
                  const datadescr = value.value;
                  delete datadescr.url;
                  collection.queries.push(datadescr);
                }
              }
            }
          }
          // Vue.set(self.collections, self.collections.length, value)
        })
        .catch(function (err) {
          // This code runs if there were any errors
          console.log(err);
        })
        .finally(() => {});
      return collection;
    },
    async fetchJsonLd(context, o) {
      event("view_item", {
        items: [
          {
            id: o,
            category: "dataset",
            quantity: 1,
          },
        ],
        value: 1,
      });
      event("view_dataset", {
        id: o,
        category: "dataset",
      });
      // var self = this;

      //const fetchURL = `https://dx.geodex.org/id/summoned${o}`
      //const proxyLocation = _.template(FacetsConfig.JSONLD_PROXY, esTemplateOptions)
      //const fetchURL = proxyLocation({o: o})
      let baseUrlt = _.template(
        this.state.FacetsConfig.API_URL,
        esTemplateOptions
      );
      const fetchURL =
        baseUrlt({ window_location_origin: window.location.origin }) +
        `/dataset/${o}`;
      console.log(fetchURL);
      var url = new URL(fetchURL);
      return axios
        .get(url)
        .then(
          //const content = await rawResponse.json();
          async function (r) {
            var content = r.data;
            //console.log(contentAsText);
            if (typeof content === String) {
              content = content.replace(
                "http://schema.org/",
                "https://schema.org/"
              );
            } else {
              content = JSON.stringify(content);
              content = content.replace(
                "http://schema.org/",
                "https://schema.org/"
              );
            }

            // wifire uses jsonld flattened, so at load let's convert items to expanded
            let jsonLdobj = JSON.parse(content);
            context.commit("setJsonLd", jsonLdobj);

            // attempt to clean up below. Let's just pass the original
            // const jsonLdContext = {"@vocab":"https://schema.org/"};
            // try {
            //
            //
            //     await jsonld.expand(jsonLdobj, jsonLdContext).then((providers) => {
            //         var j = JSON.stringify(providers, null, 2);
            //         var jp = JSON.parse(j);
            //         //   console.log(j.toString());
            //         context.commit('setJsonLd', jp)
            //     })
            // } catch (ex) {
            //     console.log("JSONLD transformation issue. JSON into JSONLDCompact. " +  ex)
            //
            //     context.commit('setJsonLd', jsonLdobj)
            //     throw "JSONLD transformation issue."
            // }

            try {
              // this will return an array, if there is more than one type.
              // empty context to get what was a mistake... prefix with https://schema.org
              // do any framing in the component pages.

              await jsonld.compact(jsonLdobj, {}).then((providers) => {
                var j = JSON.stringify(providers, null, 2);
                var jp = JSON.parse(j);
                //   console.log(j.toString());
                context.commit("setJsonLdCompact", jp);
              });
            } catch (ex) {
              console.log(
                "JSONLD transformation issue. JSON into JSONLDCompact. " + ex
              );

              context.commit("setJsonLdCompact", jsonLdobj);
              throw "JSONLD transformation issue.";
            }
          }
        )
        .catch((exception) => {
          // Vue.$gtag.event('exception', {
          event("exception", {
            description: `${o} ${exception}`,
            fatal: false,
            items: [
              {
                id: o,
                category: "dataset",
              },
            ],
          });
          //Vue.$gtag.event('exception_datasetld', {
          event("exception_datasetld", {
            description: exception,
            error_datasetid: o,
            category: "dataset",
          });
          if (exception.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(exception.response.data);
            console.log(exception.response.status);
            console.log(exception.response.headers);
            if (exception.response.status === 404) {
              throw "Issue with Identifier or stale reference in services";
            } else {
              throw (
                "Issue with server responded with an error " +
                exception.response.status
              );
            }
          } else if (exception.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(exception.request);
            throw "Issue with service possibly not running";
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", exception.message);
            throw "Issue with service: " + exception.message;
          }
        });
    },
    async fetchToolJsonLd(context, toolArk) {
      event("view_tool", {
        toolid: toolArk,
        category: "tool",
      });
      // var self = this;
      //var url = new URL(toolArk); // adding ?  or ?? to ark returns some info  eg http://n2t.net/ark:/23942/g2600027??
      let baseUrlt = _.template(
        this.state.FacetsConfig.API_URL,
        esTemplateOptions
      );
      var url =
        baseUrlt({ window_location_origin: window.location.origin }) +
        `/tools/${toolArk}`;

      const config = {
        url: url,
        mode: "cors",
        method: "get",
        maxRedirects: 0,
        // headers: {
        //     'Accept': 'application/xhtml+xml',
        //     'Content-Type': 'application/xhtml+xml'
        // },
        crossDomain: true,
      };
      //           return axios.get(url,{
      //                headers: { 'crossDomain': true },
      //           }
      return axios
        .request(config)
        .then(
          //const content = await rawResponse.json();
          function (toolResponse) {
            var content = toolResponse.data;
            console.log(content);

            //  let toolLdObj = JSON.parse(content)
            let toolLdObj = content;
            context.commit("setToolLdObj", toolLdObj);

            const toolLdContext = {};
            jsonld.compact(toolLdObj, toolLdContext).then((providers) => {
              var j = JSON.stringify(providers, null, 2);
              var jp = JSON.parse(j);
              console.log(j.toString());
              context.commit("setToolLdCompact", jp);
            });
          }
        )
        .catch((exception) => {
          event("exception_toolld", {
            description: exception,
            error_toolid: toolArk,
            category: "tool",
          });
          event("exception", {
            description: `${toolArk} ${exception}`,
            fatal: false,
            items: [
              {
                id: toolArk,
                category: "tool",
              },
            ],
          });
        });
    },
    async getQueryTemplate(context, payload) {
      let name = payload.name;
      let path = payload.path;
      if (context.getters.hasQueryTemplate(name)) {
        Promise.resolve(); // aka return.
        return;
      }
      return axios
        .get(path)
        .then(function (response) {
          context.commit("setQueryTemplate", {
            obj: _.template(response.data, esTemplateOptions),
            name: name,
          });
        })
        .catch(function (err) {
          console.log(err);
        });
    },
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

      if (context.getters.hasMicroCache(queryObject.uuid)) {
        console.log("Found query in cache ");
        let items = context.getters.getMicroCache(queryObject.uuid);
        context.commit("setResults", items);
        return;
      }

      let query = queryObject.query;
      console.log("search " + JSON.stringify(queryObject.query));
      var q = query.textQuery;
      let o = query.offset;
      let n = query.limit;
      let exact = query.searchExactMatch;
      let minRelevance = ""; // for now none. could be: ?lit bds:minRelevance 0.14 .
      let resourceType = query.resourceType;
      let rt = Array.from(this.state.resourceTypeList.values()).join(" UNION ");
      if (resourceType !== undefined && resourceType !== "all") {
        rt = this.state.resourceTypeList.get(resourceType);
      }
      let match = query.textMatchAll;
      if (match == undefined)
        match = this.state.textMatchAll;

      event("search", {
        //'event_category': 'query',
        search_term: q,
        //'event_value': number...
        resource_type: rt,
      });
      // const template_name='fulltext'
      // const hasToolsTemplate = self.getQueryTemplate(context, {
      //     object: SpaqlQuery,
      //     name: template_name
      // })
      const resultsTemplate = _.template(SpaqlQuery, esTemplateOptions);
      //var sparql = self.state.queryTemplates[template_name]({'n': n, 'o': o, 'q': q})
      var sparql = resultsTemplate({ n: n, o: o, q: q, textMatchAll: match, rt: rt, exact: exact, minRelevance: minRelevance });
      //var url = "https://graph.geodex.org/blazegraph/namespace/nabu/sparql";
      var url = this.state.FacetsConfig.SUMMARYSTORE_URL;
      var blazetimeout = this.state.FacetsConfig.BLAZEGRAPH_TIMEOUT || 60;
      //sparql = "PREFIX%20con%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%23%3E%0APREFIX%20luc%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fowlim%2Flucene%23%3E%0APREFIX%20con-inst%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%2Finstance%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0APREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20(GROUP_CONCAT(DISTINCT%20%3Fplacename%3B%20SEPARATOR%3D%22%2C%20%22)%20AS%20%3Fplacenames)%0A%20%20%20%20%20%20%20%20(GROUP_CONCAT(DISTINCT%20%3Fkwu%3B%20SEPARATOR%3D%22%2C%20%22)%20AS%20%3Fkw)%0A%20%20%20%20%20%20%20%20%3Fdatep%20%20(GROUP_CONCAT(DISTINCT%20%3Furl%3B%20SEPARATOR%3D%22%2C%20%22)%20AS%20%3Fdisurl)%20(MAX(%3Fscore1)%20as%20%3Fscore)%0A%20%20%20%20%20%20%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%3Fg%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%5B%5D%20a%20con-inst%3Ageocodes_fts%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20con%3Aquery%20%22water%22%20%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20con%3Aentities%20%3Fsubj%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20VALUES%20(%3Fdataset)%20%7B%20(%20schema%3ADataset%20)%20(%20sschema%3ADataset%20)%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20a%20%3Fdataset%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20con%3Ascore%20%3Fscore1%7D%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%0A%20%20%20%20%20%20%20%20%20%20graph%20%3Fg%20%7B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20optional%20%7B%3Fsubj%20schema%3Adistribution%2Fschema%3Aurl%7Cschema%3AsubjectOf%2Fschema%3Aurl%20%3Furl%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%7Cschema%3Apublisher%2Fschema%3AlegalName%7Csschema%3Apublisher%2Fsschema%3AlegalName%20%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AspatialCoverage%2Fschema%3Aname%7Csschema%3AspatialCoverage%2Fsschema%3Aname%7Csschema%3AsdPublisher%20%3Fplace_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Akeywords%7Csschema%3Akeywords%20%3Fkwu%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22No%20datePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22No%20Publisher%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22No%20spatialCoverage%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fpubname%20%3Fplacename%20%3Fkwu%20%3Fdatep%20%3Furl%20%20%3Fname%20%3Fdescription%20%20%3FresourceType%20%3Fg%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)%0ALIMIT%2010%0AOFFSET%200"

      // generate a UUID from the query string.
      // store

      // get from cache
      // issue if its the same object, then it will not render, because state does not change.
      // let lastItems = context.getters.getLastQueryResults(sparql)
      // if (lastItems){
      //
      //     //let lastItems = this.lastQueryResults.get(sparql)
      //
      //     event('search_count', {
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
      params.append("query", sparql);
      params.append("queryLn", "sparql");
      params.append("timeout", blazetimeout);

      //params.append("analytic", "true")
      //params.append("RTO", "true") runtime optimizer
      const config = {
        url: url,
        method: "get",
        headers: {
          Accept: "application/sparql-results+json",
          // 'Content-Type': 'application/sparql-query'
          // 'X-BIGDATA-MAX-QUERY-MILLIS': 90000  // 90 seconds. can use causes cors error
        },
        params: params,
        //data: sparql
      };
      console.log(params.get("query"));
      return axios
        .request(config)
        .then(function (response) {
          var items = [];
          // add querytime, sometime.
          if (response.data.results.bindings) {
            event("search_count", {
              //'event_category': 'query',
              search_term: q,
              //'event_value': number...
              search_count: response.data.results.bindings.length,
              //  querytime: querytime
            });
            items = flattenSparqlResults(response.data.results.bindings);
            // add to cache
            // context.commit('setLastQueryResults',{key: q, items:items})
            context.commit("setLastQueryResults", {
              key: queryObject.uuid,
              items: items,
            });

            //this.lastQueryResults.get(sparql, items)
          }
          //self.items = items;
          // if we want to remove dupes
          // items = _.uniq(items, false, function(item, key, subj){
          //     return item.subj
          // })
          context.commit("setLastQueryResults", {
            key: queryObject.uuid,
            items: items,
          });
          context.commit("setResults", items);

          // self.initFacetCounts();//items,facets, facetStore,  facetSortOption
          // self.filter();
          //  bus.$emit('facetupdate'); // using emit meant two events trying: https://stackoverflow.com/questions/41879836/vue-js-method-called-multiple-times-using-emit-and-on-when-it-should-only-be-c
          //Promise.resolve();
        })
        .catch((exception) => {
          event("exception", {
            description: exception,
            fatal: false,
            search_term: q,
          });

          context.commit("setResults", []);

          if (exception.response) {
            let data = exception.response.data.toString();
            if (data.includes("java.util.concurrent.TimeoutException")) {
              throw new Error("Long running query cancelled by graph service");
            } else {
              throw new Error("Issue with query  by graph service");
            }
          } else if (exception.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(exception.request);

            throw new Error("Error sending request to graph service");
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", exception.message);
            throw new Error("Error sending request to graph service");
          }
        });
    },

    hasConnectedTools: async function (context, payload) {
      if (context.getters.hasConnectedTool(payload)) {
        console.log("payload: " + payload);
        //  console.log('hasConnectedTools:cached:' + context.getters.getConnectedTool(payload));
        Promise.resolve(context.getters.getConnectedTool(payload));
        return context.getters.getConnectedTool(payload);
      }
      // const template_name = "hasTools"
      // const hasToolsTemplate = context.dispatch('getQueryTemplate', {
      //     object: SpaqlHasToolsQuery,
      //     name: template_name
      // })
      const resultsTemplate = _.template(SpaqlHasToolsQuery, esTemplateOptions);

      let hasToolsQuery = resultsTemplate({
        g: payload,
        ecrr_service: this.state.FacetsConfig.ECRR_TRIPLESTORE_URL,
        ecrr_graph: this.state.FacetsConfig.ECRR_GRAPH,
      });

      var url = this.state.FacetsConfig.TRIPLESTORE_URL;
      var blazetimeout = this.state.FacetsConfig.BLAZEGRAPH_TIMEOUT || 60;
      var params = {
        query: hasToolsQuery,
        timeout: blazetimeout,
        queryLn: "sparql",
      };

      const config = {
        url: url,
        method: "get",
        headers: {
          Accept: "application/sparql-results+json",
          "Content-Type": "application/json",
        },
        params: params,
      };
      console.log("hasConnectedTools:ask:");
      //  console.log(params["query"]);
      return axios.request(config).then(function (response) {
        var hasTool = response.data.boolean;
        console.log("hasConnectedTools:ask:result:" + hasTool);
        if (hasTool) {
          console.log("hasConnectedTools:ask:");
          //     console.log(params["query"]);
        }
        context.commit("addConnectedTools", { id: payload, hasTool: hasTool });
        console.log("put to LRU cache " + payload);
        return hasTool;
      });
    },
  },
});

let flattenSparqlResults = function (bindings) {
  var row = 0;
  var items = _.map(bindings, function (item) {
    var flattened = _.mapObject(item, function (value, key) {
      // divide on comma, ignore braces
      var regex = /,(?![^(]*\)) /;
      var elements = null;
      if (key === "kw") {
        elements = value.value.split(regex);
        // if elements is zero, what happens if I return null?
        if (elements.length == 1) {
          if (elements[0].trim() === "") {
            elements = null;
          }
        }
        return elements;
      }
      if (key === "placenames") {
        elements = value.value.split(regex);
        return elements;
      }
      if (key === "disurl") {
        elements = value.value.split(regex);
        return elements;
      } else {
        // if (_.isEmpty(value.value)) {
        //     return null;
        // }
        return value.value;
      }
    });
    flattened["s3endpoint"] = flattened["g"]
      .replace("urn:gleaner:milled", "")
      .replaceAll(":", "/");
    if (
      _.isEqual(
        "http///www.bigdata.com/rdf#nullGraph",
        flattened["s3endpoint"].toString()
      )
    ) {
      flattened["s3endpoint"] = null;
    }
    //  if g is http://www.bigdata.com/rdf#nullGraph then empty value, use empty value if empty, don't show
    flattened[row] = row;
    row++;
    return flattened;
  });
  return items;
};
