<template>
  <b-container class="tools" >
    <h6 class="mt-4">Related Data</h6>

    <div v-if="related.length ==0 && !running">
      <span>None</span>
    </div>
 <div v-if="related.length >0">
    <div class="tool border rounded"
         v-for="i in related"
         v-bind:key="i.index"

         v-b-toggle="'collapse_' + i.index"
    >
      <div class="tool_info pr-3">
        <b-link class="small metadata_link" v-on:click.stop="$router.push({ name: 'dataset', params: { d: i.g.value } })">
<!--          <b-icon class="mr-1" icon="server" variant="data"></b-icon>-->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hdd" viewBox="0 0 16 16">
            <path d="M4.5 11a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M3 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
            <path d="M16 11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9.51c0-.418.105-.83.305-1.197l2.472-4.531A1.5 1.5 0 0 1 4.094 3h7.812a1.5 1.5 0 0 1 1.317.782l2.472 4.53c.2.368.305.78.305 1.198zM3.655 4.26 1.592 8.043Q1.79 8 2 8h12q.21 0 .408.042L12.345 4.26a.5.5 0 0 0-.439-.26H4.094a.5.5 0 0 0-.44.26zM1 10v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1"/>
          </svg>
          Dataset
        </b-link>

        <h6 class="tool_title text-primary" v-html=" i.name.value">

        </h6>
        <div class="small">
          <b-collapse :id="'collapse_' + i.index">
            <!-- i.altName would be better if it exists -->
<!--            <p>{{ i.description.value }}</p>-->
            <p class="name" v-html="i.description.value"></p>
          </b-collapse>

<!--          <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>-->

          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-down-fill when_open" viewBox="0 0 16 16">
            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
          </svg>

<!--          <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>-->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-up-fill when_closed" viewBox="0 0 16 16">
            <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/>
          </svg>
        </div>
      </div>

      <div class="buttons mt-3" v-if="false">
        <b-button variant="outline-primary" v-on:click.stop="toRelatedData(i.g.value)">Open</b-button>
      </div>
    </div>
 </div>
  </b-container>
</template>

<script>

import {mapState} from "vuex";
import axios from "axios";

import SpaqlToolsWebserviceQuery from '@/sparql_blaze/sparql_relateddatafilename.txt?raw'


import _ from "lodash";
import {frameJsonLD, schemaItem} from "@/api/jsonldObject";


export default {
  name: "relatedData",
  data() {
    return {
      related: [],
      running: false
    }
  },
  mounted() {
   // this.showRelatedData()
  },
  watch: {
    jsonLdObj: 'showRelatedData'
  },
  props: {

    d: {type:String}
    // list: {
    //     type: Array,
    //     default: null
    // }
  },
  computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact','FacetsConfig'])

  },
  methods: {
    showRelatedData() {
      this.running = true
      var self = this
      console.log('related: ' + self.related)
     // let jp = self.jsonLdCompact // just short name
      frameJsonLD(self.jsonLdObj, 'Dataset').then(
          (jp) => {
            let realtedTextFields = schemaItem('description', jp) + schemaItem('name', jp);
            realtedTextFields = realtedTextFields.replace(/<(style|script|iframe)[^>]*?>[\s\S]+?<\/\1\s*>/gi, '').replace(/<[^>]+?>/g, '').replace(/\s+/g, ' ').replace(/ /g, ' ').replace(/>/g, ' ');
            realtedTextFields = realtedTextFields.replace(/"/g, '');
            console.log(realtedTextFields)
            if (realtedTextFields == "") return;

            const resultsTemplate = _.template(SpaqlToolsWebserviceQuery, this.FacetsConfig.esTemplateOptions)
            let hasToolsQuery = resultsTemplate({
              relatedData: realtedTextFields,
              n: this.FacetsConfig.RELATEDDATA_COUNT
            });
            var url = this.FacetsConfig.TRIPLESTORE_URL;
            var params = {
              query: "#hastoodsquery /n" + hasToolsQuery
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
            console.log('relateddata:query:')
            // console.log(params["query"]);
            axios.request(config).then(function (response) {
              //self.webserviceTools =  response.data.results.bindings
              var bindings = response.data.results.bindings
              let index = 0;
              bindings.forEach((i) => (i.index = 'relatedData-' + index++));
              _.remove(bindings, (i) => i.g.value === self.d)
              self.related = bindings
            })
          }
      ).finally(() => this.running = false)
    },
    // toRelatedData: function (d) {
    //   // console.log(index)
    //   // console.log(item)
    //   console.log('show details of related data')
    //   this.$router.push({
    //     name: 'dataset',
    //     params: {
    //       d: d
    //     }
    //   }).catch(failure => {
    //       console.log(failure)
    //   });
    //  // this.$forceUpdate()
    // }

  },
  created() {

    //TODO replace fake data with real data
    // this.list = [
    //         {
    //             label: 'Coral densities and extension rates from scientific literature collected in the field or in laboratories',
    //             description: "As part of the reef-composition survey of Palau (7°30' N, 134°30' E) and Yap (9°32' N, 138°7' E), 10-meter long, 2 to 5-meter depth transects were conducted. Coral species along the transect were recorded along with substrate types and other organisms present. Surveys in Palau were conducted from June 2nd to June 24th, 2017, and from June 25th to July 6th, 2017 in Yap. In Pohnpei (6.2°N, 158.2°E)"
    //         },
    //         {
    //             label: 'Sea urchin size, density, and species from transects surveyed in Palau and Yap in 2017 and in the Feder',
    //             description: "As part of the reef-composition survey of <b>Palau (7°30' N, 134°30' E) and Yap (9°32' N, 138°7' E)</b>, 10-meter long, 2 to 5-meter depth transects were conducted. Coral species along the transect were recorded along with substrate types and other organisms present. Surveys in Palau were conducted from June 2nd to June 24th, 2017, and from June 25th to July 6th, 2017 in Yap.<br><br><i>In Pohnpei (6.2°N, 158.2°E) and Kosrae (5.3°N, 162.9°E) FSM</i>, six 10-meter transects were used to measure the benthic composition for every centimeter, at each site of 48 sites. Corals were recorded to species level, except massive Porites and encrusting Montipora, which were recorded in the field as growth forms. All other organisms along each transect were identified to the highest possible taxonomic resolution."
    //         },
    //         {
    //             label: 'Parrotfish species, density counts, and fish length from field-video surveys in Palau and Yap in 2017',
    //             description: "As part of the reef-composition survey of Palau (7°30' N, 134°30' E) and Yap (9°32' N, 138°7' E), 10-meter long, 2 to 5-meter depth transects were conducted. Coral species along the transect were recorded along with substrate types and other organisms present. Surveys in Palau were conducted from June 2nd to June 24th, 2017, and from June 25th to July 6th, 2017 in Yap. In Pohnpei (6.2°N, 158.2°E)"
    //         }
    //     ];
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/bootstrapcss/custom';

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
