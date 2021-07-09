<template>

    <b-container fluid="md">
      <b-overlay :show="obscurePage" rounded="sm">
        <b-row class="title_row">
            <b-col md="12">
                <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
              <feedback class='float-right' subject = 'Dataset' :name="mapping.s_name" :urn="d"> </feedback>

            </b-col>

        </b-row>
        <h4 class="page_title" v-html="mapping.s_name"></h4>
        <b-row>
            <b-col md="8">
                <div class="metadata">
                    <div class="label">Type</div>
                    <div class="value">
                        <b-icon font-scale="2" class="mr-1" shift-v="-2"
                            :icon="('data' == 'data') ? 'server' : 'tools'"
                            :variant="('data' == 'data') ? 'data' : 'tool'"
                        ></b-icon>
                        <b-badge variant="data" class="mr-1 mb-1">Data</b-badge>
                    </div>
                </div>

                <div class="metadata">
                    <div class="label">Abstract</div>
                    <div class="value" v-html="mapping.s_description"></div>
                </div>

                <div class="metadata" v-if="mapping.s_contributor">
                    <div class="label">Creator</div>
                  <div class="value" v-if="! Array.isArray(mapping.s_contributor )" >{{ mapping.s_contributor }}</div>
                    <div class="value" v-if="Array.isArray(mapping.s_contributor )" >
                      <div  v-for="i in mapping.s_contributor" v-bind:key="i">{{i}}</div>
                    </div>
                </div>

                <div class="metadata" v-if="mapping.s_publisher">
                    <div class="label">Publisher</div>
                    <div class="value">{{ mapping.publisher }}</div>
                </div>

                <div class="metadata" v-if="mapping.s_datePublished">
                    <div class="label">Date</div>
                    <div class="value">{{ mapping.s_datePublished }}</div>
                </div>

                <div class="metadata" v-if="mapping.has_citation">
                    <div class="label">Citation</div>
                    <div class="value">{{mapping.s_citation}}</div>
                </div>
              <div class="varaibles" v-if="mapping.s_variableMeasuredNames.length >0">
                <div class="label">Variables Measured</div>
                <div class="value">
                  <span v-for="vm in mapping.s_variableMeasuredNames" v-bind:key="vm">
                    <b-badge class="mr-1" variant="light"> {{ vm }}</b-badge>

                    </span>
                </div>
              </div>

                <div class="metadata" v-if="mapping.s_downloads">
                    <div class="label">Links</div>
                    <div class="value">
<!--                        <div style="font-weight:600;">Object URL text/plain; application=magic-tsv</div>-->

<!--                        <div><a href="#">https://earthref.org/MagIC/3484</a></div>-->
<!--                        <div><a href="#">https://earthref.org/MagIC/download/3484/magic_contribution_348415032.txt</a></div>-->
<!--                        <div><a href="#">https://earthref.org/MagIC/download/9843/magic_contribution_176534821.txt</a></div>-->
                      <div  v-if="mapping.s_url">
                        <div style="font-weight:600;">Object URL</div>
                       <div> <a  :href="mapping.s_url" target="_blank"> {{ mapping.s_url }} </a></div>
                      </div>

                      <div  v-for="i in mapping.s_downloads" v-bind:key="i.name">
                        <div style="font-weight:600;">{{ i.name }} </div>
                        <!-- do we want this? -->
                        <div style="font-weight:600;" v-if="i.encodingFormat && (i.name !== i.encodingFormat)">{{i.encodingFormat}}</div>
                        <div>  <a  target="_blank" :href="i.contentUrl">{{ i.contentUrl }}</a> </div>
                        </div>
                    </div>
                </div>

                <div class="metadata mt-4">
                    <div class="label"></div>
                    <div class="value buttons">
<!--                    <b-button variant="outline-secondary">Website</b-button>-->
                        <b-button v-b-toggle.collapse-cite variant="outline-secondary"><b-icon icon="chat-square-quote" class="mr-1"></b-icon>Cite</b-button>

                        <b-button v-b-toggle.collapse-metadata variant="outline-secondary"><b-icon icon="code-slash" class="mr-1"></b-icon>Metadata</b-button>
                        <b-collapse id="collapse-cite" class="mt-2">
                          <b-card>
                            <!-- TODO remove inline style attributes -->
                            <vue-json-pretty class="text-left " :show-line="true" :deep="2" v-html="mapping.s_doi_citation"/>
                          </b-card>
                        </b-collapse>
                        <b-collapse id="collapse-metadata" class="mt-2">
                            <b-card>
                              <!-- TODO remove inline style attributes -->
                              <vue-json-pretty class="text-left " :show-line="true" :deep="2" :data="mapping.raw_json"/>
                            </b-card>
                          </b-collapse>
<!--                        <b-button v-b-modal.feedback-modal variant="outline-secondary" @click="showModal">Feedback</b-button>-->
<!--                        <feedback v-show="isFeedbackVisible" @close="closeModal" subject = 'dataset' :name="mapping.name" :urn="d"> </feedback>-->



<!--                        <b-button v-b-toggle.collapse_json variant="outline-secondary">Feedback</b-button>-->
<!--                        <div id="app">-->
                    </div>


                </div>


<!-- TODO remove this or change to new structure -->
             <!--   <Metadata style="display: none;"></Metadata> -->
            </b-col>

            <b-col md="4">

                    <DatasetLocation></DatasetLocation>


                <b-card>
                    <b-card-title>Downloads</b-card-title>
                    <downloadfiles></downloadfiles>
                </b-card>
            </b-col>
        </b-row>

        <connected-tools :d="d"></connected-tools>

        <relatedData :d="d" ></relatedData>
        <sampleInfo></sampleInfo>
        <annotation></annotation>


<!-- TODO move this into a component if keeping for final public view -->
        <b-row>
            <b-col md="12">
                <h5>JSON-LD Metadata</h5>

                <b-button v-b-toggle.collapse_json variant="outline-secondary">Toggle JSON-LD Metadata</b-button>

                <b-collapse id="collapse_json" class="mt-2">
                    <b-card>
<!-- TODO remove inline style attributes -->
                      <vue-json-pretty class="text-left " :show-line="true" :deep="2" :data="mapping.raw_json"/>
                    </b-card>
                </b-collapse>
            </b-col>
        </b-row>
      </b-overlay>
    </b-container>

</template>

<script>
//import Metadata from "./metadata.vue";
import DatasetLocation from "./datasetLocation.vue";
import ConnectedTools from "./connectedTools.vue";
import Downloadfiles from "./downloadfiles.vue"
import relatedData from "./relatedData.vue";
import sampleInfo from "@/components/dataset/igsnSampleList";
import annotation from "./annotation.vue";
import feedback from "../feedback/feedback";

//import {getJsonLD} from '../../api/jsonldObject.js'
//import axios from "axios";
import { mapState,mapActions} from 'vuex'
import _ from 'lodash'
import {
  geoplacename,
  getDistributions,
  getFirstGeoShape,
  getGeoCoordinates,
  hasSchemaProperty,
  schemaItem
} from "../../api/jsonldObject";
//import {JSONView} from "vue-json-component";
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import axios from "axios";


export default {
name: "dataset",
  components: {
    sampleInfo, ConnectedTools, DatasetLocation,
  //  Metadata,
    Downloadfiles,
   // "json-view": JSONView,
    VueJsonPretty,
    relatedData,
    annotation,
    feedback,
    },
  props:{
   d: String,
  },
  data(){ return {
    obscurePage: false,
    doiUrl: '',
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
      s_variableMeasuredNames:[],
      s_doiurl: '',
      s_doi_citation: '',
      s_doi_metadata: '',
    }
    //jsonLdobj: {},
    //jsonLoaded: true,
  }},
  watch:{
    jsonLdCompact: "toMetadata",
    '$route.params.d': function(d) {
      this.obscurePage = false
      // should get fanche and overlay a loading... then remove loading in toMetadata
      this.$store.dispatch('fetchJsonLd', d)
    },
  },
  async mounted() {
  // async created() {
    this.$store.commit('setJsonLd', {})
    this.$store.commit('setJsonLdCompact', {})

    this.$store.dispatch('fetchJsonLd', this.d)
   // this.$nextTick(() => this.$store.dispatch('fetchJsonLd', this.d) )
  },
  // async beforeUpdate(){
  //   this.$store.commit('setJsonLd', {})
  //   this.$store.commit('setJsonLdCompact', {})
  // },
  // async updated(){
  //   this.$store.dispatch('fetchJsonLd', this.d)
  // },
  // watch: {
  //   // call again the method if the route changes
  //   '$route': 'fetchJsonLD'
  // },
  computed: { ...mapState (['jsonLdObj', 'jsonLdCompact'])

  },
  methods: {...mapActions([
      'fetchJsonLd',]),
    toMetadata() {
      var self = this;
      var mapping = this.mapping;
      //console.log(self.jsonLdObj)
      //const context = {};
      // const compacted = jsonld.compact(obj, context).then(sC, fC);
      // const compacted = jsonld.compact(content, context).then((providers) => {
      //  jsonld.compact(self.jsonLdObj, context).then((providers) => {
      //    var j = JSON.stringify(providers, null, 2);
      // var j = JSON.stringify(self.jsonLdCompact, null, 2);
      //var jp = JSON.parse(j);
      var jp = self.jsonLdCompact;
      // console.log(j.toString());
      mapping.raw_json = jp;
      mapping.s_identifier_doi = schemaItem('identifier', jp);//self.getDOIUrl()
      if (mapping.s_identifier_doi) {
        mapping.s_identifier_doi.forEach(function(item) {
          if (item["@id"]) {
            mapping.s_doiurl = item["@id"]
          }
        })
        if (mapping.s_doiurl) {
          const config = {
            url: mapping.s_doiurl,
            method: 'get',
            headers: {
              'Accept': 'text/x-bibliography'
            },
          }
          axios.request(config).then(function (response) {
            mapping.s_doi_citation = response.data
          })
        }
      }

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

      let variableMeasured = schemaItem('variableMeasured', jp)
      if (variableMeasured) {
        mapping.s_variableMeasuredNames = variableMeasured.map(item => _.truncate(schemaItem('name', item), {
          'length': 80,
          'omission': '***'
        }))
      }

      // show
      this.obscurePage = false;
    },
  }



}
</script>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';



.card {
    background: {
        color: $gray-100;
    }

    & + .card {
        margin: {
            top: $spacer;
        }
    }

    .card-title {
        font: {
            size: 100%;
        }
    }

    //on smaller screens, remove the border and expand to fill
    @include media-breakpoint-down(md) {
        background: none;

        margin: {
            top: $spacer * 2;
        }

        border: 0px;

        & + .card {
            margin: {
                top: $spacer * 2;
            }
        }

        .card-title {
        }

        .card-body {
            padding: 0px;
        }
    }
}

.row {
    padding: {
        bottom: $spacer;
    }

    &.title_row {
        background: {
            color: rgba($white, .95);
        }

        padding: {
            top: $spacer;
        }

        &.is_sticky {
            position: sticky;
            top: 0px;
            z-index: 1010;
        }
    }

    //add a border between rows
    & + .row {
        padding: {
            top: $spacer * 1.5;
        }

        border: {
            top: 1px solid $gray-300;
        }
    }

    .page_title {
        color: $primary;

        margin: {
            top: $spacer;
        }
    }

    @include media-breakpoint-down(md) {
        &.title_row {
            background: {
                color: rgba($gray-300, .95);
            }
        }

        &:not(.title_row) {
            padding: {
                bottom: $spacer * 2.5;
            }
        }

        & + .row {
            padding: {
                top: $spacer * 2;
            }

            border: {
                width: 10px;
            }
        }

        .page_title {
            margin: {
                top: $spacer * 2;
                bottom: $spacer;
            }

            font: {
                size: 130%;
            }
        }
    }
}

.metadata {
    display: flex;
    align-items: baseline;

    font: {
        size: 90%;
    }

    & + .metadata {
        margin: {
            top: $spacer * .4;
        }
    }

    .label {
        flex-shrink: 0;

        width: 140px;

        margin: {
            right: $spacer;
        }

        font: {
            weight: bold;
            size: 80%;
        }
        text: {
            align: right;
            transform: uppercase;
        }
    }

    .value {
        flex-grow: 1;

        @include word-wrap();

        &.buttons {
            .btn {
                margin: {
                    right: $spacer / 4;
                    bottom: $spacer / 4;
                }

                border: 1px solid $secondary;

                &:hover {
                }

                & + .btn {
                }
            }

            @include media-breakpoint-down(md) {
                text: {
                    align: center;
                }

                .btn {
                    padding: ($spacer * .8) ($spacer * 2);
                }
            }
        }

        ul,
        ol {
            margin: {
                top: $spacer;
            }
        }

        b {
            font: {
                weight: 600; //semi-bold
            }
        }
    }

    @include media-breakpoint-down(md) {
        display: block;

        & + .metadata {
            margin: {
                top: $spacer;
            }
        }

        .label {
            width: auto;

            text: {
                align: left;
            }
        }
    }
}
    .varaibles {
      display: flex;
      align-items: baseline;
      font: {
        size: 90%;
      }
      & + .varaibles {
        margin: {
          top: $spacer * .4;
        }
      }
      .label {
        flex-shrink: 0;

        width: 140px;

        margin: {
          right: $spacer;
        }

        font: {
          weight: bold;
          size: 80%;
        }
        text: {
          align: right;
          transform: uppercase;
        }
      }

      .values {
        display: flex;
        white-space:nowrap;
        flex-wrap: wrap;

        .keyword {

          padding: {
            left: $spacer / 2;
          }
        }
      }
    }

i {
    color: $gray-600;

    font: {
        weight: 300;
    }
}

</style>
