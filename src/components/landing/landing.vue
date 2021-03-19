<template>
  <div>
  <div class="row justify-content-center">
    <div class="col-8">
      <div class="my-4 py-4">

        <img src="../../assets/geocodes_2021.png" height="66"/>

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
    <div class="row justify-content-center">
    <b-carousel
        id="carousel-1"
        v-model="slide"
        :interval="4000"
        no-animation


        img-width="1024"
        img-height="200"
        style="text-shadow: 1px 1px 2px #333;"

    >
      <!-- Text slides with image -->
      <b-carousel-slide img-blank  img-width="1024"
                        img-height="200">
        <h2>an interdisciplinary geoscience data and tool search engine</h2>
      </b-carousel-slide>

      <!-- Slides with custom text -->
      <b-carousel-slide img-blank  img-width="1024"
                        img-height="200">
        <h2>a schema.org/Dataset search</h2>
      </b-carousel-slide>

      <!-- Slides with image only -->
      <b-carousel-slide img-blank img-width="1024"
                        img-height="200">
        <h2>Geoscience Cyberinfrastructure for Open Discovery in the Earth Sciences</h2>
      </b-carousel-slide>
    </b-carousel>
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
,slide: 0,

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
