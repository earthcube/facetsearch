<template>
  <div  class="facetitem" >
    <!-- wrapping in a span mucks with event. child noted as clicked. -->
<!--   <span>{{ term }}</span> -->
    {{ term }}
    <b-badge variant="light" class="ml-auto" > {{  count }} </b-badge>
  </div>
</template>

<script>
export default {
  name: "FacetItem",
  props: ['facetSetting',"term", "count"],

  methods: {
//     /**
//      * The given facetname and filtername are activated or deactivated
//      * depending on what they were beforehand. This causes the items to
//      * be filtered again and the UI is updated accordingly.
//      */
//     _handleClick(event){
//       var filter = getFilterById(this.id);
//       toggleFilter(filter.facetname, filter.filtername);
//       $(settings.facetSelector).trigger("facetedsearchfacetclick", filter);
//       order();
//       updateFacetUI();
//       updateResults();
//     },
//     /**
//      * get a facetname and filtername by the unique id that is created in the beginning
//      */
//     getFilterById(id) {
//   var result = false;
//   _.each(facetStore, function(facet, facetname) {
//     _.each(facet, function(filter, filtername){
//       if (filter.id == id) {
//         result =  {'facetname': facetname, 'filtername': filtername};
//       }
//     });
//   });
//   return result;
// }
}
}
</script>

<style scoped>

</style>
