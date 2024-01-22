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

                    ></Facets>
                  <feedback subject = 'Search' :name="textQuery" :urn="feedBackItemId"> </feedback>



<!--                  <HistRangeSlider></HistRangeSlider>-->
                </b-col>

                <!-- filter and results -->
                <b-col md="9" class="results">
                    <!-- Here comes the demo, if you want to copy and paste, start here -->
                    <ResultHeader
                        :current-count="currentResults.length"
                        :total-count="items.length"
                        :filters="filtersState.filters"

                                            ></ResultHeader>

                    <Results
                        v-bind:currentResults="currentResults"
                        :state="filtersState"
                    ></Results>

<!--                    <b-button variant="outline-primary" class="mt-5">Load More</b-button>-->
                </b-col>
            </b-row>
        </b-overlay>
    </b-container>
</template>

<script>

//import Vue from 'vue'
//import { provide, reactive } from 'vue'
import Results from "./Results";
import Facets from "./Facets";
//import _, { DatasetLocation } from 'underscore';
import _ from 'underscore';
//import axios from "axios";
//import FacetsConfig from '../../config.js'

//import {bus} from "../../main.js"
import ResultHeader from "./ResultHeader";
import {
  mapActions, mapGetters,
  mapState,
  // mapGetters
} from "vuex";
import feedback from "../feedback/feedback";
import {v5 as uuidv5} from 'uuid'


// import HistRangeSlider from "./HistRangeSlider.vue"

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
      facetStore: this.facetStore,
      filtersState: this.filtersState



    }
  },
  // setup() {
  //
  //   const facetStore = reactive({})
  //   const filtersState = reactive(     {
  //     orderBy: 'score',
  //         filters: {}
  //   })
  //
  //   provide("facetStore", facetStore)
  //   provide("filtersState", filtersState)
  //   provide('toggleFilter', this.toggleFilter)
  //
  //
  // },
  computed: {
    ...mapState(['results','searchExactMatch', 'microCache','FacetsConfig','esTemplateOptions', 'q']),
    //...mapGetters(['q',])
    ...mapGetters (['hasMicroCache', 'getMicroCache'])
  },
  watch: {
    results: 'search',
    textQuery: 'newTextSearch',
    n: 'newTextSearch',
    searchExactMatch: 'newTextSearch',
    resourceType: 'newTextSearch',
    // '$route.params.resourceType': function() {
    //   this.newTextSearch()
    //   // should get fanche and overlay a loading... then remove loading in toMetadata
    // },
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
    Facets,
    feedback,

  },

  data() {
    return {
      value: 1,
      isModalVisible: false,
      feedBackItemId: String,
      o: 0,
      n: 9,

      esTemplateOptions: this.esTemplateOptions,
      queryTemplates: {},
      filtersState: {
        orderBy: 'score',
        filters: {}
      },
      items: [],
      currentResults: [],
     facetStore: {},  ///  now defined using a provide
      //---- ok to edit facets
      facets: [],

      // -- end edit  facets
      queryRunning: false,
      lastError: undefined,
    // resourceType queries are in state.js
    //   microCache: null
    }
  },
  created() {
    this.n= this.FacetsConfig.LIMIT_DEFAULT
    this.facets =  this.FacetsConfig.FACETS
    const facetsList = {};
    _.each(this.facets,
        function (facet) { //function(facettitle, facet) {
          facetsList[facet.field] = {};
        });
    this.facetStore = facetsList;
  },
  mounted() {
    //const self = this;
    //const q = "water";
    console.log( window.location.href );
    this.o= 0;
    this.queryRunning = true;
   // this.$store.state.q = this.textQuery
    this.q = this.textQuery


    let paramString = window.location.href.split('?')[1];
    let queryString = new URLSearchParams(paramString);
    for(let pair of queryString.entries()) {
      if(pair[0] === 'q') continue
      if(pair[0] === 'resourceType' && pair[1] == 'all') continue
      // console.log("Key is:" + pair[0]);
      // console.log("Value is:" + pair[1]);
      this.toggleFilter(pair[0], pair[1], true)
    }


    // const hit = this.getMicroCache.get(this.textQuery)
    let queryObj = this.getQueryObj();

    if (this.hasMicroCache(queryObj.uuid)) {
      console.log("lru has " + queryObj.uuid)

      // caution, do not set results in this block, since results is watched,  so this ends up called twice
      this.search()

    // }
    // // console.log("hit: " + hit)
    //
    // let lastItems = this.$store.getters.getLastQueryResults(this.textQuery)
    // if (lastItems){
    //   this.$store.commit('setResults',lastItems)
    //   //this.queryRunning = false;
    //   this.search()
    }
    // else {
    //   this.$store.dispatch('getResults', queryObj
    //   )
   //    this.addtoMicroCache(queryObj, this.results)
   // }




  }
  ,
  methods: {
    ...mapActions([
      'getResults', 'getQueryTemplate', 'addtoMicroCache']),
     getQueryObj : function() {
      //let activeFilters = this.filtersState.filters|| []; // filters needs to be moved into actual filtersState in the future
       let activeFilters =  [];
       let queryObj = {
         textQuery: this.textQuery,
         limit: this.n,
         offset:  this.o,
         searchExactMatch: this.searchExactMatch,
         resourceType: this.resourceType,
         filters:activeFilters
       }
       let string2uuid = JSON.stringify(queryObj)
       let uuid =uuidv5(string2uuid,uuidv5.URL ) // any old 16 character namespace
      return { uuid:uuid, query: queryObj};
     } ,
    //content.results.bindings
    newTextSearch: function () {
      this.queryRunning = true;
   //   this.$store.state.q = this.textQuery
      this.q = this.textQuery
      this.getResults(this.getQueryObj()).then(()=>{
        this.queryRunning = false;
      }).catch((ex)=>{
        this.lastError = ex
        this.$bvToast.toast(`Query issue ` + ex, {
          title: "Server issues with query to triplestore",

          solid: true,
          appendToast: false,
          noAutoHide: true
        })
      })
      //this.queryRunning = false;
    },

    search: function () {
      let queryObj = this.getQueryObj();
      // these are handles in the state getResults...
      //this.$store.commit('setMicroCache', {'key':queryObj.uuid, 'value': this.results})
      // this.$store.commit('setResults',  this.results)
      this.feedBackItemId = "search?q="+queryObj.query?.textQuery;
      this.queryRunning = false;
      this.items = this.results;
     // this.items = this.getResults(this.getQueryObj()) // just in case it's not the last query
      this.initFacetCounts();//items,facets, facetStore,  facetSortOption
      this.filter();
      //vue3
      //bus.$emit('facetupdate');
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

      // move into mount
      // _.each(facets,
      //     function (facet) { //function(facettitle, facet) {
      //       facetStore[facet.field] = {};
      //     });
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
            //Vue.set(facetStore, facettitle, sortedstore) //vue2
            facetStore[facettitle]= sortedstore // vue3
          });


    },
    resetFacetCount: function () {
      var self = this;
      _.each(self.facetStore, function (items, facetname) {
        _.each(items, function (value, itemname) {
          self.facetStore[facetname][itemname].count = 0;
          if (_.indexOf(self.filtersState.filters[facetname], itemname) == -1) {
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
        _.each(self.filtersState.filters, function (filter, facet) {
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

     /// console.log(data)
     // console.log(data.map(d => new Date(d).valueOf()))
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
      _.each(self.filtersState.filters, function (filters, facettitle) {
        _.each(self.facetStore[facettitle], function (facet) {
          if (facet.count == 0 && self.filtersState.filters[facettitle].length) facet.count = "+";
        });
      });
      self.filtersState.shownResults = 0;
    },
    toggleFilter: function (key, value, skipfilterUrl=false) {
      console.log( window.location.href );
      var stateObj = { key: value};
      if(!skipfilterUrl) {
        if (window.location.href.includes(encodeURI("&" + key + "=" + value))) {
          var href = window.location.href
          href = href.replace(encodeURI("&" + key + "=" + value), '');
          history.pushState(stateObj, "", href);
        } else {
          history.pushState(stateObj, "", window.location.href + "&" + key + "=" + value);
        }
      }
      console.log( window.location.href );
      console.log('toggleFilter')
      var s_state = this.filtersState;
      this.$set(s_state.filters, key, s_state.filters[key] || [])
      if (_.indexOf(s_state.filters[key], value) == -1) {
        s_state.filters[key].push(value);
        this.$set(s_state.filters, key, s_state.filters[key])
        // don't do isActive here. resetFacetCount is called later
      } else {
        var indx = _.indexOf(s_state.filters[key], value)
        console.log('delete filter: ' + s_state.filters[key][indx] + " from the key: " + key)
        this.$set(s_state.filters, key, _.without(s_state.filters[key], value))
        if (s_state.filters[key].length == 0) {
          console.log('empty filter kw: ' + key)
          delete s_state.filters[key];
          // this.$set(s_state.filters, key,  undefined)
          // just setting to undefined does not work, and just delete does not work, so
          s_state.filters = Object.assign({}, s_state.filters)
          // don't do isActive here. resetFacetCount is called later
        }
      }
      this.filter();
    },
    clearFilters: function () {
      console.log( window.location.href );
      var href = window.location.href;
      for (const [key, value] of Object.entries(this.filtersState.filters)) {
        console.log(key, value);
        for (let s of value) {
          href = href.replace(encodeURI("&"+key+"="+s), '');
          console.log(href)
        }
      }
      history.pushState("", "", href);
      this.filtersState.filters = {}
      this.filter()
      this.$root.$emit('refresh slider range', 'clear')
    },
    order: function (orderBy) {
      let self = this;
      self.filtersState.orderBy = orderBy.field
      if (this.filtersState.orderBy) {
        //$(".activeorderby").removeClass("activeorderby");
        //$('#orderby_'+self.filtersState.orderBy).addClass("activeorderby");
        self.currentResults = _.sortBy(self.currentResults, function (item) {
          if (self.filtersState.orderBy == 'RANDOM') {
            return Math.random() * 10000;
          } else {
            return item[self.filtersState.orderBy];
          }
        });
        //if (this.orderByOptionsSort[self.filtersState.orderBy] === 'desc')
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
