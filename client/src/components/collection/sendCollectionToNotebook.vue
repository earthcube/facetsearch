<template>
  <b-button v-on:click.stop="getCollectionJson(collectionName)" v-hi
            :disabled="disableCollectionBtn"
  >Collection To Notebook</b-button>
</template>

<script>
import {mapActions, mapState} from "vuex";
import _ from "lodash";
//import FacetsConfig from "../../config";

export default {
  name: "sendCollectionToNotebook",
  props: ["collectionName" ],
  computed: {
    ...mapState(['FacetsConfig'])

  },
  data: function()  {
    return {
      // ==========
      // NB PROXY EXAMPLE
      // =================
      // nbconfig:  {
      //   name:'binder',
      //   badge:"https://img.shields.io/badge/-Binder-579ACA.svg?logo=data:image/png;base64,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",
      //   baseurl:"http://localhost:5000/mknb",
      //   binderEncodeParameters: false,
      // //  dispatcherPage:"urlpath=notebooks/template.ipynb", // missing, so undefined detedted in code
      //
      //   contentQuery:'collection=${collection}',
      //   pageTemplate:"nb=${notebooktorun}",
      //
      //
      // },
      //=================
      // binder example direct
      // =============
      nbconfig:  {
        name:'binder',
        badge:"https://img.shields.io/badge/-Binder-579ACA.svg?logo=data:image/png;base64,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",
        baseurl:"https://mybinder.org/v2/gh/earthcube/NotebookTemplates.git/geocodes_template",
        binderEncodeParameters: true,
        dispatcherPage:"urlpath=notebooks/collection.ipynb",

        contentQuery:'collection=${collection}',
        pageTemplate:"nb=${notebooktorun}",


      },
      disableCollectionBtn: false,
    }
  },
  //  beforeUpdate() {
  //   this.collectionHasItems()
  // },
  methods:{
    ...mapActions(['getItemsForCollection']),
    // can't get this to work. tried mounted, created, beforeUpdate. Never gets updated after first laod.
    // async collectionHasItems(){
    //   let  coll =  await this.getItemsForCollection(this.collectionName)
    //   if ( coll.datasets?.length ===0 &&  coll.queries?.length ===0 &&  coll.tools?.length ===0 )
    //   {
    //     this.disableCollectionBtn = true
    //     this.obscurePage = false;
    //     this.$bvToast.toast(`Add a dataset, query and/or tool to the collection: ` , {
    //       title: "No Objects in Collection",
    //
    //       solid: true,
    //       appendToast: false
    //     })
    //   } else {
    //     this.disableCollectionBtn = false
    //   }
    //
    //
    // },
    async getCollectionJson( collName){
      let  coll = await this.getItemsForCollection(collName)
      console.log(coll)
      if (coll.datasets?.length ==0 && coll.queries?.length ==0 && coll.tools?.length ==0){
        this.obscurePage = false;
        this.$bvToast.toast(`Cannot send to a notebook. Please add a dataset, query and/or tool to the collection: ` , {
          title: "No Objects in Collection",

          solid: true,
          appendToast: false
        })
        return
      }
      let url = this.nbBinderUrl(this.nbconfig,coll)
      // do as a post  https://stackoverflow.com/questions/5684303/javascript-window-open-pass-values-using-post
      window.open(url, "Notebook", "status=0,title=0,height=600,width=800,scrollbars=1");
      // var mapForm = document.createElement("form");
      // mapForm.target = "Notebook";
      // mapForm.method = "POST"; // or "post" if appropriate
      // mapForm.action = url;
      //
      // var mapInput = document.createElement("input");
      // mapInput.type = "hidden";
      // mapInput.name = "collection";
      // mapInput.value = JSON.stringify( await coll);
      // mapForm.appendChild(mapInput);
      //
      // document.body.appendChild(mapForm);
      //
      // let map = window.open("", "Notebook", "status=0,title=0,height=600,width=800,scrollbars=1");
      //
      // if (map) {
      //   mapForm.submit();
      // } else {
      //   alert('You must allow popups for this map to work.');
      // }
    },

    nbBinderUrl ( NbConfig,  collectionObj, page=''){
      let ds =  collectionObj?.datasets.map( d => d.g)
      let qs = collectionObj?.queries.map(q => q.name)
      let ts = collectionObj?.tools.map(t => t.g)

      let urncollection = {
        description: collectionObj.description,
        datasets: ds,
        queries: qs,
        tools: ts,

      }


      //let collection = JSON.stringify(collectionObj)
      let collection = JSON.stringify(urncollection)
      collection  = collection.replace('#',"<hash>")
      collection = encodeURIComponent(collection)



      //ALl configured in the data block... needs to be moved to the FacetsConfig
      const serverBase = NbConfig.baseurl
      let dispatcherPage =NbConfig.dispatcherPage

      const nbParamsT =_.template(NbConfig.contentQuery, this.FacetsConfig.ES_TEMPLATE_OPTIONS)
      const nbPageT =_.template(NbConfig.pageTemplate, this.FacetsConfig.ES_TEMPLATE_OPTIONS)

      let nbParams = nbParamsT({collection:collection})
      let nbPage = nbPageT({notebooktorun:page})
      let params = ''
      if (Object.prototype.hasOwnProperty.call(NbConfig,'dispatcherPage')) {
        params = `${dispatcherPage}&${nbParams}&${nbPage}`
      } else {
        params = `${nbParams}&${nbPage}`
      }

      if (NbConfig.binderEncodeParameters) {
        // this uses a ? to append parmeters to the page, rather than and ampersand.
        // for binder. template page (template.ipnb?.... so that it works.)
        let params2 = `?${nbParams}&${nbPage}` // double encode
        // params2 = encodeURIComponent(params2)
        if (Object.prototype.hasOwnProperty.call(NbConfig,'dispatcherPage')) {
          params = `${dispatcherPage}${params2}`
        }

      }
      return `${serverBase}?${params}`

    },
  },
}
</script>



<style scoped>

</style>
