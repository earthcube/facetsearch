<template>
  <b-col md="6" v-if="related.length >0">
    <h5>Related Data</h5>

    <div role="tablist">
      <div class="related_data_item mt-3"
           v-for="(item, index) in related "
           v-bind:key="index"
      >
<!--        v-on:click="showDetails(index)"-->
<!--        v-on:click="showDetails"-->
        <div class="tool_info pr-3">
          <b-link class="small metadata_link" v-on:click.stop="$router.push({ name: 'dataset', params: { d: item.g.value } })">
            {{item.name.value}}
          </b-link>
        </div>


<!--        <div class="toggle text-primary text-link d-flex" role="tab"-->
<!--             v-b-toggle="'collapse_related_data_' + index"-->
<!--        >-->
<!--          <b-icon icon="caret-right-fill" scale=".5" class="when_open"></b-icon>-->
<!--          <b-icon icon="caret-down-fill" scale=".5" class="when_closed"></b-icon>-->

<!--          <span v-html="item.name.value"></span>-->
<!--        </div>-->

<!--        <div class="description small mt-3" v-html="item.description" v-on:click="showDetails"></div>-->
<!--        <b-card tag="article" class="rounded-0"-->
<!--                v-on:click="showDetails"-->
<!--        >-->
<!--        </b-card>-->
<!--        <b-collapse accordion="collapse_group" role="tabpanel"-->
<!--                    :id="'collapse_related_data_' + index"-->
<!--        >-->
<!--          <div class="description small mt-3" v-html="item.description" v-on:click="showDetails"></div>-->
<!--        </b-collapse>-->
      </div>
    </div>

  </b-col>
</template>

<script>

import {mapState} from "vuex";
import axios from "axios";
import FacetsConfig from "../../config";
import SpaqlToolsWebserviceQuery from 'raw-loader!../../sparql_blaze/sparql_relateddatafilename.txt'

let esTemplateOptions = FacetsConfig.ES_TEMPLATE_OPTIONS
import _ from "lodash";
import {schemaItem} from "../../api/jsonldObject";

export default {
  name: "relatedData",
  data() {
    return {
      related: []
    }
  },
  mounted() {
    this.showRelatedData()
  },
  watch: {
    jsonLdCompact: 'showRelatedData'
  },
  props: {
    d: {type: Object},
    // list: {
    //     type: Array,
    //     default: null
    // }
  },
  computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact'])

  },
  methods: {
    showRelatedData() {
      var self = this
      console.log('related: ' + self.related)
      let jp = self.jsonLdCompact // just short name
      let graphUri = schemaItem('description', jp) + schemaItem('name', jp);
      graphUri = graphUri.replace(/<(style|script|iframe)[^>]*?>[\s\S]+?<\/\1\s*>/gi,'').replace(/<[^>]+?>/g,'').replace(/\s+/g,' ').replace(/ /g,' ').replace(/>/g,' ');

      console.log(graphUri)

      const resultsTemplate = _.template(SpaqlToolsWebserviceQuery, esTemplateOptions)
      let hasToolsQuery = resultsTemplate({relatedData: graphUri, n: 3});
      var url = FacetsConfig.TRIPLESTORE_URL;
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
      console.log(params["query"]);
      axios.request(config).then(function (response) {
        //self.webserviceTools =  response.data.results.bindings
        var bindings = response.data.results.bindings
        let index = 0;
        bindings.forEach((i) => (i.index = 'wtool-'+index++));
        self.related = bindings
      })


      // if (this.results && this.results.length > 0) {
      //
      //   // you mgiht want to use sort
      //   this.related = this.results.sort(function(ojbOne, ObjTwo) {
      //     if (ojbOne.name.length > ObjTwo.name.length) return true
      //   })
      //   // returns every 3rd
      //   this.related = this.results.filter(function (i, index) {
      //     if (index % 3 === 0) {
      //       return true;
      //     }
      //   })
      // }
      // return


    },
    // showDetails: function (index) {
    //   // console.log(index)
    //   // console.log(item)
    //   console.log('show details of related data')
    //   this.$router.push({
    //     name: 'dataset',
    //     params: {
    //       d: this.related[index].g.value
    //     }
    //   });
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
@import '~/src/assets/bootstrapcss/custom';

.toggle {
  cursor: pointer;

  font: {
    weight: 600; //semi-bold
  }
  line: {
    height: 140%;
  }

  &:hover {
    color: $info !important;
  }
}

.b-icon {
  width: $spacer * 1.5;
  height: $spacer * 1.5;
}

.description {
  margin: {
    left: $spacer * 1.5;
  }
}

.collapsed .when_closed,
.not-collapsed .when_open {
  display: none;
}

</style>
