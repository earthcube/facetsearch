<template>
  <div id="FacetSearch">
    <div id="wrapper row">
      <div id="description">
        <h6>{{ title }}</h6>

      </div>
    </div>
    <!-- Here comes the demo, if you want to copy and paste, start here -->
    <div class="row col-12" id="filterDiv"> <!-- filters -->
      <div class="row col-3 align-items-start">
        <Facets id="facetsDiv" class="row col-12" v-bind:settings="settings"
        >

        </Facets>


      </div>
      <div class="row col-8 align-self-start ">
        <div id="headingDiv" class="row col-12" style="height: 2em;"></div>

        <Results id="resultsDiv" v-bind:settings="settings"></Results>
      </div>
    </div>
  </div>
</template>

<script>
//import axios from 'axios'
import Results from "@/components/Results";
import Facets from "./Facets";
//import _, { map } from 'underscore';
import _ from 'underscore';

export default {
  name: "Search",
  props: {
    title: String,
    o: Number, n: Number
    // results:[]
  },
  components: {
    Results,
    Facets
  },
  data() {
    return {
      settings: {
        state: {
          orderBy: false,
          filters: {}
        },
        items: [],
        currentResults: [],
        facetStore: {},
        //---- ok to edit facets
        facets: [{
          field: 'kw',
          title: 'Science Domain',
          sort: 'acs'
        }, {
          field: 'resourceType',
          title: 'Resource Type',
          sort: 'acs'
        },
        ],
        // -- end edit  facets
      },


    }
  },

  async mounted() {
    const self = this;
    const q = "water";
    const n = 10;
    const o = 0;

    // var url = new URL("https://graph.geodex.org/blazegraph/namespace/nabu/sparql");
    var url = "https://graph.geodex.org/blazegraph/namespace/nabu/sparql";
    var params = {
      query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                        prefix schema: <http://schema.org/>
                        prefix sschema: <https://schema.org/>
                        SELECT distinct ?subj ?pubname (GROUP_CONCAT(DISTINCT ?placename; SEPARATOR=", ") AS ?placenames)
        (GROUP_CONCAT(DISTINCT ?kwu; SEPARATOR=", ") AS ?kw)
        ?datep  (MIN(?url) as ?disurl) ?score  ?name ?description ?resourceType ?g
        WHERE {
            ?lit bds:search "${q}" .
            ?lit bds:matchAllTerms "false" .
            ?lit bds:relevance ?score .
            ?subj ?p ?lit .
            optional {?subj schema:distribution/schema:url|schema:subjectOf/schema:url ?url .}
            BIND ( IF ( exists { ?subj a schema:Dataset .} ||exists{ ?subj a sschema:Dataset .}  , "data", "tool")  AS ?resourceType ).

            graph ?g { ?subj schema:description|sschema:description ?description . }
            ?subj schema:name|sschema:name ?name .
            ?subj schema:description|sschema:description ?description .
            filter( ?score > 0.04).
            OPTIONAL {?subj schema:datePublished|sschema:datePublished ?datep .}
            OPTIONAL {?subj schema:publisher/schema:name|sschema:publisher/sschema:name ?pubname .}
            OPTIONAL {?subj schema:spatialCoverage/schema:name|sschema:spatialCoverage/sschema:name ?placename .}
            OPTIONAL {?subj schema:keywords|sschema:keywords ?kwu .}
        }
        GROUP BY ?subj ?datep ?pubname ?name ?description ?url ?score ?resourceType ?g
        ORDER BY DESC(?score)
        LIMIT ${n}
        OFFSET ${o}`
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
            items = _.map(response.data.results.bindings, function (item) {

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
              return flattened;
            })
          }
          self.settings.items = items;
          self.initFacetCounts(self.settings);
          self.filter(self.settings);

        }
    );


  }
  ,
  methods: {
    //content.results.bindings
    flattenSparqlResults: function (bindings) {
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
        return flattened;
      })
      return items;
    },
    //getItemsFromSparql: async function (q, n = 1000, o = 0) {
    initFacetCounts: function (settings) {
      _.each(settings.facets,
          function (facet) { //function(facettitle, facet) {
            settings.facetStore[facet.field] = {};
          });
      _.each(settings.items, function (item) {
        // intialize the count to be zero
        _.each(settings.facets,
            function (facet) { //function(facettitle, facet) {
              if (_.isArray(item[facet.field])) {
                _.each(item[facet.field], function (facetitem) {
                  if (_.isEmpty(facetitem)) {
                    return;
                  }
                  settings.facetStore[facet.field][facetitem] = settings.facetStore[facet.field][facetitem] || {
                    count: 0,
                    id: _.uniqueId("facet_")
                  }
                });
              } else {
                if (item[facet.field] !== undefined) {
                  if (_.isEmpty(item[facet.field])) {
                    return;
                  }
                  settings.facetStore[facet.field][item[facet.field]] = settings.facetStore[facet.field][item[facet.field]] || {
                    count: 0,
                    id: _.uniqueId("facet_")
                  }
                }
              }
            });
      });
      // sort it:
      _.each(settings.facetStore,
          function (facet) { //function(facet, facettitle) {
            var sorted = _.keys(settings.facetStore[facet.title]).sort();
            if (settings.facetSortOption && settings.facetSortOption[facet.title]) {
              sorted = _.union(settings.facetSortOption[facet.title], sorted);
            }
            var sortedstore = {};
            _.each(sorted, function (el) {
              sortedstore[el] = settings.facetStore[facet.field][el];
            });
            settings.facetStore[facet.field] = sortedstore;
          });


    },
    resetFacetCount: function () {
      var self= this;
      _.each(self.settings.facetStore, function (items, facetname) {
        _.each(items, function (value, itemname) {
          self.settings.facetStore[facetname][itemname].count = 0;
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
      var settings = this.settings;
      this.settings.currentResults = []
      this.settings.currentResults = _.select(this.settings.items, function (item) {
        var filtersApply = true;
        _.each(settings.state.filters, function (filter, facet) {
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
      this.resetFacetCount();
      // then reduce the items to get the current count for each facet
      _.each(settings.facets, function( facet) {
        _.each(settings.currentResults, function(item) {
          if (_.isArray(item[facet.field])) {
            _.each(item[facet.field], function(facetitem) {
              if (_.isEmpty(facetitem )) {return;}
              settings.facetStore[facet.field][facetitem].count += 1;
            });
          } else {
            if (item[facet.field] !== undefined) {
              if (_.isEmpty(item[facet.field] )) {return;}
              settings.facetStore[facet.field][item[facet.field]].count += 1;
            }
          }
        });
      });
      // remove confusing 0 from facets where a filter has been set
      _.each(settings.state.filters, function(filters, facettitle) {
        _.each(settings.facetStore[facettitle], function(facet) {
          if (facet.count == 0 && settings.state.filters[facettitle].length) facet.count = "+";
        });
      });
      settings.state.shownResults = 0;
    }
  }
}
</script>

<style scoped>

</style>
