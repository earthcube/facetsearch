<template>
  <div class="mr-2" >
    <div class="row h4 mr-2" v-if="hasTools">Connected Tools</div>

      <div v-if="downloadTools.length >0" class="row h6 ">Downloadable:</div>
      <!-- ?rrs ?name ?curl ?landingPage -->
      <div class="row" v-for="i in downloadTools" v-bind:key="i.index">
        <a class="ml-3" :href="i.landingPage.value">{{ i.name.value }}</a>
<!--        <a class="ml-auto" :href=" i.rrs.value ">Tool Metadata</a>-->
        <router-link  :to="{ name: 'tool', params: { o: i.rrs.value } }">Tool Metadata</router-link>
      </div>


      <div v-if="webserviceTools.length >0" class="row h6 ">Web Applications:</div>
      <!--  ?dataname ?appname   ?durl  ?turl ?rrs -->
      <div class="row" v-for="i in webserviceTools" v-bind:key="i.index">
        <a class="ml-3"  :href="i.durl.value">{{ i.appname.value }} for {{ i.dataname.value }} </a>
<!--        <a class="ml-auto" :href=" i.rrs.value ">Tool Metadata</a>-->
        <router-link  class="ml-auto" :to="{ name: 'tool', params: { o: i.rrs.value } }">Tool Metadata</router-link>
      </div>


  </div>
</template>

<script>
import {mapActions, mapState} from "vuex";
import SpaqlToolsDownloadQuery from 'raw-loader!../../sparql/sparql_gettools_download.txt'
import SpaqlToolsWebserviceQuery from 'raw-loader!../../sparql/sparql_gettools_webservice.txt'
import _ from "underscore";

import FacetsConfig from "../../config";
import axios from "axios";

let esTemplateOptions = FacetsConfig.ES_TEMPLATE_OPTIONS

export default {
  name: "connectedTools",
  props: {
    g: {type: String, default: ''}
  },
  data() {
    return {
      downloadTools: [],
      webserviceTools: [],
      hasTools: false,
    }
  },
  watch: {
    jsonLdCompact: 'checkTools',

  }, computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact'])

  },
  methods: {
    ...mapActions([
      'hasConnectedTools']),
    checkTools() {
      //let graphUri = this.op.replaceAll("/", ":").replace('.jsonld', "");
      //graphUri = "urn:gleaner:milled"+ graphUri
      let graphUri = this.g
      this.hasConnectedTools(graphUri).then(i => this.hasTools=i)
      this.getDownloadableTools(graphUri)
      this.getWebTools(graphUri)
    }
    , getWebTools(graphUri) {
      var self = this
      const resultsTemplate = _.template(SpaqlToolsWebserviceQuery, esTemplateOptions)
      // const resultsTemplate = _.template(SpaqlToolsDownloadQuery, esTemplateOptions)
      let hasToolsQuery = resultsTemplate({g: graphUri});

      var url = FacetsConfig.TRIPLESTORE_URL;
      var params = {
        query: hasToolsQuery
      }

      const config = {
        url: url,
        method: 'get',
        headers: {
          'Accept': 'application/sparql-results+json',
          'Content-Type': 'application/json'
        },
        params: params
      }
      console.log('webtools:query:')
      console.log(params["query"]);
      axios.request(config).then(function (response) {
        //self.webserviceTools =  response.data.results.bindings
        var bindings = response.data.results.bindings
        let index = 0;
        bindings.forEach((i) => (i.index = 'wtool-'+index++));

        self.webserviceTools = bindings
      })
    }
    , getDownloadableTools(graphUri) {
      var self = this;
      const resultsTemplate = _.template(SpaqlToolsDownloadQuery, esTemplateOptions)
      let hasToolsQuery = resultsTemplate({g: graphUri});

      var url = FacetsConfig.TRIPLESTORE_URL;
      var params = {
        query: hasToolsQuery
      }

      const config = {
        url: url,
        method: 'get',
        headers: {
          'Accept': 'application/sparql-results+json',
          'Content-Type': 'application/json'
        },
        params: params
      }
      console.log('donwloadtools:query:' + params["query"]);
      axios.request(config).then(function (response) {
        // self.downloadTools = response.data.results.bindings
        var bindings = response.data.results.bindings
        let index = 0;
        bindings.forEach((i) => (i.index = 'dtool-'+index++));
        self.downloadTools = bindings


      })
    }
  }
}
</script>

<style scoped>

</style>
