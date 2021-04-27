<template>
    <div class="buttons">
        <b-button block size="sm" variant="primary" class="p-3 text-left"
            v-for="(d, index) in mapping.s_downloads"
            v-bind:key="index"
            v-bind:href="d.contentUrl"
        >
            {{d.linkName}}
            <b-icon icon="download" class="ml-3" aria-hidden="true"></b-icon>
        </b-button>
    </div>
</template>

<script>
//import jsonld from "jsonld";
//import _ from 'lodash'
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
      }
    }
  },
  mounted() {
 //   this.toMetadata();
  },
  computed: { ...mapState ([ 'jsonLdObj','jsonLdCompact'])

  },

  methods: {
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
