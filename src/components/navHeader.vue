<template>
  <b-navbar type="dark" variant="info">
    <b-navbar-brand  href="https://www.earthcube.org/">
      <img src="../assets/EarthCube-White-Long-Tagline.png" height="30"
           class="d-inline-block align-top" alt="EarthCube" loading="lazy">

    </b-navbar-brand>
    <!-- -->
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>


    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav >
      <b-nav-form >
        <b-form-input size="20" type="text" id="q"   placeholder="Search" aria-label="Search"></b-form-input>
        <b-button class="my-2 my-sm-0" type="submit">
            <img src="../assets/icons/search.svg" alt="" width="32" height="32" title="Search">
        </b-button>
        <b-form-input style="visibility: hidden" id="nn" type="number" min="5" max="200" step="5" value="20"/>
      </b-nav-form>


        <b-nav-item  :to="{ name: 'landing'}">Home</b-nav-item>
        <keep-alive>
            <b-nav-item  :to="{ name: 'Search', query: { q: 'water' } }">Search</b-nav-item>
        </keep-alive>
        <b-nav-item  :to="{ name: 'dataset', params: { o: '/lipdverse/509e465d0793506b237cea8069c3cb2d276fe9c2.jsonld' } }">Dataset</b-nav-item>
        <b-nav-item  href="https://graph.geodex.org/blazegraph/#query">SPARQL Endpoint</b-nav-item>
          <b-nav-item  href="about.html">Help</b-nav-item>
      </b-navbar-nav>

      <b-nav-text class="font-weight-bold ml-auto">GeoCODES
        <span class="font-weight-normal font-italic"> a schema.org/Dataset search</span>
      </b-nav-text>
    </b-collapse>
  </b-navbar>
</template>

<script>
export default {
name: "navHeader"
}
</script>

<style scoped>

</style>
