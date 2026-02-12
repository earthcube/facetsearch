
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
        </b-col>

        <!-- filter and results -->
        <b-col md="9" class="results">
          <ResultHeader
            :current-count="currentResults.length"
            :total-count="items.length"
            :filters="filtersState.filters"
          ></ResultHeader>

          <Results
            :current-results="currentResults"
            :state="filtersState"
          ></Results>
        </b-col>
      </b-row>
    </b-overlay>
  </b-container>
</template>

<script>
import Results from "@/components/facetsearch/Results.vue";
import Facets from "@/components/facetsearch/Facets.vue";
import _ from "underscore";
import ResultHeader from "@/components/facetsearch/ResultHeader.vue";
import {
  mapActions,
  mapGetters,
  mapState,
  mapMutations,
} from "vuex";
import feedback from "@/components/feedback/feedback.vue";
import { v5 as uuidv5 } from "uuid";

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
    ...mapGetters(["hasMicroCache", "getMicroCache"]),
  },
  watch: {
    results: "search",
    textQuery: "newTextSearch",
    n: "newTextSearch",
    searchExactMatch: "newTextSearch",
    resourceType: "newTextSearch",
  },

  props: {
    title: String,
    textQuery: String,
    resourceType: String,
    exact: String
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
        orderBy: "score",
        filters: {},
      },
      items: [],
      currentResults: [],
      facetStore: {},
      facets: [],
      queryRunning: false,
      lastError: undefined,
    };
  },
  created() {
    this.n = this.FacetsConfig.LIMIT_DEFAULT;
    this.facets = this.FacetsConfig.FACETS;
    const facetsList = {};
    _.each(this.facets, function (facet) {
      facetsList[facet.field] = {};
    });
    this.facetStore = facetsList;
  },
  mounted() {
    console.log(window.location.href);
    this.o = 0;
    this.queryRunning = true;
    this.setTextQuery(this.textQuery);
    this.setResourceTypeQuery("all");
    this.setSearchExactMatch(this.exact);
    
    let paramString = window.location.href.split("?")[1];
    let queryString = new URLSearchParams(paramString);
    for (let pair of queryString.entries()) {
      if (pair[0] === "q") continue;
      if (pair[0] === "resourceType" && pair[1] == "all") continue;
      if (pair[0] === "searchExactMatch") continue;
      this.toggleFilter(pair[0], pair[1], true);
    }

    let queryObj = this.getQueryObj();

    if (this.hasMicroCache(queryObj.uuid)) {
      console.log("lru has " + queryObj.uuid);
      this.search();
    }
  },
  methods: {
    ...mapMutations(["setTextQuery", "setResourceTypeQuery", "setSearchExactMatch"]),
    ...mapActions(["getResults", "getQueryTemplate", "addtoMicroCache"]),
    
    updateYearRange(start, end) {
      this.$set(this.filtersState.filters, "startYear", [start]);
      this.$set(this.filtersState.filters, "endYear", [end]);
      this.filter();
    },
    
    getQueryObj: function () {
      let activeFilters = [];
      let queryObj = {
        textQuery: this.textQuery,
        limit: this.n,
        offset: this.o,
        searchExactMatch: this.searchExactMatch,
        resourceType: this.resourceType,
        filters: activeFilters,
      };
      let string2uuid = JSON.stringify(queryObj);
      let uuid = uuidv5(string2uuid, uuidv5.URL);
      return { uuid: uuid, query: queryObj };
    },
    
    newTextSearch: function () {
      this.queryRunning = true;
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
    },

    search: function () {
      let queryObj = this.getQueryObj();
      this.feedBackItemId = "search?q=" + queryObj.query?.textQuery;
      this.queryRunning = false;
      
      // Use Vuex results directly - this is the key change
      this.items = this.results;
      
      this.initFacetCounts();
      this.filter();
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

      _.each(items, function (item) {
        _.each(facets, function (facet) {
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
            }
          }
        });
      });
      
      // Sort facets
      _.each(facetStore, function (facetData, facettitle) {
        var sorted = _.keys(facetStore[facettitle]).sort();
        if (facetSortOption && facetSortOption[facettitle]) {
          sorted = _.union(facetSortOption[facettitle], sorted);
        }
        var sortedstore = {};
        _.each(sorted, function (el) {
          sortedstore[el] = facetStore[facettitle][el];
        });
        facetStore[facettitle] = sortedstore;
      });
    },

    filter: function () {
      const self = this;
      let facets = this.facets;
      let activeFilters = this.filtersState.filters;
      
      // Start with items from Vuex store (which may already be filtered by depth)
      self.currentResults = this.results;

      // Filter by active facet filters
      _.each(activeFilters, function (filtervalues, filter) {
        if (_.isEmpty(filtervalues)) {
          return;
        }
        
        self.currentResults = _.filter(self.currentResults, function (item) {
          if (_.isArray(item[filter])) {
            return _.intersection(filtervalues, item[filter]).length > 0;
          } else {
            return _.contains(filtervalues, item[filter]);
          }
        });
      });

      // Update facet counts based on filtered results
      _.each(facets, function (facet) {
        _.each(self.facetStore[facet.field], function (facetData, facetitem) {
          facetData.count = 0;
        });
      });

      _.each(self.currentResults, function (item) {
        _.each(facets, function (facet) {
          if (_.isArray(item[facet.field])) {
            _.each(item[facet.field], function (facetitem) {
              if (self.facetStore[facet.field][facetitem]) {
                self.facetStore[facet.field][facetitem].count++;
              }
            });
          } else {
            if (
              item[facet.field] &&
              self.facetStore[facet.field][item[facet.field]]
            ) {
              self.facetStore[facet.field][item[facet.field]].count++;
            }
          }
        });
      });

      // Sort results
      if (self.filtersState.orderBy === "name") {
        self.currentResults = _.sortBy(self.currentResults, function (item) {
          return item.name;
        });
      } else if (self.filtersState.orderBy === "pubname") {
        self.currentResults = _.sortBy(self.currentResults, function (item) {
          return item.publisher;
        });
      } else if (self.filtersState.orderBy === "date") {
        self.currentResults = _.sortBy(self.currentResults, function (item) {
          return item.datePublished;
        });
      }
    },

    order: function (orderBy) {
      this.filtersState.orderBy = orderBy;
      this.filter();
    },

    toggleFilter: function (facetKey, facetValue, isActive) {
      if (isActive) {
        this.filtersState.filters[facetKey] =
          this.filtersState.filters[facetKey] || [];
        this.filtersState.filters[facetKey].push(facetValue);
      } else {
        this.filtersState.filters[facetKey] = _.without(
          this.filtersState.filters[facetKey],
          facetValue
        );
      }
      
      if (this.facetStore[facetKey] && this.facetStore[facetKey][facetValue]) {
        this.facetStore[facetKey][facetValue].isActive = isActive;
      }
      
      this.filter();
    },

    clearFilters: function () {
      const self = this;
      _.each(this.filtersState.filters, function (filtervalues, filter) {
        _.each(filtervalues, function (value) {
          if (self.facetStore[filter] && self.facetStore[filter][value]) {
            self.facetStore[filter][value].isActive = false;
          }
        });
      });
      this.filtersState.filters = {};
      
      // Also reset depth filter in Vuex
      if (this.$store.state.allResults && this.$store.state.allResults.length > 0) {
        this.$store.commit('resetFilters');
      }
      
      this.filter();
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.sidebar {
  @include media-breakpoint-down(md) {
    margin: {
      bottom: $spacer * 2;
    }
  }
}
</style>