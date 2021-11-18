<template>
  <b-container fluid="md">
    <b-row>
      <b-col md="3" class="sidebar">

      </b-col>
      <b-col md="4">
 <list>

 </list>
      </b-col >
    </b-row>
  </b-container>
</template>

<script>
// https://matthiashager.com/complete-vuejs-application-tutorial/localstorage-vuejs#aeb433212d1

import list from './list'
export default {
  name: "cart",
  components: {
    list,

  }
}
</script>

<style scoped>

</style>
