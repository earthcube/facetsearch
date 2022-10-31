<template>
    <b-row class="connected_tools" v-if="hasTools">
        <b-col md="12">
            <h4>Connected Tools</h4>
          <!-- web service tools -->
          <b-container class="tools" v-if="webserviceTools.length > 0 > 0">
            <h6 class="mt-4">Web Applications</h6>

            <div class="tool border rounded"
                 v-for="i in webserviceTools"
                 v-bind:key="i.index"

                 v-b-toggle="'collapse_' + i.index"
            >
              <div class="tool_info pr-3">
                <b-link class="small metadata_link" v-on:click.stop="$router.push({ name: 'tool', params: { t: i.rrs.value },  query:{ d:d} })">
                  <b-icon class="mr-1" icon="tools" variant="tool"></b-icon>
                  Tool Metadata
                </b-link>

                <h6 class="tool_title text-primary">
                  {{ i.appname.value }}
                  <div class="tool_subtitle small text-secondary">for {{ i.dataname.value }}</div>
                </h6>
                <div class="small">
                  <b-collapse :id="'collapse_' + i.index">
                    <p>{{ i.description.value }}</p>
                  </b-collapse>

                  <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>
                  <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>
                </div>
              </div>

              <div class="buttons mt-3">
                <b-button variant="outline-primary" v-on:click.stop="servicetemplate(i.turl.value, i.durl.value)">Open Tool</b-button>
              </div>
            </div>
          </b-container>
            <!-- download tools -->
            <b-container class="tools" v-if="downloadTools.length > 0">
                <h6 class="mt-4">Downloadable</h6>

                <div class="tool border rounded"
                    v-for="i in downloadTools"
                    v-bind:key="i.index"

                    v-b-toggle="'collapse_' + i.index"
                >
                    <div class="tool_info pr-3">
                        <b-link class="small metadata_link" v-on:click.stop="$router.push({ name: 'tool', params: { t: i.rrs.value },  query:{ d:d} })">
                            <b-icon class="mr-1" icon="tools" variant="tool"></b-icon>
                            Tool Metadata
                        </b-link>

                        <h6 class="tool_title text-primary">
                            {{ i.name.value }}
                          <div class="tool_subtitle small text-secondary" v-if="i.altName">
                          {{ i.altName.value }}
                           </div>
                          <div class="tool_subtitle small text-secondary"  v-if="i.swversion">
                            version: {{ i.swversion.value }}
                          </div>
                        </h6>

                        <div class="small">
                            <b-collapse :id="'collapse_' + i.index">
                              <!-- i.altName would be better if it exists -->
                              <h6 class="tool_title text-secondary" v-if="i.swversion">
                                version:{{ i.swversion.value }}
                              </h6>
                              <h6 class="tool_title text-secondary" v-if="i.landingName">
                                Types:{{ i.landingName.value }}
                              </h6>
                                <p>{{ i.description.value }}</p>
                            </b-collapse>

                            <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>
                            <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>
                        </div>
                    </div>

                    <div class="buttons mt-3">
                        <b-button variant="outline-primary" v-on:click.stop="openWindow(i.landingPage.value)">Download</b-button>
                    </div>
                </div>
            </b-container>


        </b-col>
    </b-row>
</template>

<script>
import {mapActions, mapState} from "vuex";
import SpaqlToolsDownloadQuery from 'raw-loader!../../sparql_blaze/sparql_gettools_download.txt'
import SpaqlToolsWebserviceQuery from 'raw-loader!../../sparql_blaze/sparql_gettools_webservice.txt'
import _ from "lodash";

//import FacetsConfig from "../../config";
import axios from "axios";

//let esTemplateOptions = FacetsConfig.ES_TEMPLATE_OPTIONS
//let esTemplateOptions = {interpolate: /\{([^\\}]*(?:\\.[^\\}]*)*)\}/g}

export default {
  name: "connectedTools",
  props: {
    d: {type: String, default: ''},

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
    ...mapState(['jsonLdObj', 'jsonLdCompact', 'esTemplateOptions','FacetsConfig']),


  },
  methods: {
    ...mapActions([
      'hasConnectedTools']),
    openWindow(url) {
        window.open(url, '_blank');
    },
    servicetemplate (turl, durl){
      // template url has {contentURL} that needs to be substituted.
      let urltemplate = _.template(turl, this.esTemplateOptions)
      let serviceUrl = urltemplate({'contentURL':durl})
      this.openWindow( serviceUrl)

    },
    checkTools() {
      //let graphUri = this.op.replaceAll("/", ":").replace('.jsonld', "");
      //graphUri = "urn:gleaner:milled"+ graphUri
      let graphUri = this.d
      this.hasConnectedTools(graphUri).then(i => this.hasTools=i)
      this.getDownloadableTools(graphUri)
      this.getWebTools(graphUri)
    }
    , getWebTools(graphUri) {
      var self = this
      const resultsTemplate = _.template(SpaqlToolsWebserviceQuery, this.esTemplateOptions)
      // const resultsTemplate = _.template(SpaqlToolsDownloadQuery, esTemplateOptions)
      let hasToolsQuery = resultsTemplate({g: graphUri, ecrr_service: this.FacetsConfig.ECRR_TRIPLESTORE_URL,
        ecrr_graph: this.FacetsConfig.ECRR_GRAPH});

      var url = this.FacetsConfig.TRIPLESTORE_URL;
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
     // console.log(params["query"]);
      axios.request(config).then(function (response) {
        //self.webserviceTools =  response.data.results.bindings
        var bindings = response.data.results.bindings
        let index = 0;
        bindings.forEach((i) => (i.index = 'wtool-'+index++));

        self.webserviceTools = bindings
      }).catch(e => console.error("webtools:query failed" + e.toString()))
    }
    , getDownloadableTools(graphUri) {
      var self = this;
      const resultsTemplate = _.template(SpaqlToolsDownloadQuery, this.esTemplateOptions)
      let hasToolsQuery = resultsTemplate({g: graphUri, ecrr_service: this.FacetsConfig.ECRR_TRIPLESTORE_URL,
        ecrr_graph: this.FacetsConfig.ECRR_GRAPH});

      var url = this.FacetsConfig.TRIPLESTORE_URL;
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
      }).catch(e => console.error("donwloadtools:query failed" + e.toString()))
    }
  }
}
</script>

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
