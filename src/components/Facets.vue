<template>
<div id="facets">
 <Facet v-for="facetSetting in settings.facets" v-bind:key="facetSetting.title"
        v-bind:facetSetting="facetSetting"
        v-bind:settings="settings" >
        </Facet>
</div>
</template>

<script>
import Facet from "./Facet";
export default {
name: "Facets",
  components: {
  Facet
  },
  props: {"settings":Object, },
  // data: function() {
  // return {
  //   settingsData: this.settings,
  // }
  // }
}
</script>

<style scoped>

</style>
