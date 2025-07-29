<template>
  <b-container fluid="md" class="result_header mt-3">
    <b-row justify-content-md-center>
      <b-col sm class="text-nowrap p-1 ml-2 bd-highlight">
        {{ currentCount }} &nbsp; selected of &nbsp; {{ totalCount }} results
      </b-col>
      <b-col>
        <b-button
          class="ml2-auto badges mt-2"
          variant="primary"
          size="sm"
          @click="addQueryToCollection"
          >Save Query</b-button
        >
      </b-col>
    </b-row>
    <b-row align-v="center">
      <b-col sm class="text-nowrap">
        <b-input-group prepend="Sort By:" size="sm">
          <b-form-select
            v-model="orderBy"
            :options="orderByOptions"
            value-field="field"
            text-field="title"
            disabled-field="notEnabled"
          ></b-form-select>
        </b-input-group>
      </b-col>

      <!--
            <b-col sm>
                <b-form-checkbox v-model="searchExact" name="Match All Terms" switch>Match All Terms</b-form-checkbox>
            </b-col>
-->
      <b-col sm class="ml-auto">
        <b-input-group prepend="Result Limit:" size="sm" class="text-nowrap">
          <b-form-select
            v-model="limit"
            :options="limitOptions"
            value-field="modelValue"
            text-field="title"
            disabled-field="notEnabled"
          ></b-form-select>
        </b-input-group>
      </b-col>
    </b-row>


    <div v-if="Object.keys(filters).length > 0" class="mt-3">
      <span
        v-for="f in Object.keys(filters)"
        :key="f"
        align-v="center"
        class="filters"
      >
<!--        <b-badge-->
<!--          v-for="applied in consolidateFilter(f)"-->
<!--          :key="applied"-->
<!--          variant="info"-->
<!--          class="m-1"-->
<!--        >-->
<!--          &lt;!&ndash;{{ f }} / &ndash;&gt;{{f}}:{{ applied }}-->
<!--        </b-badge>-->
        <b-badge

            :key="'applied'+key"
            variant="info"
            class="m-1"
        >
          {{f}}:{{consolidateFilter(f)}}
        </b-badge>
      </span>

      <b-button
        ref="deselect"
        variant="link"
        size="sm"
        class="ml2-auto"
        @click="deselect"
        ><b-icon icon="x"></b-icon>Clear All Filters</b-button
      >
    </div>
  </b-container>
</template>

<script>
/* NOTE HACK
https://github.com/bootstrap-vue/bootstrap-vue/issues/7182#issuecomment-1811521156
 <b-input-group prepend="Result Limit:" size="sm" class="text-nowrap">
                    <b-form-select
                        v-model="limit"
                        :options="limitOptions"
                        value-field="modelValue"
                        text-field="title"
                        disabled-field="notEnabled"
                    ></b-form-select>
                </b-input-group>

 */
//import FacetsConfig from '../../config.js'
import { mapState } from "vuex";
//import {bus} from "@/main"; //vue3
import localforage from "localforage";
import {isProxy,toRaw} from "vue";
//import {mapState} from "vuex";

export default {
  // compatConfig: {
  //   MODE: 3, // opt-in to Vue 3 behavior for this component only
  //
  // },
  name: "ResultHeader",
  inject: [
    "clearFilters",
    "order",
    "setResultLimit",
    "isRangeFilter",
    //   , "setSearchExactmatch"
  ],
  computed: {
    ...mapState(["searchExactMatch", "FacetsConfig", "searchExactMatch", "q"]),
  },
  props: {
    totalCount: Number,
    currentCount: Number,
    sortOptions: Object,
    filters: Object,
  },
  watch: {
    orderBy: "orderByChanged",
    limit: "limitChanged",
    searchExact: "searchExactChanged",
  },
  data() {
    return {
      orderBy: "score",
      orderByOptions: [], //{field:'name', title: 'Name', sort: 'asc' },
      limit: 100,
      limitOptions: [10, 50, 100, 1000],
      searchExact: this.searchExactMatch,
    };
  },
  mounted() {
    this.orderBy = this.FacetsConfig.ORDER_BY_DEFAULT;
    this.orderByOptions = this.FacetsConfig.ORDER_BY_OPTIONS; //{field:'name', title: 'Name', sort: 'asc' },
    this.limit = this.FacetsConfig.LIMIT_DEFAULT;
    this.limitOptions = this.FacetsConfig.LIMIT_OPTIONS;
  },
  methods: {
    consolidateFilter: function (key) {
      var filterValue = this.filters[key];
      // Special case: consolidate dates into unique years
      const [isRange, filterType] =this.isRangeFilter(filterValue)
      if (isRange) {
        return filterValue.range;
      }
      if (isProxy(filterValue)){
        return toRaw(filterValue)
      }
      return filterValue;
    },
    deselect() {
      this.clearFilters();
      //vue3
      //bus.$emit('facetupdate');
    },
    orderByChanged() {
      this.order(this.orderByOptions.find((o) => (o.field = this.orderBy)));
    },
    limitChanged() {
      this.setResultLimit(this.limit);
    },
    searchExactChanged() {
      // this.setSearchExactmatch(this.searchExact)
      // this.$store.state.searchExactMatch = this.searchExact
      this.searchExactMatch = this.searchExact;
    },
    //   $('.orderbyitem').each(function(){
    //   var id = this.id.substr(8);
    //   if (settings.state.orderBy == id) {
    //     $(this).addClass("activeorderby");
    //   }
    // });
    // // add the click event handler to each "order by" item:
    // $('.orderbyitem').click(function(event){
    //   var id = this.id.substr(8);
    //   settings.state.orderBy = id;
    //   $(settings.facetSelector).trigger("facetedsearchorderby", id);
    //   settings.state.shownResults = 0;
    //   order();
    //   updateResults();
    // });
    addQueryToCollection() {
      var self = this;
      this.clickToAddCollection = true;
      // var toAdd = true
      // for(var i = 0; i < this.collections.length; i++) {
      //   var item = this.collections[i]
      //   if (item.g === this.item.g) {
      //     toAdd = false
      //     break
      //   }
      // }
      //  if (!this.$store.state.q || this.$store.state.q.length === 0 ) {
      if (!this.q || this.q.length === 0) {
        return;
      }
      //let query = self.$store.state.q
      let query = self.q;
      localforage.getItem(window.location.href, function (err, value) {
        var desp = {};
        let description = "";
        let paramString = window.location.href.split("?")[1];
        let queryString = new URLSearchParams(paramString);
        // need to say this are the query facets,
        // here is a query description
        for (let pair of queryString.entries()) {
          // if(pair[0] === 'q') continue
          // if(pair[0] === 'resourceType' && pair[1] == 'all') continue
          if (!(pair[0] in desp)) {
            desp[pair[0]] = new Set();
          }
          desp[pair[0]].add(pair[1]);
          description = description + ` ${pair[0]}:${pair[1]} `;
        }
        for (const [key, dvalue] of Object.entries(desp)) {
          desp[key] = [...dvalue];
        }
        if (value === null) {
          localforage
            .setItem(window.location.href, {
              type: "query",
              collection: "unassigned",
              value: {
                name: query,
                g: window.location.href,
                url: window.location.href,
                description: desp,
              },
            })
            .then((value) => {
              console.log(
                "store: " +
                  `unassigned query ${value.value.name}  ${value.value.g}   to localstorage`
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
          value["value"]["description"] = description;
          value["value"]["query_facets"] = desp;
          value["value"]["url"] = window.location.href;
          value["value"]["g"] = window.location.href;
          localforage
            .setItem(window.location.href, value)
            .then((value) => {
              console.log(
                "store: " +
                  `existing query ${value.value.name}  ${value.value.g}   to localstorage`
              );
            })
            .catch((err) => {
              console.log(
                "oops! the account was too far gone, there was nothing we could do to save him ",
                err
              );
            });
          console.log("update to collection");
          console.log(value);
        }
      });

      // localforage.getItem(self.textQuery, function (err, value) {
      //   if (value === null) {
      //     localforage.setItem(
      //         self.textQuery,
      //         // self.item.g,
      //         self.textQuery
      //     ).then((value) => {
      //       console.log("store " + value.g + " to localstorage");
      //     }).catch((err) => {
      //       console.log('oops! the account was too far gone, there was nothing we could do to save him ', err);
      //     });
      //     console.log("add to collection");
      //   } else {
      //     // localforage.setItem(newFilename, value, function () {
      //     //   localforage.removeItem(filename, function () { return callback(); });
      //     // });
      //     console.log(value)
      //   }
      // });
      // if(toAdd) {
      //   // Vue.set(this.collections, this.collections.length, this.item)
      // }
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.filters {
}
</style>
