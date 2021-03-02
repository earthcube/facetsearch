<template>
<div id="facets" v-on:facetupdate="warn('Form cannot be submitted yet.', $event)" >
 <Facet v-for="facetSetting in facets" v-bind:key="facetSetting.title"
        v-bind:facetSetting="facetSetting"
        v-bind:facetStore="facetStore2"
        v-bind:state="state">
        </Facet>
<!--  <Facet v-for="facetkey in Object.keys(facetStore2)" v-bind:key="facetkey"-->
<!--         v-bind:facetSetting="facets.find( (obj) => obj.field === facetkey)"-->
<!--         v-bind:facetStore="facetStore2" >-->
<!--  </Facet>-->
</div>
</template>

<script>
import Facet from "./Facet";
export default {
name: "Facets",
  components: {
  Facet
  },
  props: {"facetStore":Object,
  "facets":Array,
  "state":Object},
  data: function() {
  return {
    facetStore2: this.facetStore,
  }
  },
  methods: {
   updateFacets(){
    this.$forceUpdate();
  }
}
}
</script>

<style scoped>

</style>
