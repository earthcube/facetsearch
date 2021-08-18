<template>
    <div class="buttons">
      <b-button-group v-for="(dl, index) in mapping.s_downloads"
                      v-bind:key="index">
        <b-button block size="sm" variant="primary" class="p-3 text-left"

            v-bind:href="dl.contentUrl"
        >
            {{dl.linkName}}
            <b-icon icon="download" cla ss="ml-3" aria-hidden="true"></b-icon>
        </b-button>
        <b-button-group vertical class="ml-1">
          <b-button   size="sm" variant="primary"

          >Open in</b-button>
                  <b-button v-show="nbBinderShow(nb,dl.contentUrl,dl.encodingFormat)"  size="sm" variant="primary"
                             v-for="(nb, nbindex) in notebooksservers"
                             v-bind:key="nbindex"
                            v-bind:href="nbBinderUrl(nb,dl.contentUrl,dl.encodingFormat,d)"
                             target="_blank"
                  >

                    <b-img :src="nb.badge" width="64" ></b-img>
                  </b-button>
        </b-button-group>
      </b-button-group>
    </div>
</template>

<script>
import FacetsConfig from '../../config.js'

//import jsonld from "jsonld";
import _ from 'lodash'
import { schemaItem,getDistributions} from '../../api/jsonldObject.js'
import {mapState} from "vuex";

export default {
  name:  "Downloadfiles",

  // props:{
  //   jsonLdobj: Object,
  // },
  watch:{
    jsonLdCompact:'toMetadata'
  },
  props : {d: String}, // itemurn
  data() {
    return {
     // jsonldObj : this.$store.state.jsonLdObj,
      mapping: {
        s_name: '',
        s_description: '',
        s_url: '',
        s_downloads: [],
        s_identifier_doi: '',
        has_s_url: false,
        downloads: [],
        s_distribution: '',
      },
      binderBadge: "https://img.shields.io/badge/-Binder-579ACA.svg?logo=data:image/png;base64,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"
      ,notebooksservers: FacetsConfig.NOTEBOOKS
    }
  },
  mounted() {
 //   this.toMetadata();
  },
  computed: { ...mapState ([ 'jsonLdObj','jsonLdCompact'])

  },

  methods: {
    nbBinderShow(NbConfig, contentUrl,format

    ){
      let show = true
      // format = encodeURIComponent(format)
      //let binderBase = "https://mybinder.org/v2/gh/earthcube/NotebookTemplates.git/geocodes_template"

      //let nbParams = `?contenturl=${contentUrl}&format=${format}&urn=${urn}`
      //const binderBaseT = _.template(NbConfig.baseurl, FacetsConfig.ES_TEMPLATE_OPTIONS)
      //const dispatcherPageT = _.template(NbConfig.dispatcherPage, FacetsConfig.ES_TEMPLATE_OPTIONS)
      const datatypes = NbConfig.formats ? NbConfig.formats : ['*']

      if (Array.isArray(datatypes)){
        if (datatypes.includes('*')) return true

      //   let hasValue = _.find(datatypes, (dt) =>format === dt)
        let hasValue = _.indexOf(datatypes, format)
        if (hasValue>-1) show = true
        else show = false
      } else {
        if (datatypes==='*') return true
        if (datatypes === format) show = true
      }

      return show

    },
    nbBinderUrl(NbConfig, contentUrl,format,urn
        , page=''
    ){
     // format = encodeURIComponent(format)
      //let binderBase = "https://mybinder.org/v2/gh/earthcube/NotebookTemplates.git/geocodes_template"

      //let nbParams = `?contenturl=${contentUrl}&format=${format}&urn=${urn}`
      //const binderBaseT = _.template(NbConfig.baseurl, FacetsConfig.ES_TEMPLATE_OPTIONS)
      //const dispatcherPageT = _.template(NbConfig.dispatcherPage, FacetsConfig.ES_TEMPLATE_OPTIONS)
      const serverBase = NbConfig.baseurl
      let dispatcherPage =NbConfig.dispatcherPage

      const nbParamsT =_.template(NbConfig.contentQuery, FacetsConfig.ES_TEMPLATE_OPTIONS)
      const nbPageT =_.template(NbConfig.pageTemplate, FacetsConfig.ES_TEMPLATE_OPTIONS)

      let nbParams = nbParamsT({contentUrl:contentUrl,format:format,urn:urn})
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
        //params = `${dispatcherPage}${params2}`
        //params = encodeURIComponent(params)
       // params =encodeURIComponent(dispatcherPage)
      }
      return `${serverBase}?${params}`

    },
    toMetadata() {
      var self =this;
      var mapping = this.mapping;
      console.log(self.jsonLdObj )
      //const context = {};
      // const compacted = jsonld.compact(obj, context).then(sC, fC);
     // const compacted = jsonld.compact(content, context).then((providers) => {
     //  jsonld.compact(self.jsonLdObj, context).then((providers) => {
     //    var j = JSON.stringify(providers, null, 2);
        var j = JSON.stringify(self.jsonLdCompact, null, 2);
        var jp = JSON.parse(j);
        console.log(j.toString());
        mapping.raw_json = jp;
        //const detailsTemplate = [];
        // detailsTemplate.push(html`<h3>Digital Document metadata</h3>`);
        mapping.s_name = schemaItem('name', jp);
        mapping.s_url = schemaItem('url', jp);

        mapping.s_distribution = schemaItem('distribution', jp);

        mapping.s_downloads = getDistributions(mapping.s_distribution, this.s_url)
        // let downloadsurl = contentUrl ? contentUrl : distUrl;
        // this.s_downloads = [{
        //     distType: dist_type,
        //     contentUrl: downloadsurl,
        //     encodingFormat: encodingFormat
        // }]



        //   if (jp["https://schema.org/description"] || jp["http://schema.org/description"]) {
        //     detailsTemplate.push(html`
        //                   <details>
        //                       <summary>JSON-LD Object</summary>
        //                       <pre>${j}</pre>
        //                   </details>`);
        //   } else detailsTemplate.push(html`
        //               <div>No object available</div>`);
        // }

     // }) // end jsonld compact then
    }
  }
}
</script>

<!-- unscoped to override json-view white-space:nowrap -->
<style >
.value-key {
  white-space:normal !important
}
</style>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

.buttons {
    .btn {
        display: flex;
        justify-content: space-between;
        align-items: center;

        line: {
            height: 130%;
        }

        @include word-wrap();
    }

    @include media-breakpoint-down(md) {
        .btn {
            padding: {
                top: ($spacer * 1.4) !important;
                bottom: ($spacer * 1.4) !important;
            }
        }
    }
}

</style>
