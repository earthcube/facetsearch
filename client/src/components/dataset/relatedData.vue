<template>
    <div role="tablist">
        <div class="related_data_item mt-3"
            v-for="(item, index) in list"
            v-bind:key="index"
        >
            <div class="toggle text-primary text-link d-flex" role="tab"
                v-b-toggle="'collapse_related_data_' + index" 
            >
                <b-icon icon="caret-right-fill" scale=".5" class="when_open"></b-icon>
                <b-icon icon="caret-down-fill" scale=".5" class="when_closed"></b-icon>

                <span v-html="item.label"></span>
            </div>

            <b-collapse accordion="collapse_group" role="tabpanel"
                :id="'collapse_related_data_' + index"
            >
                <div class="description small mt-3" v-html="item.description"></div>
            </b-collapse>
        </div>
    </div>
</template>

<script>

export default {
  name: "relatedData",
  data() {
    return {
    }
  },
  props:{
    list: {
        type: Array,
        default: null
    }
  },
  methods: {
  },
  created() {
    //TODO replace fake data with real data
    this.list = [
            {
                label: 'Coral densities and extension rates from scientific literature collected in the field or in laboratories',
                description: "As part of the reef-composition survey of Palau (7°30' N, 134°30' E) and Yap (9°32' N, 138°7' E), 10-meter long, 2 to 5-meter depth transects were conducted. Coral species along the transect were recorded along with substrate types and other organisms present. Surveys in Palau were conducted from June 2nd to June 24th, 2017, and from June 25th to July 6th, 2017 in Yap. In Pohnpei (6.2°N, 158.2°E)"
            },
            {
                label: 'Sea urchin size, density, and species from transects surveyed in Palau and Yap in 2017 and in the Feder',
                description: "As part of the reef-composition survey of <b>Palau (7°30' N, 134°30' E) and Yap (9°32' N, 138°7' E)</b>, 10-meter long, 2 to 5-meter depth transects were conducted. Coral species along the transect were recorded along with substrate types and other organisms present. Surveys in Palau were conducted from June 2nd to June 24th, 2017, and from June 25th to July 6th, 2017 in Yap.<br><br><i>In Pohnpei (6.2°N, 158.2°E) and Kosrae (5.3°N, 162.9°E) FSM</i>, six 10-meter transects were used to measure the benthic composition for every centimeter, at each site of 48 sites. Corals were recorded to species level, except massive Porites and encrusting Montipora, which were recorded in the field as growth forms. All other organisms along each transect were identified to the highest possible taxonomic resolution."
            },
            {
                label: 'Parrotfish species, density counts, and fish length from field-video surveys in Palau and Yap in 2017',
                description: "As part of the reef-composition survey of Palau (7°30' N, 134°30' E) and Yap (9°32' N, 138°7' E), 10-meter long, 2 to 5-meter depth transects were conducted. Coral species along the transect were recorded along with substrate types and other organisms present. Surveys in Palau were conducted from June 2nd to June 24th, 2017, and from June 25th to July 6th, 2017 in Yap. In Pohnpei (6.2°N, 158.2°E)"
            }
        ];
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
