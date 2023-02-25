<template>
  <div>
    <div class="row">
      <span class="font-weight-bold font-heavy my-4" v-html="mapping.s_name">   </span>
    </div>


      <b-card no-body>
        <b-tabs card id="myTabContent">
          <b-tab title="Metadata" active id="md" aria-labelledby="md-tab">
            <div class="row">

              <span class="col-2 font-weight-bold">Type:</span>
              <span class="col-8">Data</span>
            </div>
            <div class="row">

              <span class="col-2 font-weight-bold">Abstract:</span>
              <span class="col-8" v-html="mapping.s_description">
                          </span></div>

            <div class="row">

              <span class="col-2 font-weight-bold">Creator:</span>
              <span class="col-8">
{{ mapping.s_contributor }}</span>
            </div>
            <div class="row">

              <span class="col-2 font-weight-bold">Publisher:</span>
              <span class="col-8">
{{ mapping.s_publisher }}</span>
            </div>
            <div class="row">

              <span class="col-2 font-weight-bold">Date:</span>
              <span class="col-8">
                               {{ mapping.s_publishedDate }}</span>
            </div>
          </b-tab>
          <b-tab title="Web Links" id="web" aria-labelledby="web-tab">
            <div class="row w-100">

              <span class="col-4 font-weight-bold">Name</span>
              <span class="col-8 font-weight-bold">link </span>

            </div>

            <div class="row" v-if="mapping.s_url">
              <span class="col-4">Object URL</span>
              <a class="col-8" :href="mapping.s_url" target="_blank"> {{ mapping.s_url }} </a>
            </div>

            <div class="row" v-for="i in mapping.s_downloads" v-bind:key="i.name">
              <span class="col-4 ">{{ i.name }}</span>
              <a class="col-8" target="_blank" :href="i.contentUrl">{{ i.contentUrl }}</a>
            </div>


          </b-tab>
          <b-tab title="Citation" id="cite" aria-labelledby="cite-tab">
            <div class="row">

              <span class="col-4 font-weight-bold">Citation</span>

              <a class="col-8" :href="mapping.s_citation" target="_blank">{{ mapping.s_citation }}</a>
            </div>
          </b-tab>
          <b-tab title="Dataset JSON-LD" id="json" aria-labelledby="json-tab">
            <div class="row ml-2">

              <div>JSON</div>

              <json-view class="text-left " :data="mapping.raw_json"/>
              <!-- need to modify value-key to include class text-wrap -->

            </div>
          </b-tab>
        </b-tabs>
      </b-card>
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
  getGeoCoordinates,
  frameJsonLD,
} from '../../api/jsonldObject.js'
import {mapState} from "vuex";
import {JSONView} from "vue-json-component";

export default {
  name: "metadata",
  components: {
    "json-view": JSONView
  },
  // props:{
  //   jsonLdobj: Object,
  // },
  watch: {
    jsonLdObj: 'toMetadata'
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
    //   this.toMetadata();
  },
  computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact'])

  },

  methods: {
    toMetadata() {
      var self = this;
      var mapping = this.mapping;
      // console.log(self.jsonLdObj)
      //const context = {};
      // const compacted = jsonld.compact(obj, context).then(sC, fC);
      // const compacted = jsonld.compact(content, context).then((providers) => {
      //  jsonld.compact(self.jsonLdObj, context).then((providers) => {
      //    var j = JSON.stringify(providers, null, 2);
      //var j = JSON.stringify(self.jsonLdCompact, null, 2);
      //var jp = JSON.parse(j);
      //console.log(j.toString());
      frameJsonLD(self.jsonLdObj, 'Dataset').then((jp) => {


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
      )
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

<style scoped>

</style>
