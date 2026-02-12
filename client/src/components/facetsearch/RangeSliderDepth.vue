
<template>
  <div class="filter_card" v-if="hasData">
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
    <b-collapse :id="'accordion_range_' + facetSetting.field" @shown="onCollapseShown">
      <vue-range-slider
        v-if="isReady"
        v-model="value"
        ref="rangeSlider"
        :key="sliderKey"
        class="mx-2 py-2"
        :tooltip="false"
        :min="minDepth"
        :max="maxDepth"
        :step="stepSize"
        :disabled="disableDrag"
        @drag-end="filtered"
      ></vue-range-slider>
      <div v-if="value.length === 2" class="mt-0 px-2 py-0">
        <span class="text-h2 font-weight-light">{{ value[0] }}</span>
        <span class="subheading font-weight-light mx-1">to</span>
        <span class="text-h2 font-weight-light">{{ value[1] }}</span>
        <span class="subheading font-weight-light ml-1">m</span>
      </div>
    </b-collapse>
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
  inject: ["toggleFilter", "filtersState"],
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
      minDepth: 0,
      maxDepth: 100,
      value: [0, 100],
      stepSize: 1,
      sliderKey: 0,
      disableDrag: true,
      hasData: false,
      isReady: false,
      isFiltering: false, // Track if we're currently filtering
      initialRangeSet: false, // Track if initial range has been set
    };
  },
  computed: {
    ...mapState(["results", "allResults"]),
  },
  watch: {
    results: {
      handler(newResults) {
        // Don't reset the slider if we're actively filtering
        if (this.isFiltering) {
          return;
        }

        // Use allResults if available (original unfiltered data), otherwise use results
        const dataToAnalyze = this.$store.state.allResults && this.$store.state.allResults.length > 0
          ? this.$store.state.allResults
          : newResults;

        if (!dataToAnalyze || dataToAnalyze.length === 0) {
          this.hasData = false;
          return;
        }

        const validMinDepths = dataToAnalyze
          .map(d => parseFloat(d.minDepth))
          .filter(d => !isNaN(d) && d !== null && d !== undefined);

        const validMaxDepths = dataToAnalyze
          .map(d => parseFloat(d.maxDepth))
          .filter(d => !isNaN(d) && d !== null && d !== undefined);

        if (validMinDepths.length === 0 && validMaxDepths.length === 0) {
          this.hasData = false;
          return;
        }

        let min = validMinDepths.length > 0 ? Math.floor(Math.min(...validMinDepths)) : 0;
        let max = validMaxDepths.length > 0 ? Math.ceil(Math.max(...validMaxDepths)) : 100;

        // Ensure max > min and range is at least 2
        if (max <= min) {
          this.hasData = false;
          return;
        }

        // Calculate a valid step size
        const range = max - min;

        // If range is very small, adjust it
        if (range < 2) {
          max = min + 2;
        }

        // Calculate step size that divides evenly into the range
        let step = 1;
        if (range > 1000) {
          step = 10;
        } else if (range > 100) {
          step = 5;
        }

        // Adjust max to ensure it's divisible by step from min
        const adjustedRange = Math.ceil(range / step) * step;
        max = min + adjustedRange;

        // Only update if this is the first time or if the range has changed significantly
        if (!this.initialRangeSet || this.minDepth !== min || this.maxDepth !== max) {
          this.minDepth = min;
          this.maxDepth = max;
          this.stepSize = step;
          this.value = [min, max];
          this.disableDrag = false;
          this.hasData = true;
          this.initialRangeSet = true;

          // Force re-render with new key
          this.isReady = false;
          this.$nextTick(() => {
            this.isReady = true;
            this.sliderKey++;
          });
        }
      },
      immediate: true
    }
  },
  methods: {
    filtered() {
      if (this.value[0] === this.minDepth && this.value[1] === this.maxDepth) {
        return;
      }

      const [selectedMin, selectedMax] = this.value;

      // Set flag to prevent watcher from resetting slider
      this.isFiltering = true;

      this.$store.commit('filterByDepth', { min: selectedMin, max: selectedMax });

      // Reset flag after a short delay
      this.$nextTick(() => {
        setTimeout(() => {
          this.isFiltering = false;
        }, 100);
      });
    },
    onCollapseShown() {
      if (this.$refs.rangeSlider && this.$refs.rangeSlider.refresh) {
        this.$nextTick(() => this.$refs.rangeSlider.refresh());
      }
    }
  }
};
</script>
<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.filter_card {
  background-color: #f5f5f5;
  border: 1px solid rgba(0, 0, 0, 0.125);

  & + .filter_card {
    margin-top: $spacer / 2;
  }

  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;

    &:not(:hover) {
      color: $gray-700;
      background-color: $gray-300;
    }
  }

  .list-group {
    overflow-y: auto;
    max-height: 170px;
  }
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

.btn-secondary,
.btn-secondary:hover {
  background-image: none !important;
}
</style>