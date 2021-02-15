<template>
  <div id="app">
    <navHeader></navHeader>
    <Search title="Welcome to Your Vue.js App" :n="10" :o="0"/>
  </div>
</template>

<script>
import Search from './components/Search.vue'
import navHeader  from './components/navHeader.vue'


export default {
  name: 'App',
  components: {
    Search,
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
@import 'assets/bootstrapcss/_bootswatch.scss'; // after import bootstrap
@import '~bootstrap-vue/src/index.scss';


#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
