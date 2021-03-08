<template>
<div class="row col-12">
<div ><span>{{currentCount}} </span> <span>  selected of </span> <span>{{totalCount}} results</span></div>
</div>
</template>

<script>
export default {
name: "ResultHeader",
  props: {
  "totalCount": Number,
    "currentCount":Number,
   "sortOptions": Object
   }
}
</script>

<style scoped>

</style>
