<template>
<div class="row w-100">
<div class="row w-100">
  <b-input-group prepend="Sort By:" class="col-4 ">
  <b-form-select

      v-model="orderBy"
      :options="orderByOptions"
      value-field="field"
      text-field="title"
      disabled-field="notEnabled"
  ></b-form-select>
  </b-input-group>

  <div class="my-2" >{{currentCount}} &nbsp;   selected of &nbsp; {{totalCount}} results</div>

  <b-input-group class="col-3" prepend="Result Limit:">
    <b-form-select

        v-model="limit"
        :options="limitOptions"
        value-field="value"
        text-field="title"
        disabled-field="notEnabled"
    ></b-form-select>
  </b-input-group>
  <b-btn class="ml-auto" ref="deselect" v-on:click="deselect" >Clear All Filters</b-btn>
</div>

  <div class="row w-100" v-for="f in Object.keys(filters)" v-bind:key="f">
    <b-badge class="m-2" v-for=" applied in filters[f]" v-bind:key="applied">

      {{f}}/{{applied}}
    </b-badge>
  </div>
</div>
</template>

<script>
import FacetsConfig from '../../config.js'

export default {
name: "ResultHeader",
  inject: ["clearFilters", "order","setResultLimit"],
  props: {
  "totalCount": Number,
    "currentCount":Number,
   "sortOptions": Object,
    "filters": Object
   },
  watch:{
    orderBy: 'orderByChanged',
    limit: 'limitChanged'
  },
  data(){
  return {
    orderBy: FacetsConfig.ORDER_BY_DEFAULT,
    orderByOptions : FacetsConfig.ORDER_BY_OPTIONS,//{field:'name', title: 'Name', sort: 'asc' },
    limit: FacetsConfig.LIMIT_DEFAULT,
    limitOptions: FacetsConfig.LIMIT_OPTIONS,
  }
  }

   ,
methods: {
  deselect(){

    this.clearFilters()
  },
  orderByChanged(){
    this.order(this.orderByOptions.find(o=> o.field = this.orderBy) )
  },
  limitChanged(){
    this.setResultLimit(this.limit)
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
 }

}
</script>

<style scoped>

</style>
