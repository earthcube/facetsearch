<template>
  <div  class="facetitem" >
    {{ term }}
    <b-badge variant="light" class="float-right" > {{  count }} </b-badge>
  </div>
</template>

<script>
export default {
name: "FacetItem",
  props: ["term", "count"]
}
</script>

<style scoped>

</style>
