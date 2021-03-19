<template>
  <div class="row justify-content-center">
    <div class="col-8">
      <div class="my-4 py-4">

        <img src="img/geocodes.png" height="66"/>
      </div>
      <b-form @submit="onSubmit" @reset="onReset" class="w-80">
        <b-input-group>
          <b-input v-model="q" id="q" name="q" type="search" placeholder="Search" aria-label="Search">

          </b-input>
          <b-button id="update" :to="{name: 'Search', query:{q: q} }">
            <img src="/img/search.174272f3.svg" title="Search"/>
          </b-button>
        </b-input-group>
        <b-form-group>
          <b-form-checkbox-group v-model="toolOptionsSelected"
                                 :options="toolOptions"
                                 value-field="item"
                                 text-field="name">

          </b-form-checkbox-group>
        </b-form-group>

      </b-form>
    </div>
  </div>
</template>

<script>
//import VueRouter from 'vue-router'

export default {
  name: "landing",
  data() {
    return {
      q: '',
      toolOptionsSelected: [],
      toolOptions: [
        {item: 'all', name: "All"},
        {item: 'tool', name: "Tool"},
        {item: 'data', name: "Data"}
      ]


    }
  },
  methods: {
    onSubmit() {
      var query = this.q;
      this.$router.push({name: 'Search', query: {q: query}})
    },
    onReset() {
      this.q = ''
    }
  }
}
</script>

<style scoped>

</style>
