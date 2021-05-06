<template>
  <div>
    <div class="row">
     <div class="font-weight-bold font-heavy my-2">YOU ARRIVED VIA THIS DATASET </div>
      <div class="font-heavy ml-4" v-html="mapping.s_name">   </div>
      <div class=" my-2">(FUTURE) Actions for dataset (Just links for now): </div>
    </div>



    <div class="tool border rounded"
         v-for="i in mapping.s_downloads" v-bind:key="i.name"

         v-b-toggle="'collapse_' + i.index"
    >
      <div class="tool_info pr-3">
        <b-link class="small " >
          <b-icon class="mr-1" icon="tools" variant="tool"></b-icon>
          Dataset
        </b-link>

        <h6 class="tool_title text-primary">

          <div class="tool_subtitle small text-secondary">{{ i.name }}</div>
        </h6>
        <div class="small">
          <b-collapse :id="'collapse_' + i.index">
            <span class="col-4 "></span>
            <a class="col-8" target="_blank" :href="i.contentUrl">{{ i.contentUrl }}</a>
          </b-collapse>

          <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>
          <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>
        </div>
      </div>

      <div class="buttons mt-3">
        <b-button variant="outline-primary" v-on:click.stop="openWindow( i.contentUrl )">{{ i.contentUrl }}</b-button>
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
  getFirstGeoShape,
  geoplacename,
  getDistributions,
  getGeoCoordinates
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
  },
  watch: {
    jsonLdCompact: 'toMetadata'
  },

  data() {
    return {
      // jsonldObj : this.$store.state.jsonLdObj,
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
      }
    }
  },
  mounted() {
    this.$store.dispatch('fetchJsonLd', this.d)
  },
  computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact'])

  },

  methods: {
  openWindow(url) {
    window.open(url, '_blank');
  },
    toMetadata() {
      var self = this;
      var mapping = this.mapping;
      console.log(self.jsonLdObj)
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

      if (hasSchemaProperty('datePublished', jp)) {
        mapping.s_datePublished = schemaItem('datePublished', jp);
      } else if (hasSchemaProperty('datePublished', mapping.s_distribution)) { // in distribution
        mapping.s_datePublished = schemaItem('datePublished', mapping.s_distribution);
      } else if (hasSchemaProperty('dateCreated', jp)) {
        mapping.s_datePublished = schemaItem('dateCreated', jp);
      }
      if (hasSchemaProperty('publisher', jp)) {
        var p = schemaItem('publisher', jp);
        if (hasSchemaProperty('name', p)) {
          mapping.publisher = schemaItem('name', p);
        } else if (hasSchemaProperty('legalName', p)) {
          mapping.publisher = schemaItem('legalName', p);
        } else {
          mapping.publisher = 'Publsher Quirkiness. Please alert us'
        }
      } else {
        mapping.publisher = schemaItem('sdPublisher', jp);
      }
      //this.s_contributor = schemaItem('contributor', jp);
      if (hasSchemaProperty('contributor', jp)) {
        var c = schemaItem('contributor', jp);
        if (Array.isArray(c)) {
          mapping.s_contributor = c.map(function (obj) {
                if (hasSchemaProperty('name', obj)) {
                  return schemaItem('name', obj) + ", "
                }
              }
          )
          console.log('contributor ' + mapping.s_contributor)

        } else {
          mapping.s_contributor = schemaItem('name', c);
        }
      }
      if (hasSchemaProperty('creator', jp)) {
        var cr = schemaItem('creator', jp);
        if (Array.isArray(cr)) {
          mapping.s_contributor = cr.map(function (obj) {
                if (hasSchemaProperty('name', obj)) {
                  return schemaItem('name', obj) + ", "
                }
              }
          )
          console.log('contributor' + mapping.s_contributor)

        } else {
          mapping.s_contributor = schemaItem('name', cr);
        }

      }
      // else {
      //     this.s_contributor = schemaItem('contributor', jp);
      // }

      if (hasSchemaProperty('citation', jp)) {
        mapping.s_citation = schemaItem('citation', jp);
        mapping.hide_citation_tab = false;
      }
      mapping.s_keywords = schemaItem('keywords', jp);
      mapping.s_landingpage = schemaItem('description', jp);
      //var s_distribution = schemaItem('distribution', jp); // moved up
      // var dist_type = s_distribution['@type'];
      // var encodingFormat = schemaItem('encodingFormat', s_distribution);
      // var contentUrl = schemaItem('contentUrl', s_distribution);
      // var distUrl = schemaItem('url', s_distribution);
      mapping.s_downloads = getDistributions(mapping.s_distribution, this.s_url)
      // let downloadsurl = contentUrl ? contentUrl : distUrl;
      // this.s_downloads = [{
      //     distType: dist_type,
      //     contentUrl: downloadsurl,
      //     encodingFormat: encodingFormat
      // }]
      let s_spatialCoverage = schemaItem('spatialCoverage', jp)
      let placename = geoplacename(s_spatialCoverage)
      let box = getFirstGeoShape(s_spatialCoverage, 'box')
      let poly = getFirstGeoShape(s_spatialCoverage, 'polygon')
      let points = getGeoCoordinates(s_spatialCoverage)
      console.info(`placename:${placename} box:${box} poly:${poly} points:${points}`)
      //this.s_identifier_doi= ""


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

