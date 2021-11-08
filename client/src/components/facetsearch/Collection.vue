<template>
  <div class="mt-3">
    <!-- list of results -->
    <div v-for="item in this.collections"
         v-bind:key="item.row"
         :item="item">
      <b-card tag="article" class="rounded-0"
              v-on:click="showDetails"
              v-bind:class="['type_' + item.resourceType.toLowerCase()]"
      >
<!--        <router-link  :to="linkTo()">-->
          <b-card-title class="name" v-html="item.name">
          </b-card-title>
<!--        </router-link>-->
        <b-card-title class="publisher" v-if="item.pubname" v-html="item.pubname"></b-card-title>

        <b-card-text class="description small mb-2" v-if="item.description" v-html="item.description"></b-card-text>

      </b-card>

    </div>
<!--    <ResultItem-->
<!--        v-for="item in this.collections"-->
<!--        v-bind:key="item.row"-->
<!--        :item="item"-->
<!--        :state="state"-->
<!--    ></ResultItem>-->
  </div>
</template>

<script>
// import Vue from 'vue'
// import {mapState} from "vuex";
import localforage from 'localforage';

export default {
  name: "Collection.vue",
  data () {
    return {
      collections: []
    }
  },

  // computed: { ...mapState ([ 'collections'])},
  mounted() {
    var self = this
    var colls = []
    localforage.iterate(function(value, key) {
      // Resulting key/value pair -- this callback
      // will be executed for every item in the
      // database.
      console.log([key, value]);
      colls.push(value)
      // Vue.set(self.collections, self.collections.length, value)
    }).then(function() {
      console.log('Iteration has completed');
      self.collections = colls
    }).catch(function(err) {
      // This code runs if there were any errors
      console.log(err);
    });
  },
}
</script>

<style scoped>

</style>