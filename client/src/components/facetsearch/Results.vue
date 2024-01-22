<template>
  <div class="mt-3" >
    <!-- list of results -->
     <ResultItem
        v-for="item in currentResults"
        v-bind:key="item.row"
        :item="item"
        :state="state"
    ></ResultItem>
  </div>
</template>

<script>
import ResultItem from "./ResultItem";
import {mapState} from "vuex";

export default {
name: "Results",
  props: ["currentResults", "state"],
  components: {
    ResultItem
  },
  computed: { ...mapState ([ 'results'])

  },
  // data() {
  // var items;
  //   return {
  //     items
  //   }
  // }
}
</script>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

</style>
