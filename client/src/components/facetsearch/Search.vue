<template>
  <b-container fluid="md" class="mt-3">
    <b-overlay
      rounded="sm"
      :show="queryRunning"
      variant="white"
      :opacity="0.85"
    >
      <b-row>
        <!-- sidebar -->
        <b-col md="3" class="sidebar">
          <Facets :facets="facets" :facet-store="facetStore"></Facets>
          <feedback subject="Search" :name="textQuery" :urn="feedBackItemId">
          </feedback>

          <!--                  <HistRangeSlider></HistRangeSlider>-->
        </b-col>

        <!-- filter and results -->
        <b-col md="9" class="results">
          <!-- Here comes the demo, if you want to copy and paste, start here -->
          <ResultHeader
            :current-count="currentResults.length"
            :total-count="items.length"
            :filters="filters"
          ></ResultHeader>

          <Results
            :current-results="currentResults"
            :filters="filters"
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
import Results from "@/components/facetsearch/Results.vue";
import Facets from "@/components/facetsearch/Facets.vue";
import _, { isArray } from "underscore";
//import axios from "axios";
//import FacetsConfig from '../../config.js'

//import {bus} from "../../main.js"
import ResultHeader from "@/components/facetsearch/ResultHeader.vue";
import {
  mapActions,
  mapGetters,
  mapState,
  mapMutations,
  // mapGetters
} from "vuex";
import feedback from "@/components/feedback/feedback.vue";
import { v5 as uuidv5 } from "uuid";
import { isProxy, toRaw } from "vue";
import { DateRange } from "@/components/facetsearch/range.js";
import { DateTime, Interval } from "luxon";

// import HistRangeSlider from "@/components/facetsearch/HistRangeSlider.vue"

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
      filtersState: this.filtersState,
      filter: this.filter,
      isRangeFilter: this.isRangeFilter,
      currentResults: this.currentResults,
      filters: this.filters,
    };
  },
  computed: {
    ...mapState([
      "results",
      "searchExactMatch",
      "microCache",
      "FacetsConfig",
      "esTemplateOptions",
      "q",
    ]),
    //...mapGetters(['q',])
    ...mapGetters(["hasMicroCache", "getMicroCache"]),
  },
  watch: {
    results: "search",
    textQuery: "newTextSearch",
    n: "newTextSearch",
    searchExactMatch: "newTextSearch",
    resourceType: "newTextSearch",
    // '$route.params.resourceType': function() {
    //   this.newTextSearch()
    //   // should get fanche and overlay a loading... then remove loading in toMetadata
    // },
  },

  props: {
    title: String,
    textQuery: String, // this needs to be here route passes as a prop
    resourceType: String,
    exact: String,
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
      // filtersState: {
      //   orderBy: "score",
      //   filters: {},
      // },
      orderby: "score",
      filters: {},
      items: [],
      currentResults: [],
      facetStore: {}, ///  now defined using a provide
      //---- ok to edit facets
      facets: [],
      shownResults: 0,

      // -- end edit  facets
      queryRunning: false,
      lastError: undefined,
      // resourceType queries are in state.js
      //   microCache: null
    };
  },
  created() {
    this.n = this.FacetsConfig.LIMIT_DEFAULT;
    this.facets = this.FacetsConfig.FACETS;
    const facetsList = {};
    _.each(this.facets, function (facet) {
      //function(facettitle, facet) {
      facetsList[facet.field] = {};
    });
    this.facetStore = facetsList;
  },
  mounted() {
    //const self = this;
    //const q = "water";
    console.log(window.location.href);
    this.o = 0;
    this.queryRunning = true;
    // this.$store.state.q = this.textQuery
    this.setTextQuery(this.textQuery);
    this.setResourceTypeQuery("all");
    this.setSearchExactMatch(this.exact);
    // for some reason, the set are in here, and the nav bar header,
    let paramString = window.location.href.split("?")[1];
    let queryString = new URLSearchParams(paramString);
    for (let pair of queryString.entries()) {
      if (pair[0] === "q") continue;
      if (pair[0] === "resourceType" && pair[1] == "all") continue;
      if (pair[0] === "searchExactMatch") continue;
      // console.log("Key is:" + pair[0]);
      // console.log("Value is:" + pair[1]);
      // this will need to better handle RangeFilters and populate the toggle with an array
      this.toggleFilter(pair[0], pair[1], true);
    }

    // const hit = this.getMicroCache.get(this.textQuery)
    let queryObj = this.getQueryObj();

    if (this.hasMicroCache(queryObj.uuid)) {
      console.log("lru has " + queryObj.uuid);

      // caution, do not set results in this block, since results is watched,  so this ends up called twice
      this.search();

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
  },
  methods: {
    ...mapMutations([
      "setTextQuery",
      "setResourceTypeQuery",
      "setSearchExactMatch",
    ]),
    ...mapActions(["getResults", "getQueryTemplate", "addtoMicroCache"]),
    updateYearRange(start, end) {
      this.$set(this.filtersState.filters, "startYear", [start]);
      this.$set(this.filtersState.filters, "endYear", [end]);
      this.filter();
    },
    getQueryObj: function () {
      //let activeFilters = this.filtersState.filters|| []; // filters needs to be moved into actual filtersState in the future
      let activeFilters = [];
      let queryObj = {
        textQuery: this.textQuery,
        //textMatchAll: this.textMatchAllButton,
        limit: this.n,
        offset: this.o,
        searchExactMatch: this.searchExactMatch,
        resourceType: this.resourceType,
        filters: activeFilters,
      };
      let string2uuid = JSON.stringify(queryObj);
      let uuid = uuidv5(string2uuid, uuidv5.URL); // any old 16 character namespace
      return { uuid: uuid, query: queryObj };
    },
    //content.results.bindings
    newTextSearch: function () {
      this.queryRunning = true;
      //   this.$store.state.q = this.textQuery
      this.setTextQuery(this.textQuery);
      this.getResults(this.getQueryObj())
        .then(() => {
          this.queryRunning = false;
        })
        .catch((ex) => {
          this.lastError = ex;
          this.$bvToast.toast(`Query issue ` + ex, {
            title: "Server issues with query to triplestore",

            solid: true,
            appendToast: false,
            noAutoHide: true,
          });
        });
      //this.queryRunning = false;
    },

    search: function () {
      let queryObj = this.getQueryObj();
      // these are handles in the state getResults...
      //this.$store.commit('setMicroCache', {'key':queryObj.uuid, 'value': this.results})
      // this.$store.commit('setResults',  this.results)
      this.feedBackItemId = "search?q=" + queryObj.query?.textQuery;
      this.queryRunning = false;
      this.items = this.results;
      // this.items = this.getResults(this.getQueryObj()) // just in case it's not the last query
      this.initFacetCounts(); //items,facets, facetStore,  facetSortOption
      this.filter();
      //vue3
      //bus.$emit('facetupdate');
    },
    setResultLimit(n) {
      this.n = n;
    },
    setSearchExactmatch(b) {
      this.searchExactMatch = b;
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
        _.each(facets, function (facet) {
          //function(facettitle, facet) {
          if (_.isArray(item[facet.field])) {
            _.each(item[facet.field], function (facetitem) {
              if (_.isEmpty(facetitem)) {
                return;
              }
              facetStore[facet.field][facetitem] = facetStore[facet.field][
                facetitem
              ] || {
                count: 0,
                id: _.uniqueId("facet_"),
                isActive: false,
              };
              // Vue.observable(facetStore[facet.field][facetitem] )
            });
          } else {
            if (item[facet.field] !== undefined) {
              if (_.isEmpty(item[facet.field])) {
                return;
              }
              facetStore[facet.field][item[facet.field]] = facetStore[
                facet.field
              ][item[facet.field]] || {
                count: 0,
                id: _.uniqueId("facet_"),
                isActive: false,
              };
              //  Vue.observable(facetStore[facet.field][item[facet.field]]  )
            }
          }
        });
      });
      // sort it:
      _.each(facetStore, function (facetData, facettitle) {
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
        facetStore[facettitle] = sortedstore; // vue3
      });
    },
    resetFacetCount: function () {
      var self = this;
      _.each(self.facetStore, function (items, facetname) {
        _.each(items, function (value, itemname) {
          self.facetStore[facetname][itemname].count = 0;
          // if (_.indexOf(self.filtersState.filters[facetname], itemname) == -1) {
          if (_.indexOf(self.filters[facetname], itemname) == -1) {
            self.facetStore[facetname][itemname].isActive = false;
          } else {
            self.facetStore[facetname][itemname].isActive = true;
          }
        });
      });
    },
    isRangeFilter: function (filter) {
      let isRange = false;
      let filterType = "notRange";
      if (filter !== undefined) {
        if (isProxy(filter) && _.isObject(filter)) {
          filter = toRaw(filter);
        }
        if (isArray(filter)) {
          filter = filter[0];
        }
        //isRangeFilter =  NoProxy.hasOwnProperty('range') ;
        isRange = Object.hasOwn(filter, "range");
        filterType = filter.filtertype;
      }
      return [isRange, filterType];
    },
    /**
     * Filters all items from the settings according to the currently
     * set filters and stores the results in the settings.currentResults.
     * The number of items in each filter from each facet is also updated
     */
    filter: function () {
      // first apply the filters to the items
      const getLatestFilterValue = (key) => {
        //const val = self.filtersState.filters[key];
        const val = self.filters[key];
        return Array.isArray(val) ? val.slice(-1)[0] : undefined;
      };
      const getRangeIsValid = (item, min, max) => {
        //const val = self.filtersState.filters[key];
        const val = self.filters[key];
        return Array.isArray(val) ? val.slice(-1)[0] : undefined;
      };
      // this.currentResults = [] // triggers reactive event and we are resetting it in the next lines, anyway
      let self = this;
      // self.currentResults = _.select(this.items, function (item) {
      let newResults = _.select(this.items, function (item) {
        let filtersApply = true;
        // _.each(self.filtersState.filters, function (filter, facet) {
        _.each(self.filters, function (filter, facet) {
          const thisFacet = item[facet];
          if (thisFacet == undefined) {
            filtersApply = false;
            return filtersApply;
          }
          // if a filter is a range, the do a range check
          // this does not need to be custom for each. This is a range
          // these things need to ha able to have MORE THAN ONE
          // One Numberic, and one Date, m.
          // AKA WRITE ONE RANGE FUNCTION
          // maybe check can be, if is object, and with min and max
          // change the range filters to pass that object to toggle filter
          let [isRange, filterType] = self.isRangeFilter(filter);
          let isNumericRange = filterType === "numericRange";
          let isDateRange = filterType === "dateRange";
          // let isNumericRangeFilter = false; // depth uses
          // if (isProxy(filter) && _.isObject(toRaw(filter))) {
          //   const NoProxy = toRaw(filter)[0]; // no idea why this is an array
          //   //isRangeFilter =  NoProxy.hasOwnProperty('range') ;
          //   isRangeFilter = Object.hasOwn(NoProxy, 'range')
          //   isNumericRangeFilter = NoProxy.filtertype == 'numericRange'
          // }

          if (isRange) {
            if (isArray(filter)) {
              filter = filter[0];
            }
            if (isNumericRange) {
              // this is passed from the depth
              //const [minFacet, maxFacet] = filter.split(',');  // for some reason array becomes string
              const minFacet = filter.minField;
              const maxFacet = filter.maxField;
              const minSlider = filter.range[0];
              const maxSlider = filter.range[1];
              const minFacetValue = item[minFacet];
              const maxFacetValue = item[maxFacet];

              // Function to check if two ranges overlap
              function rangesOverlap(
                minFacetValue,
                maxFacetValue,
                minSlider,
                maxSlider
              ) {
                return minFacetValue <= maxSlider && maxFacetValue >= minSlider;
              }

              // Handle array case
              if (_.isArray(minFacetValue) || _.isArray(maxFacetValue)) {
                // For arrays, check if any range overlaps
                const ranges = _.zip(
                  _.isArray(minFacetValue) ? minFacetValue : [minFacetValue],
                  _.isArray(maxFacetValue) ? maxFacetValue : [maxFacetValue]
                );

                const hasOverlap = ranges.some(([min, max]) => {
                  if (min === undefined || max === undefined) {
                    console.log(
                      `possible misconfiguraton of facetsConfig change names ${minFacet}  ${maxFacet}`
                    );
                    return false;
                  }
                  return rangesOverlap(
                    parseFloat(min),
                    parseFloat(max),
                    parseFloat(minSlider),
                    parseFloat(maxSlider)
                  );
                });

                if (!hasOverlap) {
                  filtersApply = false;
                }
              }
              // Handle single value case
              else if (
                minFacetValue !== undefined &&
                maxFacetValue !== undefined
              ) {
                const hasOverlap = rangesOverlap(
                  parseFloat(minFacetValue),
                  parseFloat(maxFacetValue),
                  parseFloat(minSlider),
                  parseFloat(maxSlider)
                );

                if (!hasOverlap) {
                  filtersApply = false;
                }
              } else {
                console.log(
                  `possible misconfiguraton of facetsConfig change names ${minFacet}  ${maxFacet}`
                );
              }
            } else if (isDateRange) {
              const thisYear = DateTime.now(thisFacet).toISODate();
              const temporalFix = (facetData, thisYear) => {
                if (
                  typeof facetData === "string" &&
                  facetData.endsWith("/..")
                ) {
                  return facetData.replace("/..", `/${thisYear}`);
                }
                return facetData;
              };
              const temporalParse = (tc, thisYear) => {
                try {
                  const fixedFacet = temporalFix(thisFacet, thisYear);
                  let range = Interval.fromISO(fixedFacet);
                  if (!range.invalid) {
                    return [range.start, range.end];
                  } else {
                    let date = DateTime.fromISO(tc);

                    if (!date.invalid) {
                      return [date, date];
                    }
                  }
                } catch (e) {
                  console.log(` cannot parse temporal range ${tc}`);
                  return null;
                }
              };
              if (_.isArray(thisFacet)) {
                var hasMatches = _.filter(thisFacet, (num) =>
                  _.inRange(
                    DateTime.fromISO(thisFacet).year,
                    filter.range[0],
                    filter.range[0]
                  )
                );
                if (hasMatches.length == 0) {
                  filtersApply = false;
                }
              } else {
                if (filter.range[0] && filter.range[1]) {
                  const theDate = temporalParse(thisFacet, thisYear);
                  if (theDate.invalid) {
                    filtersApply = false;
                  }
                  if (_.isArray(theDate)) {
                    if (
                      theDate[1].year < filter.range[0] ||
                      theDate[0].year > filter.range[1]
                    )
                      filtersApply = false;
                  } else {
                    if (
                      theDate.invalid ||
                      (!theDate.invalid &&
                        (theDate.year < filter.range[0] ||
                          theDate.year > filter.range[1]))
                    ) {
                      filtersApply = false;
                    }
                  }
                }
              }
            } // range filter
            else {
              const thisFacet = item[facet];
              if (thisFacet == undefined) {
                filtersApply = false;
              }
              if (_.isArray(item[facet])) {
                var hasMatches = _.filter(thisFacet, (num) =>
                  _.inRange(thisFacet, filter.range[0], filter.range[0])
                );
                if (hasMatches.length == 0) {
                  filtersApply = false;
                }
              } else {
                if (filter.range[0] && filter.range[1]) {
                  if (
                    thisFacet < filter.range[0] ||
                    thisFacet > filter.range[1]
                  ) {
                    filtersApply = false;
                  }
                }
              }
            }
          } else {
            if (_.isArray(item[facet])) {
              // this is if a facet has multiple selections, like keywords, or places
              var inters = _.intersection(item[facet], filter);
              if (inters.length == 0) {
                filtersApply = false;
              }
            }
            // is Objec with facetType (Range, DateRange, NumericRange)
            // filter based on min/max
            else {
              if (filter.length && _.indexOf(filter, item[facet]) == -1) {
                filtersApply = false;
              }
            }
          }
        });
        return filtersApply;
      });

      // const minDepthFilter = getLatestFilterValue("minDepth");
      // const maxDepthFilter = getLatestFilterValue("maxDepth");
      // const startYearFilter = getLatestFilterValue("startYear");
      // const endYearFilter = getLatestFilterValue("endYear");

      // let newResults = _.filter(this.items, function (item) {
      //   const itemMin = parseFloat(item.minDepth);
      //   const itemMax = parseFloat(item.maxDepth);
      //
      //   let itemStartYear = undefined;
      //   let itemEndYear = undefined;
      //   if (typeof item.temporalCoverage === "string" && item.temporalCoverage.includes("/")) {
      //     const [start, end] = item.temporalCoverage.split("/");
      //     itemStartYear = parseInt(start.trim(), 10);
      //     itemEndYear = parseInt(end.trim(), 10);
      //   }
      //
      //   const isValid = () => {
      //     if (isNaN(itemMin) || isNaN(itemMax)) return false;
      //
      //     const overlapsDepthRange =
      //       (minDepthFilter === undefined || itemMax >= minDepthFilter) &&
      //       (maxDepthFilter === undefined || itemMin <= maxDepthFilter);
      //
      //     if (!overlapsDepthRange) return false;
      //
      //     if (isNaN(itemStartYear) && isNaN(itemEndYear)) return false;
      //     if (isNaN(itemStartYear)) itemStartYear = itemEndYear;
      //     if (isNaN(itemEndYear)) itemEndYear = itemStartYear;
      //
      //     const overlapsYearRange =
      //       (startYearFilter === undefined || itemEndYear >= startYearFilter) &&
      //       (endYearFilter === undefined || itemStartYear <= endYearFilter);
      //
      //     return overlapsYearRange;
      //   };
      //
      //   if (!isValid()) return false;
      //
      //   for (const [facet, filter] of Object.entries(self.filtersState.filters)) {
      //     if (["minDepth", "maxDepth", "startYear", "endYear"].includes(facet)) continue;
      //
      //     if (_.isArray(item[facet])) {
      //       const inters = _.intersection(item[facet], filter);
      //       if (inters.length === 0) return false;
      //     } else {
      //       if (filter.length && !filter.includes(item[facet])) return false;
      //     }
      //   }
      //
      //   return true;
      // });

      const len = self.currentResults.length;
      self.currentResults.splice(0, len);
      newResults.forEach((i) => self.currentResults.push(i));

      this.resetFacetCount();

      _.each(self.facets, function (facet) {
        _.each(self.currentResults, function (item) {
          const val = item[facet.field];
          if (_.isArray(val)) {
            val.forEach((facetitem) => {
              if (_.isEmpty(facetitem)) return;
              self.facetStore[facet.field][facetitem].count += 1;
            });
          } else if (val !== undefined && !_.isEmpty(val)) {
            self.facetStore[facet.field][val].count += 1;
          }
        });
      });

      //  _.each(self.filtersState.filters, function (filters, facettitle) {
      _.each(self.filters, function (filters, facettitle) {
        _.each(self.facetStore[facettitle], function (facet) {
          if (facet.count === 0 && filters.length) facet.count = "+";
        });
      });

      self.shownResults = 0;
    },

    toggleFilter: function (key, value, skipUrlUpdate = false) {
      let self = this;
      // const state = this.filtersState;
      const filters = this.filters;
      if (!skipUrlUpdate) {
        this.updateUrlState(key, value);
      }

      // Initialize filters if needed
      // if (!state.filters[key]) {
      //   state.filters[key] = [];
      // }
      if (!filters[key]) {
        filters[key] = [];
      }
      let [isRange, filterType] = this.isRangeFilter(value);
      let isNumericRange = filterType === "numericRange";
      let isDateRange = filterType === "dateRange";
      if (!isRange) {
        //const filterArray = state.filters[key];
        const filterArray = filters[key];
        const valueIndex = _.indexOf(filterArray, value);

        if (valueIndex === -1) {
          // Add new value
          filterArray.push(value);
          filters[key] = [...filterArray];
          // state.filters = {...state.filters};
          self.filters = { ...filters };
        } else {
          // Remove existing value
          //state.filters[key] = _.without(filterArray, value);
          filters[key] = _.without(filterArray, value);
          // Clean up empty filters
          // if (state.filters[key].length === 0) {
          //   delete state.filters[key];
          //   // Trigger reactivity by creating a new object
          //   state.filters = {...state.filters};
          // }
          if (filters[key].length === 0) {
            delete filters[key];
            // Trigger reactivity by creating a new object
            self.filters = { ...filters };
          }
        }
      } else {
        // ignore that the dates should be encoded as timespan for now.
        // just reset the range.
        // For range filters, we always want to set the value, regardless of whether the filter exists
        filters[key] = value;
        self.filters = { ...filters };
      }

      this.filter();
    },

    updateUrlState: function (key, value) {
      const url = new URL(window.location.href);
      const hashParts = url.hash.split("?");
      const basePath = hashParts[0];
      const params = new URLSearchParams(hashParts[1] || "");

      // Check if this exact parameter is already in the URL
      const existingValue = params.get(key);
      if (existingValue === value.toString()) {
        // If it exists, remove it
        params.delete(key);
      } else {
        // Handle range filters differently
        let [isRange, filterType] = this.isRangeFilter(toRaw(value));
        let isNumericRange = filterType === "numericRange";
        let isDateRange = filterType === "dateRange";
        // let isRangeFilter = false;
        // let isNumericRangeFilter = false;
        // let isDateRangeFilter = false;
        // if (isProxy(value) && _.isObject(toRaw(value))) {
        //   value = toRaw(value);
        // }
        // isRangeFilter = Object.hasOwn(value, 'range');
        // if (isRangeFilter) {
        //   isNumericRangeFilter = value?.filtertype == 'numericRange';
        //   isDateRangeFilter = value?.filtertype == 'dateRange';
        // }

        // If it's a range filter, convert to string format
        if (isRange) {
          value = value.range.toString();
        }

        // Remove any existing value for this key before adding the new one
        params.delete(key);
        params.append(key, value);
      }

      // Update the URL
      url.hash = `${basePath}?${params.toString()}`;
      history.pushState({ key: value }, "", url.toString());
    },

    clearFilters: function () {
      // Get the current URL and split it to preserve the base path
      const url = new URL(window.location.href);
      const hashParts = url.hash.split("?");
      const basePath = hashParts[0];

      // Create new URLSearchParams to preserve only essential parameters
      const params = new URLSearchParams(hashParts[1] || "");

      // Preserve only essential parameters (q, resourceType, searchExactMatch)
      const essentialParams = ["q", "resourceType", "searchExactMatch"];
      const preservedParams = new URLSearchParams();

      essentialParams.forEach((param) => {
        const value = params.get(param);
        if (value !== null) {
          preservedParams.append(param, value);
        }
      });

      // Update URL with preserved parameters
      const newHash = preservedParams.toString()
        ? `${basePath}?${preservedParams.toString()}`
        : basePath;

      url.hash = newHash;
      history.pushState({}, "", url.toString());

      // Clear the filters state
      //this.filtersState.filters = {};
      this.filters = {};
      this.filter();

      // Emit event to reset sliders - ensure this happens after filters are cleared
      this.$root.$emit("refresh slider range", "clear");
    },
    order: function (orderBy) {
      let self = this;
      //self.filtersState.orderBy = orderBy.field;
      self.orderBy = orderBy.field;
      if (this.filtersState.orderBy) {
        //$(".activeorderby").removeClass("activeorderby");
        //$('#orderby_'+self.filtersState.orderBy).addClass("activeorderby");
        self.currentResults = _.sortBy(self.currentResults, function (item) {
          //if (self.filtersState.orderBy == "RANDOM") {
          if (self.orderBy == "RANDOM") {
            return Math.random() * 10000;
          } else {
            // return item[self.filtersState.orderBy];
            return item[self.orderBy];
          }
        });
        //if (this.orderByOptionsSort[self.filtersState.orderBy] === 'desc')
        if (orderBy.sort === "desc") {
          // nice to be passing around objects
          self.currentResults = self.currentResults.reverse();
        }
      }
    },
  },
};
</script>

<style scoped></style>
