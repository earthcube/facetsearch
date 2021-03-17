<template>
<div class="col-6">
 <b-form @submit="onSubmit" @reset="onReset" >
<b-form-group >
  <b-input id="q" name="q" type="search" placeholder="Search" aria-label="Search">
    <b-button id="update" >
      <img src="/public/img/search.174272f3.svg" width="32" height="32" title="Search" />
    </b-button>
  </b-input>
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

export default {
name: "landing",
  data(){
  return {
    toolOptionsSelected:[],
    toolOptions:[
      {item: 'all', name:"All"},
      {item: 'tool', name:"Tool"},
      {item: 'data', name:"Data"}
    ]


  }
  }
}
</script>

<style scoped>

</style>
