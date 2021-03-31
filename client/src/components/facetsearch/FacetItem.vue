<template>
  <div  class="facetitem row"  v-bind:class="{ activeFacet: isActive}">
    <!-- wrapping in a span mucks with event. child noted as clicked. -->
<!--   <span>{{ term }}</span> -->
    {{ term }}
    <b-badge variant="light" class="ml-auto" > {{  count }} </b-badge>
  </div>
</template>

<script>


export default {
  name: "FacetItem",
  props: ['facetSetting',"term", "count", "isActive"],

computed:{


},
  methods: {

}
}
</script>

<style scoped>

.activeFacet{
  font-weight: bold;
}

</style>
