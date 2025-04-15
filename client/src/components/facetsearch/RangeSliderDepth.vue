<template>
  <div class="filter_card">
    <b-button
      v-b-toggle="'accordion_range_' + facetSetting.field"
      block
      squared
    >
      {{ facetSetting.title }}
      <b-icon
        icon="square"
        class="when-open"
        scale="0.8"
        aria-hidden="true"
      ></b-icon>
      <b-icon
        icon="plus-square"
        class="when-closed"
        scale="0.8"
        aria-hidden="true"
      ></b-icon>
    </b-button>
    <vue-range-slider
      v-model="value"
      class="mx-2"
      :tooltip="false"
      :min="parseInt(minDepth)"
      :max="parseInt(maxDepth)"
      :disabled="disableDrag"
    ></vue-range-slider>
    <div v-if="value.length === 2">
      <span class="text-h2 font-weight-light">{{ value[0] }}</span>
      <span class="subheading font-weight-light mx-1">to</span>
      <span class="text-h2 font-weight-light">{{ value[1] }}</span>
      <span class="subheading font-weight-light ml-1">m</span>
    </div>
  </div>
</template>

<script>
import "vue-range-component/dist/vue-range-slider.css";
import VueRangeSlider from "vue-range-component-fixed";
import {mapState} from "vuex";

export default {
  components: {
    VueRangeSlider,
  },
  props: {
    facetSetting: {
      type: Object,
      required: true,
    },
    facetStore: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      mydata: [],
      minDepth: null,
      maxDepth: null,
      value: [0, 0],
      disableDrag: false,
    };
  },
  computed: {
    ...mapState(["results"]),
  },
  watch: {
    results: {
      handler(newResults) {
        const validMinDepths = newResults
          .map(d => parseFloat(d.minDepth))
          .filter(d => !isNaN(d));

        const validMaxDepths = newResults
          .map(d => parseFloat(d.maxDepth))
          .filter(d => !isNaN(d));

        const min = validMinDepths.length > 0 ? Math.min(...validMinDepths) : -10000;
        const max = validMaxDepths.length > 0 ? Math.max(...validMaxDepths) : 10000;

        this.minDepth = min;
        this.maxDepth = max;
        this.value = [min, max];

        console.log("Min:", min);
        console.log("Max:", max);
      },
      immediate: true // <-- run immediately if `results` already exists
    }
  }


};
</script>
