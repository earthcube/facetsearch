<template>
  <div>
    <b-card>
      <b-card-title>FacetSearch Config</b-card-title>
      <vue-json-pretty class="text-left " :show-line="true" :deep="2" :data="config"/>

    </b-card>
   <b-card>
     <b-card-title>API Facetserch Config (From
       "API_URL":</b-card-title>
     <vue-json-pretty class="text-left " :show-line="true" :deep="2" :data="serverConfig"/>

   </b-card>
  </div>
</template>

<script>
import FacetsConfig from '../config'
import axios from "axios";
import VueJsonPretty from 'vue-json-pretty';

export default {
  name: "configuration",
  components:{ VueJsonPretty},
  data() {
    return {
      config: FacetsConfig,
      serverConfig: {},

    }
  },
  async mounted(){
    var self = this
    axios.get(FacetsConfig.API_URL+"/config").then(function (response) {
      self.serverConfig = response.data
    }).catch(function (err) {
      console.log(err)
    })
  }
}
</script>

<style scoped>

</style>
