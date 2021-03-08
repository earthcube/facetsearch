<template>
  <div >

     <ResultItem v-for="item in currentResults" v-bind:key="item.row" :item="item">
     </ResultItem>


  </div>
</template>

<script>
import ResultItem from "./ResultItem";

export default {
name: "Results",
  props: ["currentResults"],
  components: {
    ResultItem
  },

  // data() {
  // var items;
  //   return {
  //     items
  //   }
  // }
}
</script>

<style scoped>

</style>
