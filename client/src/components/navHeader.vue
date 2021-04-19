<template>
  <b-navbar type="dark" variant="primary">
    <b-navbar-brand  href="https://www.earthcube.org/">
      <img src="../assets/EarthCube-White-Long-Tagline.png" height="30"
           class="d-inline-block align-top" alt="EarthCube" loading="lazy">

    </b-navbar-brand>
    <!-- -->
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>


    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav >
        <b-nav-item  :to="{ name: 'landing'}">Home</b-nav-item>
        <keep-alive>
          <!--            <b-nav-item  :to="{ name: 'Search', query: { q: 'water' } }">Search</b-nav-item>-->
          <b-nav-item  :to="{ name: 'Search', query:{q:q}}">Search</b-nav-item>
        </keep-alive>
        <!--        <b-nav-item  :to="{ name: 'dataset', params: { o: '/lipdverse/509e465d0793506b237cea8069c3cb2d276fe9c2.jsonld' } }">Dataset</b-nav-item>-->
        <b-nav-item   :to="{ name: 'dataset'}" @click="console.log('click')" >Dataset</b-nav-item>
        <b-nav-item   :to="{ name: 'tool' }" @click="console.log('click')">Tool</b-nav-item>
      </b-navbar-nav>


<b-navbar-nav class="col-4">
        <b-nav-form v-on:submit.prevent="onSubmitNavbar" >
        <b-form-input v-model="textQuery" type="search" id="q-textbox"
                      placeholder="Search" aria-label="Search"></b-form-input>
        <b-button class="my-2 my-sm-0" type="submit" >
            <img src="../assets/icons/search.svg" alt="" width="32" height="32" title="Search">
        </b-button>
        <b-form-input style="visibility: hidden" id="nn" type="number" min="5" max="200" step="5" value="20"/>
      </b-nav-form>
</b-navbar-nav>
      <b-nav-text class="font-weight-bold ml-auto">GeoCODES
        <span class="font-weight-normal font-italic">Find and use geosciences data and tools</span>
      </b-nav-text>

      <b-navbar-nav class="ml-auto">
        <b-nav-item  href="https://graph.geodex.org/blazegraph/#query">SPARQL Endpoint</b-nav-item>
          <b-nav-item  href="about.html" target="_blank">Help</b-nav-item>

      </b-navbar-nav>


    </b-collapse>
  </b-navbar>
</template>

<script>
import {mapState} from "vuex";
//import navBarToLink from "@/components/navBarToLink";

export default {
name: "navHeader",
//  components: {navBarToLink} ,
  computed: {
    ...mapState(['results','searchExactMatch', 'q'])

  },
  watch:{
  q: 'qUpdated'
  },
  data() {
  return {
    textQuery:'',
  }
  },
  methods:{
  qUpdated() {
    this.textQuery = this.q
  },
    onSubmitNavbar(){
      this.$store.state.q = this.textQuery;
      this.$router.push({name: 'Search', query:{q:this.q} }).catch(err => {console.log('ignore'+err)})
    },
  }
}
</script>

<style scoped>

</style>
