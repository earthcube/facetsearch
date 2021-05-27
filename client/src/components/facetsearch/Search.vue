<template>
    <b-container fluid="md" class="mt-3">
        <b-overlay rounded="sm"
            :show="queryRunning"

            variant="white"
            :opacity=".85"
        >
            <b-row>
                <!-- sidebar -->
                <b-col md="3" class="sidebar">
                    <Facets
                        v-bind:facets="facets"
                        v-bind:facetStore="facetStore"
                        v-bind:state="state"
                    ></Facets>
                </b-col>

                <!-- filter and results -->
                <b-col md="9" class="results">
                    <!-- Here comes the demo, if you want to copy and paste, start here -->
                    <ResultHeader
                        :current-count="currentResults.length"
                        :total-count="items.length"
                        :filters="state.filters"
                    ></ResultHeader>

                    <Results
                        v-bind:currentResults="currentResults"
                        :state="state"
                    ></Results>

<!--                    <b-button variant="outline-primary" class="mt-5">Load More</b-button>-->
                </b-col>
            </b-row>
        </b-overlay>
    </b-container>
</template>

<script>
import Vue from 'vue'
import Results from "./Results";
import Facets from "./Facets";
//import _, { DatasetLocation } from 'underscore';
import _ from 'underscore';
//import axios from "axios";
import FacetsConfig from '../../config.js'

import {bus} from "../../main.js"
import ResultHeader from "./ResultHeader";
import {mapActions,
  mapState,
 // mapGetters
} from "vuex";

export default {
  name: "Search",
  provide: function () {
    return {
      toggleFilter: this.toggleFilter,
      esTemplateOptions: this.esTemplateOptions,
      order: this.order,
      clearFilters: this.clearFilters,
      setResultLimit: this.setResultLimit,
      setSearchExactmatch: this.setSearchExactmatch,

    }
  },
  computed: {
    ...mapState(['results','searchExactMatch']),
    //...mapGetters(['q',])
  },
  watch: {
    results: 'search',
    textQuery: 'newTextSearch',
    n: 'newTextSearch',
    searchExactMatch: 'newTextSearch',
  },

  props: {
    title: String,
    textQuery: String, // this needs to be here route passes as a prop
    resourceType: String
    // results:[]
  },

  components: {
    ResultHeader,
    Results,
    Facets
  },
  data() {
    return {

      o: 0,
      n: FacetsConfig.LIMIT_DEFAULT,

      esTemplateOptions: {interpolate: /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g},
      queryTemplates: {},
      state: {
        orderBy: 'score',
        filters: {}
      },
      items: [],
      currentResults: [],
      facetStore: {},
      //---- ok to edit facets
      facets: FacetsConfig.FACETS,

      // -- end edit  facets
      queryRunning: false,


    }
  },

  mounted() {
    //const self = this;
    //const q = "water";

    const o = 0;
    this.queryRunning = true;
    this.$store.state.q = this.textQuery
    this.$store.dispatch('getResults', {
          textQuery: this.textQuery,
          limit: this.n,
          offset: o,
          searchExactMatch: this.searchExactMatch
        }
    )


  }
  ,
  methods: {
    ...mapActions([
      'getResults', 'getQueryTemplate']),
    //content.results.bindings
    newTextSearch: function () {
      this.queryRunning = true;
      this.$store.state.q = this.textQuery
      this.getResults({
        textQuery: this.textQuery,
        limit: this.n,
        offset: this.o,
        searchExactMatch: this.searchExactMatch
      })
    },
    search: function () {
      this.queryRunning = false;
      this.items = this.results;
      this.initFacetCounts();//items,facets, facetStore,  facetSortOption
      this.filter();
      bus.$emit('facetupdate');
    },
    setResultLimit(n) {
      this.n = n
    },
    setSearchExactmatch(b) {
      this.searchExactMatch = b
    },

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
          function (facetData, facettitle) {
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
      var self = this;
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
      newResults.forEach((i) => self.currentResults.push(i))


      this.resetFacetCount();
      // then reduce the items to get the current count for each facet
      _.each(self.facets, function (facet) {
        _.each(self.currentResults, function (item) {
          if (_.isArray(item[facet.field])) {
            _.each(item[facet.field], function (facetitem) {
              if (_.isEmpty(facetitem)) {
                return;
              }
              //self.facetStore[facet.field][facetitem].count += 1;
              let newcount = self.facetStore[facet.field][facetitem].count + 1;
              self.facetStore[facet.field][facetitem].count = newcount
            });
          } else {
            if (item[facet.field] !== undefined) {
              if (_.isEmpty(item[facet.field])) {
                return;
              }
              //self.facetStore[facet.field][item[facet.field]].count += 1;
              let newcount = self.facetStore[facet.field][item[facet.field]].count + 1;
              self.facetStore[facet.field][item[facet.field]].count = newcount
            }
          }
        });
      });
      // remove confusing 0 from facets where a filter has been set
      _.each(self.state.filters, function (filters, facettitle) {
        _.each(self.facetStore[facettitle], function (facet) {
          if (facet.count == 0 && self.state.filters[facettitle].length) facet.count = "+";
        });
      });
      self.state.shownResults = 0;
    },
    toggleFilter: function (key, value) {
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
    },
    clearFilters: function () {
      this.state.filters = {}
      this.filter()
    },
    order: function (orderBy) {
      let self = this;
      self.state.orderBy = orderBy.field
      if (this.state.orderBy) {
        //$(".activeorderby").removeClass("activeorderby");
        //$('#orderby_'+self.state.orderBy).addClass("activeorderby");
        self.currentResults = _.sortBy(self.currentResults, function (item) {
          if (self.state.orderBy == 'RANDOM') {
            return Math.random() * 10000;
          } else {
            return item[self.state.orderBy];
          }
        });
        //if (this.orderByOptionsSort[self.state.orderBy] === 'desc')
        if (orderBy.sort === 'desc') // nice to be passing around objects
        {
          self.currentResults = self.currentResults.reverse();
        }
      }
    }
  }
}
</script>

<style scoped>

</style>
