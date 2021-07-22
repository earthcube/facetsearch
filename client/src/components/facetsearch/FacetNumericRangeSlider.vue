<template>
  <div class="filter_card">
    <b-button block squared v-b-toggle="'accordion_'+ facetSetting.field">
      {{ facetSetting.title }}
      <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>
      <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>
    </b-button>

    <b-collapse
        :id="'accordion_'+ facetSetting.field"
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
      value: [this.yearMin, this.yearMax],
      facetItems: this.facetStore[this.facetSetting.field],
    }
  },
  components: {
    VueRangeSlider
  },
  methods: {
    callbackRange() {
      console.log(this.value)
    }
    ,
    calculateYearHistorgram(){
      // not fully sure this will work... but just the idea of a map fuction to get values.
      // need to trim to first 4 charaters... and trap missing value.

      // eslint-disable-next-line no-unused-vars
      var years = this.facetItems.reduce(function (freqs, val, i) {
        var bin = (this.binSize * val);
        freqs[bin] ? freqs[bin]++ : freqs[bin] = 1;
        return freqs;
      }, {})
      return years
    }
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
