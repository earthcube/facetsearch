<template>
  <b-container class="tools" v-if="partOf.length >0">
    <h6 class="mt-4">Samples</h6>

    <div class="tool border rounded"
         v-for="i in partOf"
         v-bind:key="i.value"

         v-b-toggle="'collapse_' + i.value"
    >
      <div class="tool_info pr-3">
        <b-link class="small metadata_link" :href="i.url">
          <b-icon class="mr-1" icon="server" variant="data"></b-icon>
          Sample
        </b-link>

        <h6 class="tool_title text-primary" v-html=" i.value">

        </h6>
        <div class="small">
          <b-collapse :id="'collapse_' + i.value">
            <!-- i.altName would be better if it exists -->
<!--            <p>{{ i.description.value }}</p>-->
            <p class="name" v-html="i.value"></p>
          </b-collapse>

          <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>
          <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>
        </div>
      </div>

      <div class="buttons mt-3" v-if="false">
        <b-button variant="outline-primary" v-on:click.stop="toRelatedData(i.g.value)">Open</b-button>
      </div>
    </div>
  </b-container>
</template>

<script>
// https://dev.geocodes.earthcube.org/#/dataset/urn:gleaner:milled:ieda:56bb16a22a82e1af6b0273b712683846bc459d5f
import {mapState} from "vuex";

//import {schemaItem} from "../../api/jsonldObject";
//const {JSONPath} = require('jsonpath-plus');
const jp = require('jsonpath')

export default {
  name: "sampleInfo",
  data() {
    return {
      partOf: []
    }
  },
  mounted() {
   // this.showRelatedData()
  },
  watch: {
    jsonLdObj: 'showPartOfData'
  },
  props: {

    d: {type:String}
    // list: {
    //     type: Array,
    //     default: null
    // }
  },
  computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact'])

  },
  methods: {
    showPartOfData() {
      var self = this

      let jsonLdObj = self.jsonLdObj // just short name
      //let realtedTextFields = schemaItem('description', jp) + schemaItem('name', jp);
     // let partOfFields = jp.query(jsonLdCompact, '$.hasPart[?(@."@type"=="https://schema.org/CreativeWork")]');
      //let partOfFields = jp.query(jsonLdObj, '$..hasPart[*]');
     //  let partOfFields = jp.query(jsonLdObj, '$..hasPart[ ?(@.additionalType=="http://schema.geolink.org/1.0/base/main#PhysicalSample") ]');
     // let partOfFields = JSONPath.query(jsonLdObj, "$..['hasPart'][?(['@type']=='CreativeWork')] ");
      // works below
    // let partOfFields = jp.query(jsonLdObj, "$..hasPart[?(@.additionalType=='http://schema.geolink.org/1.0/base/main#PhysicalSample')]")
      //let partOfFields = jp.query(jsonLdObj, "$..hasPart[?(@.@type=='CreativeWork')]")

      let partOfFields = jp.query(jsonLdObj,
          //"$..hasPart[?(@.additionalType=='http://schema.geolink.org/1.0/base/main#PhysicalSample')].identifier")
          "$..hasPart[?(@.additionalType=='http://schema.geolink.org/1.0/base/main#PhysicalSample')].identifier")
      partOfFields = jp.query(partOfFields, '$[?(@.propertyID == "IGSN")]')
      console.log('partOf: ' + partOfFields.length)
      console.log(partOfFields)
     this.partOf = partOfFields

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
