<template>
<div class="row col-12">
  <div class="row col-12">
    <ToolMetadata class="col-9 border" ></ToolMetadata>

  </div>

</div>
</template>

<script>
import ToolMetadata from "./toolMetadata";

//import {getJsonLD} from '../../api/jsonldObject.js'
//import axios from "axios";
import { mapState,mapActions} from 'vuex'

export default {
name: "dataset",
  components: {ToolMetadata},
  props:{
   o: String,
  },
  data(){ return {
    //jsonLdobj: {},
    //jsonLoaded: true,
  }},
  async mounted() {

    this.$store.dispatch('fetchToolJsonLd', this.o)
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
