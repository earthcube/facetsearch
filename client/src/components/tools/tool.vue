<template>
<div class="row col-12">
  <b-btn variant="outline-info"  v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
  <div class="row col-12">
    <ToolMetadata class="col-9 border" ></ToolMetadata>

  </div>
  <div class="row col-12">
    <ToolDatasetLink v-if='d' class="col-9 border" :d="d"></ToolDatasetLink>

  </div>
</div>
</template>

<script>
import ToolMetadata from "./toolMetadata";
import ToolDatasetLink from "./toolDatasetLink";

//import {getJsonLD} from '../../api/jsonldObject.js'
//import axios from "axios";
import { mapState,mapActions} from 'vuex'

export default {
name: "dataset",
  components: {ToolMetadata, ToolDatasetLink},
  props:{
   t: String,
    d: String,
  },
  data(){ return {
    //jsonLdobj: {},
    //jsonLoaded: true,
  }},
  async mounted() {

    this.$store.dispatch('fetchToolJsonLd', this.t)
  },
  // watch: {
  //   // call again the method if the route changes
  //   '$route': 'fetchJsonLD'
  // },
  computed: { ...mapState (['toolLdObj','toolLdObjCompact'])

  },
  methods: {...mapActions([
      'fetchToolJsonLd',]),

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
