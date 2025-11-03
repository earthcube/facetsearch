<template>
  <b-container fluid="md">
    <b-overlay :show="obscurePage" rounded="sm">
      <b-row class="align-items-center mb-3">
        <b-col cols="auto">
          <back-button/>
        </b-col>

      </b-row>
      <b-card class="mt-3" bg-variant="light" border-variant="secondary" v-if="isDataCatalog">
        <b-card-header>Records from DataCatalog</b-card-header>
        <b-card-body>
          <b-list-group flush>
            <b-list-group-item>
              <h4 class="page_title mb-0" v-html="name"></h4>
            </b-list-group-item>

            <b-list-group-item>
              <strong>Description: </strong>
              <span class="text-muted" v-html="description"></span>
            </b-list-group-item>

            <b-list-group-item>
              <strong>Keywords:</strong>
              <b-badge v-for="(kw, idx) in keywords" :key="idx" variant="info" class="mr-1">
                {{kw}}
              </b-badge>
            </b-list-group-item>

          </b-list-group>
        </b-card-body>
        <b-card-footer>
          <div v-if="mappings.length>0"> Number of Datasets: {{ mappings.length }}</div>
        </b-card-footer>
      </b-card>
      <div v-for="(mapping, index) in mappings" :key="index">
        <b-card no-body class="mb-2">
          <!-- Toggle Header -->
          <b-card-header
              class="d-flex justify-content-between align-items-center"
              @click="toggleCollapse(index)"
              style="cursor: pointer;"
          >
            <h5 class="mb-0" v-html="mapping.s_name"></h5>
            <b-icon :icon="collapsedIndices.includes(index) ? 'chevron-down' : 'chevron-up'"/>
          </b-card-header>

          <!-- Collapsible Body -->
          <b-collapse :id="'collapse-' + index" :visible="!collapsedIndices.includes(index)">
            <b-card-body>
              <b-row class="align-items-center">
                <!--                <b-col>-->
                <!--                  <p>{{ mapping.description }}</p>-->
                <!--                </b-col>-->
                <b-col cols="right">
                  <feedback
                      subject="Dataset"
                      :name="mapping.s_name"
                      :urn="d"
                  />
                </b-col>
              </b-row>
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

          <div v-if="mapping.publisher" class="metadata">
            <div class="label">Publisher</div>
            <div class="value">{{ mapping.publisher }}</div>
          </div>

          <div v-if="mapping.s_provider" class="metadata">
            <div class="label">Provider</div>
            <div class="value">{{ mapping.s_provider }}</div>
          </div>
                  <div v-if="mapping.s_publisher" class="metadata">
                    <div class="label">Publisher</div>
                    <div class="value">{{ mapping.publisher }}</div>
                  </div>

                  <div v-if="mapping.s_datePublished" class="metadata">
                    <div class="label">Date</div>
                    <div class="value">{{ mapping.s_datePublished }}</div>
                  </div>

                  <div v-if="mapping.updated" class="metadata">
                    <div class="label">Last Updated</div>
                    <div class="value">{{ mapping.updated }}</div>
                  </div>

                  <div v-if="mapping.start_datetime" class="metadata">
                    <div class="label">Start Date</div>
                    <div class="value">{{ mapping.start_datetime }}</div>
                  </div>

                  <div v-if="mapping.end_datetime" class="metadata">
                    <div class="label">End Date</div>
                    <div class="value">{{ mapping.end_datetime }}</div>
                  </div>

          <div v-if="mapping.has_citation" class="metadata">
            <div class="label">Citation</div>
            <div
              class="value"
              v-html="formatCitation(mapping)"
            ></div>
          </div>

          <div v-if="mapping.s_keywords?.length" class="metadata">
            <div class="label">Keywords</div>
            <div class="value">
              {{ mapping.s_keywords.join(', ') }}
            </div>
          </div>

          <div
            v-if="mapping.s_variableMeasuredNames?.length > 0"
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
                          <!-- Show the URL if it does NOT start with 's3:' -->
                          <a v-if="!i.contentUrl.startsWith('s3:')" target="_blank" :href="i.contentUrl">{{
                              i.contentUrl
                            }}</a>
                          <!-- Show the button if the URL starts with 's3:' -->
                          <button
                              v-else
                              class="data-access-button"
                              @click="dataAccessWindow(i.description)"
                          >
                            View Access Code
                          </button>
                        </div>
                        <!-- Dialog -->
                        <div v-if="isDialogOpen" class="dialog-backdrop" @click.self="closeDialog">
                          <div class="dialog-content">
                            <h3>URL Copied!</h3>
                            <p>{{ dialogContent }}</p>
                            <button @click="closeDialog">Close</button>
                          </div>
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
                  <DatasetLocation :m="mapping" :index="index"></DatasetLocation>

                  <b-card>
                    <b-card-title>Downloads</b-card-title>
                    <downloadfiles :d="d" :m="mapping"></downloadfiles>
                  </b-card>
                </b-col>
              </b-row>
            </b-card-body>
          </b-collapse>
        </b-card>
      </div>

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
                  :data="jsonLdObj"
              />
            </b-card>
          </b-collapse>
        </b-col>
      </b-row>
    </b-overlay>
  </b-container>
</template>

<script>
import DatasetLocation from "@/components/dataset/datasetLocation.vue";
import ConnectedTools from "@/components/dataset/connectedTools.vue";
import Downloadfiles from "@/components/dataset/downloadfiles.vue";
import relatedData from "@/components/dataset/relatedData.vue";
import sampleInfo from "@/components/dataset/igsnSampleList.vue";
import annotation from "@/components/dataset/annotation.vue";
import feedback from "@/components/feedback/feedback.vue";
import citationButton from "@/components/dataset/citationButton.vue";
import backButton from "@/components/backButton.vue";
import {mapState, mapActions} from "vuex";
import _ from "lodash";
import {
  geoplacename,
  getDistributions,
  getFirstGeoShape,
  getGeoCoordinates,
  hasSchemaProperty,
  schemaItem,
  frameJsonLD,
  formatDateToYYYYMMDD
} from "../../api/jsonldObject";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import {marked} from "marked";

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
      isDataCatalog: false,
      doiUrl: "",
      name: "ABC",
      description: "description",
      keywords: [],
      vocab: "",
      raw_json: "",
      mappings: [],
      geolink: "",


      collapsedIndices: [] // keeps track of collapsed panels
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
  },
  computed: {
    ...mapState(["jsonLdObj", "jsonLdCompact"])
  },
  methods: {
    toggleCollapse(index) {
      const i = this.collapsedIndices.indexOf(index);
      if (i > -1) {
        this.collapsedIndices.splice(i, 1); // remove (expand)
      } else {
        this.collapsedIndices.push(index); // add (collapse)
      }
    },
    ...mapActions(["fetchJsonLd"]),
    async dataAccessWindow(content) {
      content = marked(content, {
        highlight: function (code, language) {
          return code; // Optionally highlight the code here
        }
      });

      try {
        // Open a new window with the rendered content
        const newWindow = window.open("", "_blank", "width=800,height=600,left=350");
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>View Example Source Code</title>
                <style>
                  /* General Styles */
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f7f7f7;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                  }

                  h1, h2 {
                    color: #2a659c;
                    margin-bottom: 10px;
                  }

                  p {
                    margin: 10px 0;
                    line-height: 1.6;
                  }

                  /* Code Block Styles */
                  pre {
                    position: relative;
                    background-color: #f0f0f0;
                    border: 1px solid #dcdcdc;
                    border-radius: 5px;
                    padding: 15px;
                    overflow-x: auto;
                    font-size: 14px;
                    margin-bottom: 20px;
                  }

                  /* Copy Button Styles */
                  .copy-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 5px 10px;
                    font-size: 12px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  }

                  .copy-button:hover {
                    background-color: #0056b3;
                  }
                </style>
              </head>
              <body>
                <div id="content">${content}</div>
                <button style="position: absolute; left: 50%;" onclick="window.close()">Close</button>
                <script>
                  // Add "Copy" button to each code block
                  document.querySelectorAll('pre').forEach(pre => {
                    const copyButton = document.createElement('button');
                    copyButton.textContent = 'Copy';
                    copyButton.classList.add('copy-button');
                    copyButton.onclick = () => {
                      const code = pre.textContent;
                      navigator.clipboard.writeText(code).then(() => {
                        copyButton.textContent = 'Copied!';
                        setTimeout(() => (copyButton.textContent = 'Copy'), 2000);
                      });
                    };
                    pre.appendChild(copyButton);
                  });
                <\/script>
              </body>
            </html>
          `);
        } else {
          alert("Popup blocked. Please allow popups for this website.");
        }
      } catch (error) {
        console.error("Error in dataAccessWindow:", error);
      }
    },
    scrollToMetadata() {
      const element = this.$refs.metadataview;

      if (element) {
        var top = element.$el.offsetHeight;

        window.scrollTo(0, top);
      }
    },
    toMetadata() {
      var self = this;
      var mapping = {
        "s_name": "",
        "s_description": "",
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
        updated: "",
        start_datetime: "",
        end_datetime: ""
      };
      var jp = self.jsonLdObj; // framed dataset
      if (jp["@type"] == "DataCatalog") {
        this.isDataCatalog = true;
      }
      this.name = jp["name"];
      this.description = jp["description"];
      this.keywords = jp["keywords"];
      this.vocab = jp["@vocab"];
      this.geolink = jp["geolink"];

      if (JSON.stringify(jp) === "{}") return;
      frameJsonLD(jp, "Dataset").then((jp) => {
        if (jp === undefined) return;

        this.mappings = []; // Reset the array

        let datasets = [];
        if (jp["@graph"] !== undefined) {
          datasets = jp["@graph"].filter(item => item["@type"] === "Dataset");

        } else if (jp["@type"] === "Dataset") {
          datasets = [jp];

        }

        if (datasets.length === 0) {
          console.warn("No datasets found.");
          return;
        }
        datasets.forEach((dataset) => {
          const mapping = {};
          mapping.raw_json = dataset;

          mapping.s_identifier = dataset.identifier;
          mapping.s_name = dataset.name;
          mapping.s_url = dataset.url;
          mapping.s_description = dataset.description;
          mapping.s_distribution = dataset.distribution;

          if (hasSchemaProperty("datePublished", dataset)) {
            mapping.s_datePublished = schemaItem("datePublished", dataset);
          } else if (hasSchemaProperty("datePublished", mapping.s_distribution)) {
            mapping.s_datePublished = schemaItem("datePublished", mapping.s_distribution);
          } else if (hasSchemaProperty("dateCreated", dataset)) {
            mapping.s_datePublished = schemaItem("dateCreated", dataset);
          }

          if (hasSchemaProperty("publisher", dataset)) {
            const p = schemaItem("publisher", dataset);
            if (hasSchemaProperty("name", p)) {
              mapping.publisher = schemaItem("name", p);
            } else if (hasSchemaProperty("legalName", p)) {
              mapping.publisher = schemaItem("legalName", p);
            } else {
              mapping.publisher = "Publisher Quirkiness. Please alert us";
            }
          } else {
            mapping.publisher = schemaItem("sdPublisher", dataset);
          }

          // Contributors
          if (hasSchemaProperty("contributor", dataset)) {
            const c = schemaItem("contributor", dataset);
            if (Array.isArray(c)) {
              mapping.s_contributor = c
                  .map(obj => hasSchemaProperty("name", obj) ? schemaItem("name", obj) : "")
                  .filter(Boolean);
            } else {
              mapping.s_contributor = schemaItem("name", c);
            }
          }

          // Or creators
          if (hasSchemaProperty("creator", dataset)) {
            const cr = schemaItem("creator", dataset);
            if (Array.isArray(cr)) {
              mapping.s_contributor = cr
                  .map(obj => hasSchemaProperty("name", obj) ? schemaItem("name", obj) : "")
                  .filter(Boolean);
            } else {
              mapping.s_contributor = schemaItem("name", cr);
            }
          }

          if (hasSchemaProperty("citation", dataset)) {
            mapping.s_citation = schemaItem("citation", dataset);
            mapping.has_citation = true;
          }

          // Keywords
          if (hasSchemaProperty("keywords", dataset)) {
            const c = schemaItem("keywords", dataset);
            if (Array.isArray(c)) {
              mapping.s_keywords = c;
            } else {
              mapping.s_keywords = [c];
            }
          }
          mapping.s_landingpage = schemaItem("description", dataset);
          mapping.updated = schemaItem("updated", dataset);
          mapping.start_datetime = formatDateToYYYYMMDD(schemaItem("start_datetime", dataset));
          mapping.end_datetime = formatDateToYYYYMMDD(schemaItem("end_datetime", dataset));

          mapping.s_downloads = getDistributions(mapping.s_distribution, dataset.url);

          mapping.s_spatialCoverage = schemaItem("spatialCoverage", dataset);
          mapping.placename = geoplacename(mapping.s_spatialCoverage);
          mapping.box = getFirstGeoShape(mapping.s_spatialCoverage, "box");
          mapping.poly = getFirstGeoShape(mapping.s_spatialCoverage, "polygon");
          mapping.points = getGeoCoordinates(mapping.s_spatialCoverage);

          const variableMeasured = schemaItem("variableMeasured", dataset);
          if (variableMeasured) {
            mapping.s_variableMeasuredNames = variableMeasured.map((item) =>
                _.truncate(schemaItem("name", item), {
                  length: 80,
                  omission: "***",
                })
            );
          }

          if (
              JSON.stringify(dataset) !== "{}" &&
              (mapping.s_name === undefined || mapping.s_name === "")
          ) {
            console.log("json issue");
            this.$bvToast.toast(`See Metadata for item description`, {
              title: "JSON Parse or Render Issue",
              solid: true,
              appendToast: false,
            });
          }

          this.mappings.push(mapping);
        });

        this.obscurePage = false;
      });
    },
    formatCitation(mapping) {
      const raw = mapping.s_citation;
      if (!mapping.has_citation || !raw) return "";

      // 1) If it’s a string, try to parse it
      let c;
      if (typeof raw === "string") {
        try {
          c = JSON.parse(raw);
        } catch {
          // not valid JSON, just render the string
          return raw;
        }
      }
      // 2) If it’s already an object, use it directly
      else if (typeof raw === "object") {
        c = raw;
      } else {
        return "";
      }

      // 3) Build the formatted HTML
      const authors = (c.author || [])
        .map(a => a.name)
        .join(", ");
      const year = c.datePublished
        ? `(${new Date(c.datePublished).getFullYear()})`
        : "";
      const title = c.name || "";
      const journal = c.isPartOf?.name || "";
      // identifier.value might itself be a string or array:
      const doiVal =
        typeof c.identifier?.value === "string"
          ? c.identifier.value
          : Array.isArray(c.identifier?.value)
            ? c.identifier.value[0]
            : "";
      const doi = doiVal.replace(/^doi:/, "");

      return `
        ${authors ? `<strong>${authors}</strong> ` : ""}
        ${year}
        <em>${title}</em>
        ${journal ? `, ${journal}` : ""}
        ${doi ? `.&nbsp;<a href="https://doi.org/${doi}" target="_blank">doi:${doi}</a>` : ""}
      `;
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

.data-access-button {
  display: inline-block;
  padding: 8px 16px;
  font-size: 14px;
  color: #ffffff;
  background-color: #007bff; /* Primary blue color */
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s, transform 0.2s;
}

.data-access-button:hover {
  background-color: #0056b3; /* Slightly darker blue on hover */
  transform: translateY(-2px); /* Slight lift effect */
}

.data-access-button:active {
  background-color: #003f8a; /* Even darker blue when clicked */
  transform: translateY(0); /* Reset the lift */
}
</style>
