<template>
  <b-container fluid="md">
    <b-overlay :show="obscurePage" rounded="sm">
      <b-row class="title_row">
        <b-col md="12">
          <back-button />
          <feedback
            class="float-right"
            subject="Dataset"
            :name="mapping.s_name"
            :urn="d"
          ></feedback>
        </b-col>
      </b-row>
      <h4 class="page_title" v-html="mapping.s_name"></h4>
      <b-row>
        <b-col md="8">
          <div class="metadata">
            <div class="label">Type</div>
            <div class="value">
              <b-icon
                font-scale="2"
                class="mr-1"
                shift-v="-2"
                :icon="'data' == 'data' ? 'server' : 'tools'"
                :variant="'data' == 'data' ? 'data' : 'tool'"
              ></b-icon>
              <b-badge variant="data" class="mr-1 mb-1">Data</b-badge>
            </div>
          </div>

          <div class="metadata">
            <div class="label">Abstract</div>
            <div class="value" v-html="mapping.s_description"></div>
          </div>

          <div v-if="mapping.s_contributor" class="metadata">
            <div class="label">Creator</div>
            <div v-if="!Array.isArray(mapping.s_contributor)" class="value">
              {{ mapping.s_contributor }}
            </div>
            <div v-if="Array.isArray(mapping.s_contributor)" class="value">
              <div v-for="i in mapping.s_contributor" :key="i">
                {{ i }}
              </div>
            </div>
          </div>

          <div v-if="mapping.s_publisher" class="metadata">
            <div class="label">Publisher</div>
            <div class="value">{{ mapping.publisher }}</div>
          </div>

          <div v-if="mapping.s_datePublished" class="metadata">
            <div class="label">Date</div>
            <div class="value">{{ mapping.s_datePublished }}</div>
          </div>

          <div v-if="mapping.has_citation" class="metadata">
            <div class="label">Citation</div>
            <div class="value">{{ mapping.s_citation }}</div>
          </div>
          <div
            v-if="mapping.s_variableMeasuredNames.length > 0"
            class="varaibles"
          >
            <div class="label">Variables Measured</div>
            <div class="value">
              <span v-for="vm in mapping.s_variableMeasuredNames" :key="vm">
                <b-badge class="mr-1" variant="light"> {{ vm }}</b-badge>
              </span>
            </div>
          </div>

          <div v-if="mapping.s_downloads || mapping.s_url" class="metadata">
            <div class="label">Links</div>
            <div class="value">
              <!--                        <div style="font-weight:600;">Object URL text/plain; application=magic-tsv</div>-->

              <!--                        <div><a href="#">https://earthref.org/MagIC/3484</a></div>-->
              <!--                        <div><a href="#">https://earthref.org/MagIC/download/3484/magic_contribution_348415032.txt</a></div>-->
              <!--                        <div><a href="#">https://earthref.org/MagIC/download/9843/magic_contribution_176534821.txt</a></div>-->
              <div v-if="mapping.s_url">
                <div style="font-weight: 600">URL from JSON-LD</div>
                <div>
                  <a :href="mapping.s_url" target="_blank">
                    {{ mapping.s_url }}
                  </a>
                </div>
              </div>

              <div v-for="i in mapping.s_downloads" :key="i.name">
                <div style="font-weight: 600">Distribution: {{ i.name }}</div>
                <!-- do we want this? -->
                <div
                  v-if="i.encodingFormat && i.name !== i.encodingFormat"
                  style="font-weight: 600"
                >
                  {{ i.encodingFormat }}
                </div>
                <div>
                  <a target="_blank" :href="i.contentUrl">{{ i.contentUrl }}</a>
                </div>
              </div>
            </div>
          </div>

          <div class="metadata mt-4">
            <div class="label"></div>
            <citationButton class="value buttons"></citationButton>
            <!--                    <b-button variant="outline-secondary">Website</b-button>-->
          </div>

          <!-- TODO remove this or change to new structure -->
          <!--   <Metadata style="display: none;"></Metadata> -->
        </b-col>

        <b-col md="4">
          <DatasetLocation :m="mapping"></DatasetLocation>

          <b-card>
            <b-card-title>Downloads</b-card-title>
            <downloadfiles :d="d" :m="mapping"></downloadfiles>
          </b-card>
        </b-col>
      </b-row>

      <connected-tools :d="d"></connected-tools>

      <relatedData :d="d"></relatedData>
      <sampleInfo></sampleInfo>
      <annotation></annotation>

      <!-- TODO move this into a component if keeping for final public view -->
      <b-row>
        <b-col md="12">
          <b-button v-b-toggle.collapse_json variant="outline-secondary">
            <!--            <b-icon icon="code-slash" class="mr-1"-->
            <!--            ></b-icon>-->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-code-slash"
              viewBox="0 0 16 16"
            >
              <path
                d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0"
              />
            </svg>
            Metadata
          </b-button>

          <b-collapse id="collapse_json" ref="metadataview" class="mt-2">
            <b-card>
              <!-- TODO remove inline style attributes -->
              <vue-json-pretty
                class="text-left"
                :show-line="true"
                :deep="2"
                :data="mapping.raw_json"
              />
            </b-card>
          </b-collapse>
        </b-col>
      </b-row>
    </b-overlay>
  </b-container>
</template>

<script>
//import Metadata from "./metadata.vue";
import DatasetLocation from "@/components/dataset/datasetLocation.vue";
import ConnectedTools from "@/components/dataset/connectedTools.vue";
import Downloadfiles from "@/components/dataset/downloadfiles.vue";
import relatedData from "@/components/dataset/relatedData.vue";
import sampleInfo from "@/components/dataset/igsnSampleList.vue";
import annotation from "@/components/dataset/annotation.vue";
import feedback from "@/components/feedback/feedback.vue";
import citationButton from "@/components/dataset/citationButton.vue";
import backButton from "@/components/backButton.vue";
//import {JSONPath} from "jsonpath-plus";

//import {getJsonLD} from '../../api/jsonldObject.js'
//import jsonld from "jsonld";
//import axios from "axios";
import { mapState, mapActions } from "vuex";
import _ from "lodash";
import {
  geoplacename,
  getDistributions,
  getFirstGeoShape,
  getGeoCoordinates,
  hasSchemaProperty,
  schemaItem,
  frameJsonLD,
} from "../../api/jsonldObject";
//import {JSONView} from "vue-json-component";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
//import axios from "axios";
//import toast from 'bootstrap-vue'

export default {
  compatConfig: {
    MODE: 2, // opt-in to Vue 3 behavior for this component only
  },

  name: "Dataset",
  components: {
    sampleInfo,
    ConnectedTools,
    DatasetLocation,
    //  Metadata,
    Downloadfiles,
    // "json-view": JSONView,
    VueJsonPretty,
    relatedData,
    annotation,
    feedback,
    citationButton,
    backButton,
  },
  props: {
    d: String,
  },
  data() {
    return {
      obscurePage: false,
      doiUrl: "",
      mapping: {
        s_name: "",
        s_description: "",
        s_url: "",
        s_contributor: "",
        s_datePublished: "",
        s_sdPublisher: "",
        s_citation: "",
        has_citation: "",
        s_keywords: [],
        s_landingpage: "",
        s_downloads: [],
        s_identifier: "",
        details: {},
        raw_json: "",
        html_name: "",
        publisher: "",
        description: "",
        s_publisher: "",
        s_publishedDate: "",
        has_s_url: false,
        downloads: [],
        s_distribution: "",
        s_variableMeasuredNames: [],
        s_doiurl: "",
        doi_citation: "", // s_ is schema... doi_citation not a schema element
        doi_metadata: "",
        s_spatialCoverage: false,
        placenames: "",
        box: "",
        poly: "",
        points: [],
      },
      //jsonLdobj: {},
      //jsonLoaded: true,
    };
  },
  watch: {
    jsonLdObj: "toMetadata",
    "$route.params.d": function (d) {
      this.obscurePage = false;
      // should get fanche and overlay a loading... then remove loading in toMetadata
      this.$store.dispatch("fetchJsonLd", d);
    },
  },
  async mounted() {
    // async created() {
    this.$store.commit("setJsonLd", {});
    this.$store.commit("setJsonLdCompact", {});
    this.obscurePage = true;
    this.$store
      .dispatch("fetchJsonLd", this.d)
      .then(() => {
        this.obscurePage = false;
      })
      .catch((ex) => {
        this.obscurePage = false;
        this.$bvToast.toast(
          `This is probably an issue with stale data, or bad identifier: ` + ex,
          {
            title: "No JSONLD Metadata Found",

            solid: true,
            appendToast: false,
          }
        );
      });
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
  computed: {
    ...mapState(["jsonLdObj", "jsonLdCompact"]),
  },
  methods: {
    ...mapActions(["fetchJsonLd"]),
    scrollToMetadata() {
      const element = this.$refs.metadataview;

      if (element) {
        // Use el.scrollIntoView() to instantly scroll to the element
        // el.scrollIntoView({behavior: 'smooth'});
        var top = element.$el.offsetHeight;

        window.scrollTo(0, top);
      }
    },
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
      var jp = self.jsonLdObj; // framed dataset
      if (JSON.stringify(jp) === "{}") return;

      // console.log(j.toString());
      // if ( jp['@graph'] ){
      //  // jp = JSONPath({path: "$.'@graph'.[?(@type === 'dataset')]", json:jp});
      //   jp = jp['@graph'].filter(a => {
      //     if (a['@type']) {
      //      return _.includes(a['@type'], 'https://schema.org/Dataset')
      //     }
      //   })
      //   if (jp.length > 0) {
      //     jp = jp[0]
      //   }
      //
      // }

      //       let datasetFrame = JSON.parse(`
      // {
      //   "@context": {
      //     "@vocab": "https://schema.org/",
      //         "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      //         "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      //         "schema": "https://schema.org/",
      //         "xsd": "http://www.w3.org/2001/XMLSchema#"
      //   },
      //   "@type": "schema:Dataset"
      // }` )
      // jsonld.frame(jp, datasetFrame).then(
      frameJsonLD(jp, "Dataset").then((jp) => {
        if  (jp === undefined) return;
        mapping.raw_json = jp;
        //mapping.s_identifier_doi = schemaItem('identifier', jp);//self.getDOIUrl()
        // ------
        // address retrieval in the  schemItem class, rather than do 20 changes here.
        // ---
        mapping.s_identifier = jp.identifier; // schemaItem('identifier', jp);// just the identifier... do not know if it is a DOI

        mapping.s_name = jp.name; // schemaItem('name', jp);
        mapping.s_url = jp.url; // schemaItem('url', jp);
        mapping.s_description = jp.description; // schemaItem('description', jp);

        mapping.s_distribution = jp.distribution; // schemaItem('distribution', jp);

        if (hasSchemaProperty("datePublished", jp)) {
          mapping.s_datePublished = schemaItem("datePublished", jp);
        } else if (hasSchemaProperty("datePublished", mapping.s_distribution)) {
          // in distribution
          mapping.s_datePublished = schemaItem(
            "datePublished",
            mapping.s_distribution
          );
        } else if (hasSchemaProperty("dateCreated", jp)) {
          mapping.s_datePublished = schemaItem("dateCreated", jp);
        }
        if (hasSchemaProperty("publisher", jp)) {
          var p = schemaItem("publisher", jp);
          if (hasSchemaProperty("name", p)) {
            mapping.publisher = schemaItem("name", p);
          } else if (hasSchemaProperty("legalName", p)) {
            mapping.publisher = schemaItem("legalName", p);
          } else {
            mapping.publisher = "Publsher Quirkiness. Please alert us";
          }
        } else {
          mapping.publisher = schemaItem("sdPublisher", jp);
        }
        //this.s_contributor = schemaItem('contributor', jp);
        if (hasSchemaProperty("contributor", jp)) {
          var c = schemaItem("contributor", jp);
          if (Array.isArray(c)) {
            mapping.s_contributor = c.map(function (obj) {
              if (hasSchemaProperty("name", obj)) {
                return schemaItem("name", obj) + ", ";
              }
            });
            console.log("contributor " + mapping.s_contributor);
          } else {
            mapping.s_contributor = schemaItem("name", c);
          }
        }
        if (hasSchemaProperty("creator", jp)) {
          var cr = schemaItem("creator", jp);
          if (Array.isArray(cr)) {
            mapping.s_contributor = cr.map(function (obj) {
              if (hasSchemaProperty("name", obj)) {
                return schemaItem("name", obj) + ", ";
              }
            });
            console.log("contributor" + mapping.s_contributor);
          } else {
            mapping.s_contributor = schemaItem("name", cr);
          }
        }
        // else {
        //     this.s_contributor = schemaItem('contributor', jp);
        // }

        if (hasSchemaProperty("citation", jp)) {
          mapping.s_citation = schemaItem("citation", jp);
          mapping.has_citation = false;
        }
        mapping.s_keywords = schemaItem("keywords", jp);
        mapping.s_landingpage = schemaItem("description", jp);
        //var s_distribution = schemaItem('distribution', jp); // moved up
        // var dist_type = s_distribution['@type'];
        // var encodingFormat = schemaItem('encodingFormat', s_distribution);
        // var contentUrl = schemaItem('contentUrl', s_distribution);
        // var distUrl = schemaItem('url', s_distribution);
        mapping.s_downloads = getDistributions(
          mapping.s_distribution,
          this.s_url
        );
        // let downloadsurl = contentUrl ? contentUrl : distUrl;
        // this.s_downloads = [{
        //     distType: dist_type,
        //     contentUrl: downloadsurl,
        //     encodingFormat: encodingFormat
        // }]
        mapping.s_spatialCoverage = schemaItem("spatialCoverage", jp);
        mapping.placename = geoplacename(mapping.s_spatialCoverage);
        mapping.box = getFirstGeoShape(mapping.s_spatialCoverage, "box");
        mapping.poly = getFirstGeoShape(mapping.s_spatialCoverage, "polygon");
        mapping.points = getGeoCoordinates(mapping.s_spatialCoverage);
        console.info(
          `placename:${mapping.placename} box:${mapping.box} poly:${mapping.poly} points:${mapping.points}`
        );

        let variableMeasured = schemaItem("variableMeasured", jp);
        if (variableMeasured) {
          mapping.s_variableMeasuredNames = variableMeasured.map((item) =>
            _.truncate(schemaItem("name", item), {
              length: 80,
              omission: "***",
            })
          );
        }
        if (
          JSON.stringify(jp) !== "{}" &&
          (mapping.s_name === undefined || mapping.s_name === "")
        ) {
          console.log("json issue");

          this.$bvToast.toast(`See Metadata for item description`, {
            title: "JSON Parse or Render Issue",

            solid: true,
            appendToast: false,
          });
        }
        // show
        this.obscurePage = false;
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

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
      color: rgba($white, 0.95);
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
        color: rgba($gray-300, 0.95);
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
      top: $spacer * 0.4;
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
          padding: ($spacer * 0.8) ($spacer * 2);
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
      top: $spacer * 0.4;
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
    white-space: nowrap;
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
