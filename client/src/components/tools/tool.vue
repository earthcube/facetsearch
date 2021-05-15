<template>
  <b-container fluid="md">
    <b-row class="title_row">
      <b-col md="12">
        <b-btn variant="outline-primary" v-on:click="$router.back()">
          <b-icon icon="arrow-left"/>
        </b-btn>
        <h4 class="page_title" v-html="mapping.s_name"></h4>
      </b-col>
    </b-row>

    <b-row>
      <b-col md="8">
        <div class="metadata">
          <div class="label">Type</div>
          <div class="value">
            <b-icon font-scale="2" class="mr-1" shift-v="-2"
                    :icon="('tool' == 'data') ? 'server' : 'tools'"
                    :variant="('tool' == 'data') ? 'data' : 'tool'"
            ></b-icon>
            <b-badge variant="tool" class="mr-1 mb-1">Tool</b-badge>
            <b-badge variant="secondary" class="mr-1 mb-1" v-for="t in mapping.types" v-bind:key="t">
              {{ t }}
            </b-badge>

          </div>
        </div>

        <div class="metadata">
          <div class="label">Abstract</div>
          <div class="value" v-html="mapping.s_description"></div>
        </div>

        <div class="metadata" v-if="true">
          <div class="label">Code Repository</div>
          <div class="value">{{ mapping.s_codeRepository }}</div>
        </div>

        <div class="metadata" v-if="mapping.s_programmingLanguages">
          <div class="label">Programming Language</div>
          <b-badge  variant="secondary" class="mr-1 mb-1" v-for=" l in mapping.s_programmingLanguages" v-bind:key="l">{{l}}</b-badge>
        </div>

        <div class="metadata" v-if="mapping.s_version">
          <div class="label">version</div>
          <div class="value">{{ mapping.s_version }}</div>
        </div>

        <div class="metadata" v-if="false">
          <div class="label">Citation</div>
          <div class="value"><a href="https://dx.doi.org/10.1016/J.PALAEO.2004.07.018">https://dx.doi.org/10.1016/J.PALAEO.2004.07.018</a>
          </div>
        </div>

        <div class="metadata" v-if="mapping.s_installURL">
          <div class="label">InstallURL</div>
          <div class="value">

            <div v-for="i in mapping.s_installURL" v-bind:key="i.name">
              <a v-if="i.url" :href="i.url">{{ i.name }}</a>
              <span v-if="! i.url"> {{ i.name }}</span>
            </div>

          </div>
        </div>
      </b-col>
      <b-col md="4">
      </b-col>
    </b-row>
    <b-row>
      <b-col md="12">
        <ToolDatasetLink v-if='d' :d="d" :ef="mapping.s_sd_encodingFormat"></ToolDatasetLink>
      </b-col>
    </b-row>
    <!-- TODO move this into a component if keeping for final public view -->
    <b-row>
      <b-col md="12">
        <h5>JSON tree</h5>

        <b-button v-b-toggle.collapse_json variant="outline-secondary">Toggle JSON</b-button>

        <b-collapse id="collapse_json" class="mt-2">
          <b-card>
            <!-- TODO remove inline style attributes -->
            <b-card-text style="min-height: 300px;"> <json-view class="text-left " :data="mapping.raw_json"/></b-card-text>
          </b-card>
        </b-collapse>
      </b-col>
    </b-row>

  </b-container>
</template>

<script>
//import ToolMetadata from "./toolMetadata";
import ToolDatasetLink from "./toolDatasetLink";

//import {getJsonLD} from '../../api/jsonldObject.js'
//import axios from "axios";
import {mapState, mapActions} from 'vuex'
import _ from 'lodash'
import {
  schemaItem,
//  hasSchemaProperty,
} from '../../api/jsonldObject.js'
import {JSONView} from "vue-json-component";

export default {
  name: "dataset",
  components: {
 //   ToolMetadata,
    ToolDatasetLink,  "json-view": JSONView},
  props: {
    t: String,
    d: String,
  }, watch: {
    toolLdCompact: 'toMetadataTools'
  },
  data() {
    return {
      mapping: {
        raw_json: '',
        types: [],
        s_name: '',
        s_alternateName: '',
        s_description: '',
        s_installUrl: '',
        s_codeRepository: '',
        s_version: '',
        s_keywords: [],
        s_programmingLanguages: [],
        s_supportingdata: {},
        s_sd_encodingFormat: [],
        // additional properties
        ap_citation: {},
        ap_maturity: {},
        ap_expectedLifetime: {},
        ap_stewardship: {},
        ap_usage: {},
        ap_dependencies: {},
        ap_v_organizations: {}, // v-value.. can be multiple


      }
    }
  },
  async mounted() {

    this.$store.dispatch('fetchToolJsonLd', this.t)
    console.log(this.t);
    console.log(this.d);

  },
  // watch: {
  //   // call again the method if the route changes
  //   '$route': 'fetchJsonLD'
  // },
  computed: {
    ...mapState(['toolLdObj', 'toolLdCompact'])

  },
  methods: {
    ...mapActions([
      'fetchToolJsonLd',]),

    toMetadataTools() {
      var self = this;
      var mapping = this.mapping;
      // console.log(self.toolLdObj)
      //const context = {};
      // const compacted = jsonld.compact(obj, context).then(sC, fC);
      // const compacted = jsonld.compact(content, context).then((providers) => {
      //  jsonld.compact(self.jsonLdObj, context).then((providers) => {
      //    var j = JSON.stringify(providers, null, 2);
      var j = JSON.stringify(self.toolLdCompact, null, 2);
      var jp = JSON.parse(j);
      //console.log(j.toString());
      mapping.raw_json = jp;
      //const detailsTemplate = [];
      // detailsTemplate.push(html`<h3>Digital Document metadata</h3>`);
      const types = jp["@type"]
      mapping.types = types.map(t => t.substring(t.indexOf('schema.org/') + 11))
      mapping.s_name = schemaItem('name', jp);
      mapping.s_alternateName = schemaItem('alternateName:', jp);
      mapping.s_url = schemaItem('url', jp);
      mapping.s_description = schemaItem('description', jp);

      mapping.s_keywords = schemaItem('keywords', jp);
      mapping.s_codeRepository = schemaItem('codeRepository', jp)
      mapping.s_version = schemaItem('version', jp)
      mapping.s_programmingLanguages = schemaItem('programmingLanguage', jp)
// needs to be done with framing
      let installUrl = schemaItem('installURL', jp);
      if (Array.isArray(installUrl)){
        mapping.s_installURL = []
        installUrl.forEach((i) => mapping.s_installURL.push({ url: i["https://schema.org/url"], name:i["https://schema.org/name"] }))
      } else {
        mapping.s_installURL = [{ url: installUrl["https://schema.org/url"], name:installUrl["https://schema.org/name"] }]
      }

    //  mapping.s_ontologyTerms = self.getAboutValues(jp)
      mapping.s_supportingdata = schemaItem('supportingData', jp)

      if (mapping.s_supportingdata) {
        if (Array.isArray(mapping.s_supportingdata)){
          mapping.s_supportingdata.forEach(
              sd => {
                let items = schemaItem('encodingFormat',sd)
                mapping.s_sd_encodingFormat = mapping.s_sd_encodingFormat.concat(items )
              }
          )
        } else {
          mapping.s_sd_encodingFormat =  mapping.s_sd_encodingFormat.concat(schemaItem('encodingFormat',mapping.s_supportingdata) )
        }

      }


    }

  }
  , getAboutValues( additionalPropertyJsonLDCompact){
    let returnResult = []
    var jp = additionalPropertyJsonLDCompact;
    let  result = _.find(jp,{'@type':'https://schema.org/DefinedTerm'})
    if (result != null) {
      let values = _.map(result, (o) => { return {url: o["https://schema.org/identifier"],name: o["https://schema.org/name"]} })
      return values;
    } else {
      return returnResult;
    }


  }

}
</script>

<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';

.row {
  padding: {
    bottom: $spacer;
  }

  &.title_row {
    background: {
      color: rgba($white, .95); //rgba($gray-300, .95);
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

i {
  color: $gray-600;

  font: {
    weight: 300;
  }
}

</style>
