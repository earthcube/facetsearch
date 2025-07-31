<template>
  <div class="mt-3">
    <!-- list of results -->
    <ResultItem
      v-for="item in currentResults"
      :key="item.row"
      :item="item"
      :filters="filters"
    ></ResultItem>
  </div>
</template>

<script>
import ResultItem from "@/components/facetsearch/ResultItem.vue";
import { mapState } from "vuex";

export default {
  name: "Results",
  components: {
    ResultItem,
  },
  props: ["currentResults", "filters"],
  computed: { ...mapState(["results"]) },
  // data() {
  // var items;
  //   return {
  //     items
  //   }
  // }
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";
</style>
