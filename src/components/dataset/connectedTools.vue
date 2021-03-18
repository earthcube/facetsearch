<template>
  <div>
    <div v-if="hasTools">Connected Tool</div>
    <div v-for="i in downloadTools" v-bind:key="i.rrs +i.name">
      {{ i.rrs }} {{ i.name }}
    </div>
    <div v-for="i in webserviceTools" v-bind:key="i.dataname + i.appname">
      {{ i.dataname }} {{ i.appname }}
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
    op: {type:String, default:''}
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
      let graphUri = this.op.replaceAll("/", ":").replace('.jsonld',"");
      this.hasTools= this.hasConnectedTools(graphUri)
      this.getDownloadableTools(graphUri)
      this.getWebTools(graphUri)
    }
    , getWebTools(graphUri) {
      var self = this
     const resultsTemplate = _.template(SpaqlToolsWebserviceQuery, esTemplateOptions)
      // const resultsTemplate = _.template(SpaqlToolsDownloadQuery, esTemplateOptions)
      let hasToolsQuery = resultsTemplate({op: graphUri});

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
      console.log( params["query"]);
      axios.request(config).then(function (response) {
        self.webserviceTools =  response.data.results.bindings


      })
    }
    , getDownloadableTools(graphUri) {
      var self = this;
      const resultsTemplate = _.template(SpaqlToolsDownloadQuery, esTemplateOptions)
      let hasToolsQuery = resultsTemplate({op: graphUri});

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
        self.downloadTools = response.data.results.bindings


      })
    }
  }
}
</script>

<style scoped>

</style>
