<template>
<div class="row col-12">
<div ><span>{{currentCount}} </span> <span>  selected of </span> <span>{{totalCount}} results</span></div>
</div>
</template>

<script>
export default {
name: "ResultHeader",
  props: {
  "items": Array,
    "currentResults":Array,
   "sortOptions": Object
   }
   ,
  data() {
  return {
    currentCount:  this.currentResults ?  this.currentResults.length : 0,
    totalCount: this.totalCount ? this.totalCount.length : 0
  }
  }

}
</script>

<style scoped>

</style>
