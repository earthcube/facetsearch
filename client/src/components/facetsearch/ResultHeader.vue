<template>
    <b-container fluid="md" class="result_header mt-3">
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

            <b-col sm class="text-nowrap">
                {{ currentCount }} &nbsp; selected of &nbsp; {{ totalCount }} results
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
                        value-field="value"
                        text-field="title"
                        disabled-field="notEnabled"
                    ></b-form-select>
                </b-input-group>
            </b-col>
        </b-row>

        <b-row align-v="center" class="filters mt-2"
            v-for="f in Object.keys(filters)"
            v-bind:key="f"
        >
            <b-badge class="m-2" v-for=" applied in filters[f]" v-bind:key="applied">
                {{ f }}/{{ applied }}
            </b-badge>

            <b-btn size="sm" class="ml2-auto" ref="deselect" v-on:click="deselect">Clear All Filters</b-btn>
        </b-row>
  </b-container>
</template>

<script>
import FacetsConfig from '../../config.js'
import {mapState} from "vuex";
import {bus} from "@/main";
//import {mapState} from "vuex";

export default {
  name: "ResultHeader",
  inject: ["clearFilters", "order", "setResultLimit"
 //   , "setSearchExactmatch"
  ],
  computed: {
    ...mapState(['searchExactMatch']),
  },
  props: {
    "totalCount": Number,
    "currentCount": Number,
    "sortOptions": Object,
    "filters": Object,

  },
  watch: {
    orderBy: 'orderByChanged',
    limit: 'limitChanged',
    searchExact: 'searchExactChanged'
  },
  data() {
    return {
      orderBy: FacetsConfig.ORDER_BY_DEFAULT,
      orderByOptions: FacetsConfig.ORDER_BY_OPTIONS,//{field:'name', title: 'Name', sort: 'asc' },
      limit: FacetsConfig.LIMIT_DEFAULT,
      limitOptions: FacetsConfig.LIMIT_OPTIONS,
      searchExact: this.searchExactMatch,
    }
  }

  ,
  methods: {
    deselect() {

      this.clearFilters()
      bus.$emit('facetupdate');
    },
    orderByChanged() {
      this.order(this.orderByOptions.find(o => o.field = this.orderBy))
    },
    limitChanged() {
      this.setResultLimit(this.limit)
    },
    searchExactChanged() {
     // this.setSearchExactmatch(this.searchExact)
      this.$store.state.searchExactMatch = this.searchExact
    }
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
  }

}
</script>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

.filters {
}

</style>
