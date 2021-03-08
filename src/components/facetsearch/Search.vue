<template>
  <div id="FacetSearch">
    <div id="wrapper row">
      <div id="description">
        <h6>{{ title }}</h6>

      </div>
    </div>
    <!-- Here comes the demo, if you want to copy and paste, start here -->
    <div class="row col-12" id="filterDiv"> <!-- filters -->
      <div class="row col-3 align-items-start" v-on:facetupdate="warn('search cannot be submitted yet.', $event)">
        <Facets id="facetsDiv" class="row col-12" v-bind:facets="facets" v-bind:facetStore="facetStore"
        v-bind:state="state">

        </Facets>


      </div>
      <div class="row col-8 align-self-start ">
        <ResultHeader id="headingDiv"
                      class="row col-12" style="height: 2em;"
        :current-count="currentResults.length"
        :total-count="items.length"
        :sort-options="facetSortOption"></ResultHeader>

        <Results id="resultsDiv" v-bind:currentResults="currentResults" :state="state"></Results>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import Results from "./Results";
import Facets from "./Facets";
//import _, { map } from 'underscore';
import _ from 'underscore';
import axios from "axios";

import {bus} from "../../main.js"
import ResultHeader from "./ResultHeader";

export default {
  name: "Search",
  provide: function () {
    return {
      toggleFilter: this.toggleFilter
    }
  },
  props: {
    title: String,
    o: Number, n: Number
    // results:[]
  },
  components: {
    ResultHeader,
    Results,
    Facets
  },
  data() {
    return {
        queryTemplates:{
          fulltext: ''
        },
        state: {
          orderBy: false,
          filters: {}
        },
        items: [],
        currentResults: [],
        facetStore: {},
      facetSortOption: {},
        //---- ok to edit facets
        facets: [{
          field: 'kw',
          title: 'Science Domain',
          sort: 'acs',
          open: true

        }, {
          field: 'resourceType',
          title: 'Resource Type',
          sort: 'acs',
          open: false
        }
        ],

        // -- end edit  facets



    }
  },

  async mounted() {
    const self = this;
    const q = "water";
    const n = 10;
    const o = 0;

    var queryTemplate = await axios.get('./queries/sparql_query.txt').then (function(response){
      return queryTemplate = _.template(response.data)
    }).catch(function(err){
      console.log(err)
    })

    this.queryTemplates.fulltext = queryTemplate;
    // var url = new URL("https://graph.geodex.org/blazegraph/namespace/nabu/sparql");
    var url = "https://graph.geodex.org/blazegraph/namespace/nabu/sparql";
    var params = {
      query: this.queryTemplates.fulltext({'n':n,'o':o,'q':q})
      // query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      //                   PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      //                   prefix schema: <http://schema.org/>
      //                   prefix sschema: <https://schema.org/>
      //                   SELECT distinct ?subj ?pubname (GROUP_CONCAT(DISTINCT ?placename; SEPARATOR=", ") AS ?placenames)
      //   (GROUP_CONCAT(DISTINCT ?kwu; SEPARATOR=", ") AS ?kw)
      //   ?datep  (MIN(?url) as ?disurl) ?score  ?name ?description ?resourceType ?g
      //   WHERE {
      //       ?lit bds:search "${q}" .
      //       ?lit bds:matchAllTerms "false" .
      //       ?lit bds:relevance ?score .
      //       ?subj ?p ?lit .
      //       optional {?subj schema:distribution/schema:url|schema:subjectOf/schema:url ?url .}
      //       BIND ( IF ( exists { ?subj a schema:Dataset .} ||exists{ ?subj a sschema:Dataset .}  , "data", "tool")  AS ?resourceType ).
      //
      //       graph ?g { ?subj schema:description|sschema:description ?description . }
      //       ?subj schema:name|sschema:name ?name .
      //       ?subj schema:description|sschema:description ?description .
      //       filter( ?score > 0.04).
      //       OPTIONAL {?subj schema:datePublished|sschema:datePublished ?datep .}
      //       OPTIONAL {?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?pubname .}
      //       OPTIONAL {?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name ?placename .}
      //       OPTIONAL {?subj schema:keywords|sschema:keywords ?kwu .}
      //   }
      //   GROUP BY ?subj ?datep ?pubname ?name ?description ?url ?score ?resourceType ?g
      //   ORDER BY DESC(?score)
      //   LIMIT ${n}
      //   OFFSET ${o}`
    }
    //Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
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
    this.axios.request(config).then(function (response) {
          var items = [];
          if (response.data.results.bindings) {
            items = self.flattenSparqlResults(response.data.results.bindings)
//             items = _.map(response.data.results.bindings, function (item) {
//
//               var flattened = _.mapObject(item, function (value, key) {
//                 var elements = null;
//                 if (key === 'kw') {
//                   elements = value.value.split(',')
// // if elements is zero, what happens if I return null?
//                   if (elements.length == 1) {
//                     if (elements[0].trim() === '') {
//                       elements = null;
//                     }
//                   }
//                   return elements;
//                 }
//                 if (key === 'placenames') {
//                   elements = value.value.split(',')
//                   return elements;
//                 } else {
// // if (_.isEmpty(value.value)) {
// //     return null;
// // }
//                   return value.value;
//
//                 }
//
//               })
//               flattened['s3endpoint'] = flattened['g'].replace('urn:gleaner:milled', '').replaceAll(':', '/')
//               if (_.isEqual("http///www.bigdata.com/rdf#nullGraph", flattened['s3endpoint'].toString())) {
//                 flattened['s3endpoint'] = null;
//               }
// //  if g is http://www.bigdata.com/rdf#nullGraph then empty value, use empty value if empty, don't show
//               return flattened;
//             })
          }
          self.items = items;
          self.initFacetCounts();//items,facets, facetStore,  facetSortOption
          self.filter();
      bus.$emit('facetupdate'); // using emit meant two events trying: https://stackoverflow.com/questions/41879836/vue-js-method-called-multiple-times-using-emit-and-on-when-it-should-only-be-c
      Promise.resolve();
        }
    );


  }
  ,
  methods: {
    //content.results.bindings

    flattenSparqlResults: function (bindings) {
      var row = 0;
      var items = _.map(bindings, function (item) {

        var flattened = _.mapObject(item, function (value, key) {
          var elements = null;
          if (key === 'kw') {
            elements = value.value.split(',')
// if elements is zero, what happens if I return null?
            if (elements.length == 1) {
              if (elements[0].trim() === '') {
                elements = null;
              }
            }
            return elements;
          }
          if (key === 'placenames') {
            elements = value.value.split(',')
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
        flattened[row]=row;
        row++;
        return flattened;
      })
      return items;
    },
    //getItemsFromSparql: async function (q, n = 1000, o = 0) {
    initFacetCounts: function () {
      let items = this.items;
      let facets = this.facets;
      let facetStore = this.facetStore;
      let facetSortOption = this.facetSortOption;

      _.each(facets,
          function (facet) { //function(facettitle, facet) {
            facetStore[facet.field] = {};
          });
      _.each(items, function (item) {
        // intialize the count to be zero
        _.each(facets,
            function (facet) { //function(facettitle, facet) {
              if (_.isArray(item[facet.field])) {
                _.each(item[facet.field], function (facetitem) {
                  if (_.isEmpty(facetitem)) {
                    return;
                  }
                  facetStore[facet.field][facetitem] = facetStore[facet.field][facetitem] || {
                    count: 0,
                    id: _.uniqueId("facet_"),
                    isActive: false
                  }
                 // Vue.observable(facetStore[facet.field][facetitem] )
                });
              } else {
                if (item[facet.field] !== undefined) {
                  if (_.isEmpty(item[facet.field])) {
                    return;
                  }
                  facetStore[facet.field][item[facet.field]] = facetStore[facet.field][item[facet.field]] || {
                    count: 0,
                    id: _.uniqueId("facet_"),
                    isActive: false
                  }
                //  Vue.observable(facetStore[facet.field][item[facet.field]]  )
                }
              }
            });
      });
      // sort it:
      _.each(facetStore,
          function(facetData, facettitle) {
            var sorted = _.keys(facetStore[facettitle]).sort();
            if (facetSortOption && facetSortOption[facettitle]) {
              sorted = _.union(facetSortOption[facettitle], sorted);
            }
            var sortedstore = {};
            _.each(sorted, function (el) {
              sortedstore[el] = facetStore[facettitle][el];
            });
            //settings.facetStore[facet.field] = sortedstore;
            Vue.set(facetStore, facettitle, sortedstore)
          });


    },
    resetFacetCount: function () {
      var self= this;
      _.each(self.facetStore, function (items, facetname) {
        _.each(items, function (value, itemname) {
          self.facetStore[facetname][itemname].count = 0;
          if (_.indexOf(self.state.filters[facetname], itemname) == -1) {
            self.facetStore[facetname][itemname].isActive = false;
          } else {
            self.facetStore[facetname][itemname].isActive = true;
          }

        });
      });
    },
    /**
     * Filters all items from the settings according to the currently
     * set filters and stores the results in the settings.currentResults.
     * The number of items in each filter from each facet is also updated
     */
    filter: function () {
      // first apply the filters to the items

     // this.currentResults = [] // triggers reactive event and we are resetting it in the next lines, anyway
      let self = this;
     // self.currentResults = _.select(this.items, function (item) {
       let newResults = _.select(this.items, function (item) {
        let filtersApply = true;
        _.each(self.state.filters, function (filter, facet) {
          if (_.isArray(item[facet])) {
            var inters = _.intersection(item[facet], filter);
            if (inters.length == 0) {
              filtersApply = false;
            }
          } else {
            if (filter.length && _.indexOf(filter, item[facet]) == -1) {
              filtersApply = false;
            }
          }
        });
        return filtersApply;
      });

       // the next two lines are needed to make the vue reactivity work.
      // vue cannot easily detect array length changes, so.
        //self.currentResults =self.currentResults.splice(0, 0);
      let len = self.currentResults.length;
       self.currentResults.splice(0, len);
        newResults.forEach((i) =>self.currentResults.push(i) )



      this.resetFacetCount();
      // then reduce the items to get the current count for each facet
      _.each(self.facets, function( facet) {
        _.each(self.currentResults, function(item) {
          if (_.isArray(item[facet.field])) {
            _.each(item[facet.field], function(facetitem) {
              if (_.isEmpty(facetitem )) {return;}
              //self.facetStore[facet.field][facetitem].count += 1;
              let newcount = self.facetStore[facet.field][facetitem].count +1;
              self.facetStore[facet.field][facetitem].count=newcount
            });
          } else {
            if (item[facet.field] !== undefined) {
              if (_.isEmpty(item[facet.field] )) {return;}
              //self.facetStore[facet.field][item[facet.field]].count += 1;
              let newcount = self.facetStore[facet.field][item[facet.field]].count +1;
              self.facetStore[facet.field][item[facet.field]].count=newcount
            }
          }
        });
      });
      // remove confusing 0 from facets where a filter has been set
      _.each(self.state.filters, function(filters, facettitle) {
        _.each(self.facetStore[facettitle], function(facet) {
          if (facet.count == 0 && self.state.filters[facettitle].length) facet.count = "+";
        });
      });
      self.state.shownResults = 0;
    },
    toggleFilter: function(key, value)
    {
      console.log('toggleFilter')
      var state = this.state;
      state.filters[key] = state.filters[key] || [];
      if (_.indexOf(state.filters[key], value) == -1) {
        state.filters[key].push(value);
        // don't do isActive here. resetFacetCount is called later
      } else {
        state.filters[key] = _.without(state.filters[key], value);
        if (state.filters[key].length == 0) {
          delete state.filters[key];
          // don't do isActive here. resetFacetCount is called later
        }
      }
     this.filter();
    }
  }
}
</script>

<style scoped>

</style>
