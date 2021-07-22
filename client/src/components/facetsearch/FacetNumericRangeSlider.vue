<template>
  <div class="filter_card">
    <b-button block squared v-b-toggle="'accordion_range_'+ facetSetting.field">
      {{ facetSetting.title }}
      <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>
      <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>
    </b-button>

    <b-collapse
        :id="'accordion_range_'+ facetSetting.field"
        :visible="facetSetting.open"
    >
      <div>
        <vue-range-slider ref="slider" v-model="value" :min="yearMin" :max="yearMax"
                          @drag-end="callbackRange"></vue-range-slider>
      </div>

      <span
          class="text-h2 font-weight-light"
          v-text="yearMin"
      ></span>
      <span class="subheading font-weight-light mr-1"> year to </span>
      <span
          class="text-h2 font-weight-light"
          v-text="yearMax"
      ></span>
      <span class="subheading font-weight-light mr-1"> year</span>
    </b-collapse>

  </div>


</template>
<script>

import 'vue-range-component/dist/vue-range-slider.css'
import VueRangeSlider from 'vue-range-component'

export default {
  name: "FacetRange",
  props: {
    yearMin: {
      default: 1900,
      type: Number
    },
    yearMax: {
      default: 2050,
      type: Number
    },
    binSize: {
      default: 1,
      type: Number
    },
    "facetSetting": Object,
    "facetStore": Object,
    "state": Object,
  },
  data() {
    return {
      value: [1950, 2021],
     // value: [this.yearMin, this.yearMax],
      facetItems: this.facetStore[this.facetSetting.field],
    }
  },
  components: {
    VueRangeSlider
  },
  methods: {
    callbackRange() {
      console.log(this.value)
    },
    // use search initFacetCounts or something facetCounts to get counts for facet
    // or items = (from search.vue)... items.map((o) => i["someField"] pass to historgram data

    // modify toggle filter, or feed togglefitler the correct list of object to select

  },
}
</script>
<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';


.filter_card {
  background: {
    color: #f5f5f5;
  }

  border: 1px solid rgba(0,0,0, .125);

  & + .filter_card {
    margin: {
      top: $spacer / 2;
    }
  }

  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:not(:hover) {
      color: $gray-700;
      background: {
        color: $gray-300;
      }
    }

    border: 0px;
  }

  .list-group {
    overflow: {
      y: auto;
    }

    max: {
      height: 170px;
    }
  }
}

//make flat color
.btn-secondary,
.btn-secondary:hover {
  background: {
    image: none;
  }
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

</style>
