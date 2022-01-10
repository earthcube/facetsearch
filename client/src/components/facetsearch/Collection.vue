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
          <div class="mt-3">
            <!-- list of results -->
            <div v-for="item in this.collections"
                 v-bind:key="item.row"
                 :item="item">
              <b-card tag="article" class="rounded-0"
                      v-on:click="showDetails"
                      v-bind:class="['type_' + item.resourceType.toLowerCase()]"
              >
                <!--        <router-link  :to="linkTo()">-->
                <b-card-title class="name" v-html="item.name">
                </b-card-title>
                <!--        </router-link>-->
                <b-card-title class="publisher" v-if="item.pubname" v-html="item.pubname"></b-card-title>

                <b-card-text class="description small mb-2" v-if="item.description" v-html="item.description"></b-card-text>

              </b-card>

            </div>
            <!--    <ResultItem-->
            <!--        v-for="item in this.collections"-->
            <!--        v-bind:key="item.row"-->
            <!--        :item="item"-->
            <!--        :state="state"-->
            <!--    ></ResultItem>-->
          </div>

          <!--                    <b-button variant="outline-primary" class="mt-5">Load More</b-button>-->
        </b-col>
      </b-row>
    </b-overlay>
  </b-container>


</template>

<script>
// import Vue from 'vue'
// import {mapState} from "vuex";
import Facets from "./Facets";
import localforage from 'localforage';
import FacetsConfig from "../../config";
import _ from "underscore";
import Vue from "vue";

export default {
  name: "Collection.vue",
  components: {
    Facets,
  },
  data () {
    return {
      collections: [],
      facetStore: {},
      //---- ok to edit facets
      facets: FacetsConfig.FACETS,
    }
  },

  // computed: { ...mapState ([ 'collections'])},
  mounted() {
    this.initFacetCounts();
    var self = this
    var colls = []
    localforage.iterate(function(value, key) {
      // Resulting key/value pair -- this callback
      // will be executed for every item in the
      // database.
      console.log([key, value]);
      colls.push(value)
      // Vue.set(self.collections, self.collections.length, value)
    }).then(function() {
      console.log('Iteration has completed');
      self.collections = colls
    }).catch(function(err) {
      // This code runs if there were any errors
      console.log(err);
    });
  },
  methods:{
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
  },
}
</script>

<style scoped>

</style>