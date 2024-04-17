<template>
  <b-row class="connected_tools">
    <b-col v-if="hasTools" md="12">
      <h4>Connected Tools</h4>
      <!-- web service tools -->
      <b-container v-if="webserviceTools.length > 0 > 0" class="tools">
        <h6 class="mt-4">Web Applications</h6>

        <div
          v-for="i in webserviceTools"
          :key="i.index"
          v-b-toggle="'collapse_' + i.index"
          class="tool border rounded"
        >
          <div class="tool_info pr-3">
            <b-link
              class="small metadata_link"
              @click.stop="
                $router.push({
                  name: 'tool',
                  params: { t: i.rrs.value },
                  query: { d: d },
                })
              "
            >
              <!--                  <b-icon class="mr-1" icon="tools" variant="tool"></b-icon>-->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-tools"
                viewBox="0 0 16 16"
              >
                <path
                  d="M1 0 0 1l2.2 3.081a1 1 0 0 0 .815.419h.07a1 1 0 0 1 .708.293l2.675 2.675-2.617 2.654A3.003 3.003 0 0 0 0 13a3 3 0 1 0 5.878-.851l2.654-2.617.968.968-.305.914a1 1 0 0 0 .242 1.023l3.27 3.27a.997.997 0 0 0 1.414 0l1.586-1.586a.997.997 0 0 0 0-1.414l-3.27-3.27a1 1 0 0 0-1.023-.242L10.5 9.5l-.96-.96 2.68-2.643A3.005 3.005 0 0 0 16 3q0-.405-.102-.777l-2.14 2.141L12 4l-.364-1.757L13.777.102a3 3 0 0 0-3.675 3.68L7.462 6.46 4.793 3.793a1 1 0 0 1-.293-.707v-.071a1 1 0 0 0-.419-.814zm9.646 10.646a.5.5 0 0 1 .708 0l2.914 2.915a.5.5 0 0 1-.707.707l-2.915-2.914a.5.5 0 0 1 0-.708M3 11l.471.242.529.026.287.445.445.287.026.529L5 13l-.242.471-.026.529-.445.287-.287.445-.529.026L3 15l-.471-.242L2 14.732l-.287-.445L1.268 14l-.026-.529L1 13l.242-.471.026-.529.445-.287.287-.445.529-.026z"
                />
              </svg>
              Tool Metadata
            </b-link>

            <h6 class="tool_title text-primary">
              {{ i.appname.value }}
              <div class="tool_subtitle small text-secondary">
                for {{ i.dataname.value }}
              </div>
            </h6>
            <div class="small">
              <b-collapse :id="'collapse_' + i.index">
                <p>{{ i.description.value }}</p>
              </b-collapse>

              <!--          <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>-->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-caret-down-fill when_open"
                viewBox="0 0 16 16"
              >
                <path
                  d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"
                />
              </svg>

              <!--          <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>-->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-caret-up-fill when_closed"
                viewBox="0 0 16 16"
              >
                <path
                  d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"
                />
              </svg>
            </div>
          </div>

          <div class="buttons mt-3">
            <b-button
              variant="outline-primary"
              @click.stop="servicetemplate(i.turl.value, i.durl.value)"
              >Open Tool</b-button
            >
          </div>
        </div>
      </b-container>
      <!-- download tools -->
      <b-container v-if="downloadTools.length > 0" class="tools">
        <h6 class="mt-4">Downloadable</h6>

        <div
          v-for="i in downloadTools"
          :key="i.index"
          v-b-toggle="'collapse_' + i.index"
          class="tool border rounded"
        >
          <div class="tool_info pr-3">
            <b-link
              class="small metadata_link"
              @click.stop="
                $router.push({
                  name: 'tool',
                  params: { t: i.rrs.value },
                  query: { d: d },
                })
              "
            >
              <b-icon class="mr-1" icon="tools" variant="tool"></b-icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-tools"
                viewBox="0 0 16 16"
              >
                <path
                  d="M1 0 0 1l2.2 3.081a1 1 0 0 0 .815.419h.07a1 1 0 0 1 .708.293l2.675 2.675-2.617 2.654A3.003 3.003 0 0 0 0 13a3 3 0 1 0 5.878-.851l2.654-2.617.968.968-.305.914a1 1 0 0 0 .242 1.023l3.27 3.27a.997.997 0 0 0 1.414 0l1.586-1.586a.997.997 0 0 0 0-1.414l-3.27-3.27a1 1 0 0 0-1.023-.242L10.5 9.5l-.96-.96 2.68-2.643A3.005 3.005 0 0 0 16 3q0-.405-.102-.777l-2.14 2.141L12 4l-.364-1.757L13.777.102a3 3 0 0 0-3.675 3.68L7.462 6.46 4.793 3.793a1 1 0 0 1-.293-.707v-.071a1 1 0 0 0-.419-.814zm9.646 10.646a.5.5 0 0 1 .708 0l2.914 2.915a.5.5 0 0 1-.707.707l-2.915-2.914a.5.5 0 0 1 0-.708M3 11l.471.242.529.026.287.445.445.287.026.529L5 13l-.242.471-.026.529-.445.287-.287.445-.529.026L3 15l-.471-.242L2 14.732l-.287-.445L1.268 14l-.026-.529L1 13l.242-.471.026-.529.445-.287.287-.445.529-.026z"
                />
              </svg>
              Tool Metadata
            </b-link>

            <h6 class="tool_title text-primary">
              {{ i.name.value }}
              <div v-if="i.altName" class="tool_subtitle small text-secondary">
                {{ i.altName.value }}
              </div>
              <div
                v-if="i.swversion"
                class="tool_subtitle small text-secondary"
              >
                version: {{ i.swversion.value }}
              </div>
            </h6>

            <div class="small">
              <b-collapse :id="'collapse_' + i.index">
                <!-- i.altName would be better if it exists -->
                <h6 v-if="i.swversion" class="tool_title text-secondary">
                  version:{{ i.swversion.value }}
                </h6>
                <h6 v-if="i.landingName" class="tool_title text-secondary">
                  Types:{{ i.landingName.value }}
                </h6>
                <p>{{ i.description.value }}</p>
              </b-collapse>

              <!--          <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>-->

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-caret-down-fill when_open"
                viewBox="0 0 16 16"
              >
                <path
                  d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"
                />
              </svg>

              <!--          <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>-->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-caret-up-fill when_closed"
                viewBox="0 0 16 16"
              >
                <path
                  d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"
                />
              </svg>
            </div>
          </div>

          <div class="buttons mt-3">
            <b-button
              variant="outline-primary"
              @click.stop="openWindow(i.landingPage.value)"
              >Download</b-button
            >
          </div>
        </div>
      </b-container>
    </b-col>
  </b-row>
</template>

<script>
import { mapActions, mapState } from "vuex";
import SpaqlToolsDownloadQuery from "@/sparql_blaze/sparql_gettools_download.txt?raw";
import SpaqlToolsWebserviceQuery from "@/sparql_blaze/sparql_gettools_webservice.txt?raw";
import _ from "lodash";

//import FacetsConfig from "../../config";
import axios from "axios";

//let esTemplateOptions = FacetsConfig.ES_TEMPLATE_OPTIONS
let toolTemplateOptions = { interpolate: /\{([^\\}]*(?:\\.[^\\}]*)*)\}/g };

export default {
  name: "ConnectedTools",
  props: {
    d: { type: String, default: "" },
  },
  data() {
    return {
      downloadTools: [],
      webserviceTools: [],
      hasTools: false,
    };
  },
  watch: {
    jsonLdCompact: "checkTools",
  },
  computed: {
    ...mapState([
      "jsonLdObj",
      "jsonLdCompact",
      "esTemplateOptions",
      "FacetsConfig",
    ]),
  },
  methods: {
    ...mapActions(["hasConnectedTools"]),
    openWindow(url) {
      window.open(url, "_blank");
    },
    servicetemplate(turl, durl) {
      // template url has {contentURL} that needs to be substituted.
      // let urltemplate = _.template(turl, this.esTemplateOptions)
      let urltemplate = _.template(turl, toolTemplateOptions);
      let serviceUrl = urltemplate({ contentURL: durl });
      this.openWindow(serviceUrl);
    },
    checkTools() {
      //let graphUri = this.op.replaceAll("/", ":").replace('.jsonld', "");
      //graphUri = "urn:gleaner:milled"+ graphUri
      let graphUri = this.d;
      this.hasConnectedTools(graphUri).then((i) => (this.hasTools = i));
      this.getDownloadableTools(graphUri);
      this.getWebTools(graphUri);
    },
    getWebTools(graphUri) {
      var self = this;
      const resultsTemplate = _.template(
        SpaqlToolsWebserviceQuery,
        this.esTemplateOptions
      );
      // const resultsTemplate = _.template(SpaqlToolsDownloadQuery, esTemplateOptions)
      let hasToolsQuery = resultsTemplate({
        g: graphUri,
        ecrr_service: this.FacetsConfig.ECRR_TRIPLESTORE_URL,
        ecrr_graph: this.FacetsConfig.ECRR_GRAPH,
      });

      var url = this.FacetsConfig.TRIPLESTORE_URL;
      var params = {
        query: hasToolsQuery,
      };

      const config = {
        url: url,
        method: "get",
        headers: {
          Accept: "application/sparql-results+json",
          "Content-Type": "application/json",
        },
        params: params,
      };
      console.log("webtools:query:");
      // console.log(params["query"]);
      axios
        .request(config)
        .then(function (response) {
          //self.webserviceTools =  response.data.results.bindings
          var bindings = response.data.results.bindings;
          let index = 0;
          bindings.forEach((i) => (i.index = "wtool-" + index++));

          self.webserviceTools = bindings;
        })
        .catch((e) => console.error("webtools:query failed" + e.toString()));
    },
    getDownloadableTools(graphUri) {
      var self = this;
      const resultsTemplate = _.template(
        SpaqlToolsDownloadQuery,
        this.esTemplateOptions
      );
      let hasToolsQuery = resultsTemplate({
        g: graphUri,
        ecrr_service: this.FacetsConfig.ECRR_TRIPLESTORE_URL,
        ecrr_graph: this.FacetsConfig.ECRR_GRAPH,
      });

      var url = this.FacetsConfig.TRIPLESTORE_URL;
      var params = {
        query: hasToolsQuery,
      };

      const config = {
        url: url,
        method: "get",
        headers: {
          Accept: "application/sparql-results+json",
          "Content-Type": "application/json",
        },
        params: params,
      };
      console.log("donwloadtools:query:" + params["query"]);
      axios
        .request(config)
        .then(function (response) {
          // self.downloadTools = response.data.results.bindings
          var bindings = response.data.results.bindings;
          let index = 0;
          bindings.forEach((i) => (i.index = "dtool-" + index++));

          self.downloadTools = bindings;
        })
        .catch((e) =>
          console.error("donwloadtools:query failed" + e.toString())
        );
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

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

        padding: ($spacer * 0.75) $spacer;
      }
    }
  }
}
</style>
