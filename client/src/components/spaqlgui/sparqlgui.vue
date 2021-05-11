<template>
  <b-container>
    <b-row class="title_row">
    <b-col md="12">
      <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
    </b-col>
   </b-row>
   <div ref="sparqlyasgui" />
  </b-container>
</template>

<script>
import Yasgui from "@triply/yasgui";
import "@triply/yasgui/build/yasgui.min.css";

export default {
  name: "sparqlgui",
  data(){
    return {
      yasgui: {}
    }
  },
  async mounted( ){
    let s = this.$refs.sparqlyasgui
    this.yasgui = new Yasgui(s);
  }

}
</script>

<style scoped>

</style>


