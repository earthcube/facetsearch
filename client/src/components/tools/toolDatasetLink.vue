<template>
  <div v-if="matchedDatasetReturned">
    <div class="row">
     <div class="font-weight-bold font-heavy my-2">YOU ARRIVED VIA THIS DATASET </div>

      <div class=" my-2">(FUTURE) Actions for dataset (Just links for now): </div>
    </div>

<div class="row" >

    <div class="border rounded col-5"
         v-for="i in matchedDatasetDistributions" v-bind:key="i.name"
    >
      <div class="tool_info pr-3">
        <h6 class="tool_title text-primary">
          <div class="row small " >
            <b-icon class="mr-1 col-1" icon="tools" variant="tool"></b-icon>
           <span class="col-3">Dataset </span> <span class="font-heavy ml-4" v-html="mapping.s_name">   </span>
          </div>

          <div class="row tool_subtitle small text-secondary">
            <span class="col-4 font-heavy mr-2">Distribution Name:</span><span class="col-4">{{ i.linkName }}</span></div>
        </h6>
        <div >{{matchEncoding(i.encodingFormat)}}</div>
      </div>

      <div class="buttons mt-3">
        <b-button variant="outline-primary" v-on:click.stop="openWindow( i.contentUrl )">{{ i.contentUrl }}</b-button>
      </div>
    </div>
  </div>

  </div>
</template>

<script>
//import jsonld from "jsonld";
//import _ from 'lodash'
import {
  schemaItem,
  hasSchemaProperty,
  matchDistributions,
 // getFirstGeoShape,
 // geoplacename,
  getDistributions,
 // getGeoCoordinates
} from '../../api/jsonldObject.js'
import {mapState} from "vuex";
//import {JSONView} from "vue-json-component";

export default {
  name: "tool-dataset-link",
  components: {
//    "json-view": JSONView
  },
  props:{
    d: String,
    ef : Array,
  },
  watch: {
    jsonLdCompact: 'toMetadata'
  },

  data() {
    return {
      // jsonldObj : this.$store.state.jsonLdObj,
      matchedDatasetDistributions: [],
      matchedDatasetReturned: false,
      mapping: {
        s_name: '',
        s_description: '',
        s_url: '',
        s_contributor: '',
        s_datePublished: '',
        s_sdPublisher: '',
        s_citation: '',
        has_citation: '',
        s_keywords: [],
        s_landingpage: '',
        s_downloads: [],
        s_identifier_doi: '',
        details: {},
        raw_json: '',
        html_name: '',
        publisher: '',
        description: '',
        s_publisher: '',
        s_publishedDate: '',
        has_s_url: false,
        downloads: [],
        s_distribution: '',
        s_distribution_encodingFormats: []
      }
    }
  },
  mounted() {
   // this.$store.dispatch('fetchJsonLd', this.d)
    this.fetchJsonLd( this.d)
  },
  computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact'])

  },

  methods: {
  openWindow(url) {
    window.open(url, '_blank');
  },
    matchEncoding(e){
    if (Array.isArray(this.ef)) {
      this.ef.find(i => e === i)
    }
    },
    toMetadata() {
      var self = this;
      var mapping = this.mapping;
      var toolEncodingFormats = this.ef
      //console.log(self.jsonLdObj)
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
      mapping.s_description = schemaItem('description', jp);

      mapping.s_distribution = schemaItem('distribution', jp);
      this.matchedDatasetDistributions = matchDistributions(mapping.s_distribution, toolEncodingFormats)
      if (this.matchedDatasetDistributions.length >0 ){
        this.matchedDatasetReturned = true
      } else {
        this.matchedDatasetReturned = false
      }

      if (hasSchemaProperty('datePublished', jp)) {
        mapping.s_datePublished = schemaItem('datePublished', jp);
      } else if (hasSchemaProperty('datePublished', mapping.s_distribution)) { // in distribution
        mapping.s_datePublished = schemaItem('datePublished', mapping.s_distribution);
      } else if (hasSchemaProperty('dateCreated', jp)) {
        mapping.s_datePublished = schemaItem('dateCreated', jp);
      }


      mapping.s_downloads = getDistributions(mapping.s_distribution, this.s_url)

    }
  }
}
</script>

<!-- unscoped to override json-view white-space:nowrap -->
<style>
.value-key {
  white-space: normal !important
}
</style>

<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';

.connected_tools {
@include media-breakpoint-down(md) {
  margin: {
    top: $spacer;
  }
  padding: {
    top: $spacer;
  }
}
}

.tools {
  padding: 0px !important;

.tool {
  position: relative;
  cursor: pointer;

  display: inline-flex;
  justify-content: space-between;

  width: calc(50% - 24px);

  margin: $spacer / 2;
  padding: $spacer;

border: {
  top: 10px solid $gray-300 !important;
}

&.collapsed .when_closed,
&.not-collapsed .when_open {
   display: none;
 }

&:hover {
border: {
  color: $primary !important;
}
}
}

.tool_info {
}

.buttons {
}

.tool_title {
font: {
  weight: 600; //semi-bold
}
}

.metadata_link {
  display: inline-block;
  cursor: pointer;

margin: {
  left: -($spacer / 2);
}
padding: ($spacer / 5) ($spacer / 2);

text: {
  decoration: underline;
}
}

@include media-breakpoint-down(md) {
  padding: 0px;

  .tool {
    display: block;
    width: auto;

  background: {
    color: $gray-100;
  }

  margin: ($spacer * 2) 0px $spacer 0px;
  padding: {
    bottom: $spacer * 1.5;
  }
}

.buttons {
margin: {
  top: $spacer / 2;
}

.btn {
  display: block;
  width: 100%;

  padding: ($spacer * .75) $spacer;
}
}
}
}
</style>

