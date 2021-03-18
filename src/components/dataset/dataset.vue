<template>
<div class="row col-12">
  <div class="row col-12">
    <Metadata class="col-9 border" ></Metadata>
    <DatasetLocation class="col-3"
     ></DatasetLocation>
  </div>
 <div class="row col-12">
   <connected-tools  :op="o"></connected-tools>
 </div>
</div>
</template>

<script>
import Metadata from "./metadata.vue";
import DatasetLocation from "./datasetLocation.vue";
import ConnectedTools from "./connectedTools.vue";
//import {getJsonLD} from '../../api/jsonldObject.js'
//import axios from "axios";
import { mapState,mapActions} from 'vuex'

export default {
name: "dataset",
  components: {ConnectedTools, DatasetLocation, Metadata},
  props:{
   o: String,
  },
  data(){ return {
    //jsonLdobj: {},
    //jsonLoaded: true,
  }},
  async mounted() {

    this.$store.dispatch('fetchJsonLd', this.o)
  },
  // watch: {
  //   // call again the method if the route changes
  //   '$route': 'fetchJsonLD'
  // },
  computed: { ...mapState (['jsonLdObj', 'jsonLdCompact'])

  },
  methods: {...mapActions([
      'fetchJsonLd',]),

    // getJsonLD(this.o).then(
    //     function(response) {
    //       self.jsonLdobj= response
    //     // self.$set( self.jsonLdobj , response)
    //       self.jsonLoaded = true
    //     }).catch(
    //         function(err){
    //           console.log("cannot fetch resource"+ err.toString())
    //           self.jsonLoaded = false
    //         }
    // )

  }



}
</script>

<style scoped>

</style>
