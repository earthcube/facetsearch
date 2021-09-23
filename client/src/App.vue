<template>
  <div id="app" class="pb-5">
    <navHeader></navHeader>

    <router-view></router-view>
    <div  class="fixed-bottom float-right font-weight-lighter" > Version: {{$store.getters.appVersion}} Date: {{$store.getters.appDate}} {{NODE_ENV}} </div>
  </div>
</template>

<script>
//import Search from './components/facetsearch/Search.vue'
import FacetsConfig from './config'
import navHeader  from './components/navHeader.vue'
//import Landing from "./components/landing/landing.vue";


export default {
  name: 'App',
  data() {
    return {
      NODE_ENV: FacetsConfig.NODE_ENV
     }
  },
  components: {
 //   Landing,
 //   Search,
    navHeader
  }
}
</script>

<style lang="scss">
// Import custom SASS variable overrides, or alternatively
// define your variable overrides here instead
//spacelab from https://github.com/thomaspark/bootswatch
@import 'assets/bootstrapcss/_variables.scss';

// Import Bootstrap and BootstrapVue source SCSS files
@import '~bootstrap/scss/bootstrap.scss';
//@import 'assets/bootstrapcss/_bootswatch.scss'; // after import bootstrap
@import '~bootstrap-vue/src/index.scss';


#app {
//  -webkit-font-smoothing: antialiased;
//  -moz-osx-font-smoothing: grayscale;
}
</style>
