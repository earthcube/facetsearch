<template>
<div class="col-6">
 <b-form @submit="onSubmit" @reset="onReset" >
<b-form-group >
  <b-input v-model="q" id="q" name="q" type="search" placeholder="Search" aria-label="Search">

  </b-input>
  <b-button id="update"  :to="{name: 'Search', query:{q: q} }">
  <img src="/img/search.174272f3.svg" width="32" height="32" title="Search" />
</b-button>
</b-form-group>
   <b-form-group>
     <b-form-checkbox-group v-model="toolOptionsSelected"
     :options="toolOptions"
     value-field="item"
     text-field="name">

     </b-form-checkbox-group>
   </b-form-group>

 </b-form>
</div>
</template>

<script>
//import VueRouter from 'vue-router'

export default {
name: "landing",
  data(){
  return {
    q:'',
    toolOptionsSelected:[],
    toolOptions:[
      {item: 'all', name:"All"},
      {item: 'tool', name:"Tool"},
      {item: 'data', name:"Data"}
    ]


  }
  },
  methods: {
  onSubmit(){
    var query = this.q;
    this.$router.push({name: 'Search', query:{q:query} })
  },
    onReset(){
      this.q= ''
    }
  }
}
</script>

<style scoped>

</style>
