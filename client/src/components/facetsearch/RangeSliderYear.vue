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
        :min="startYear"
        :max="endYear"
        :step="1"
        :disabled="disableDrag"
        @drag-end="filtered"
      ></vue-range-slider>
      <div v-if="value.length === 2" class="mt-0 px-2 py-0">
        <span class="text-h2 font-weight-light">{{ value[0] }}</span>
        <span class="subheading font-weight-light mx-1">to</span>
        <span class="text-h2 font-weight-light">{{ value[1] }}</span>
        <span class="subheading font-weight-light ml-1">year</span>
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
      startYear: 1900,
      endYear: new Date().getFullYear(),
      value: [1900, new Date().getFullYear()],
      sliderKey: 0,
      disableDrag: true,
      hasData: false,
      isReady: false,
    };
  },
  computed: {
    ...mapState(["results"]),
  },
  watch: {
    results: {
      handler(newResults) {
        if (!newResults || newResults.length === 0) {
          this.hasData = false;
          return;
        }

        const ranges = newResults
          .map(item => {
            const tc = item.temporalCoverage || "";
            if (!tc.includes("/")) return null;

            const [rawStart, rawEnd] = tc.split("/");
            const start = parseInt(rawStart.trim(), 10);
            const end = parseInt(rawEnd.trim(), 10);

            return (!isNaN(start) && !isNaN(end)) ? { start, end } : null;
          })
          .filter(Boolean);

        if (ranges.length === 0) {
          this.hasData = false;
          return;
        }

        const startYears = ranges.map(r => r.start);
        const endYears = ranges.map(r => r.end);

        const min = Math.floor(Math.min(...startYears));
        const max = Math.ceil(Math.max(...endYears));

        // Ensure max > min
        if (max <= min) {
          this.hasData = false;
          return;
        }

        this.startYear = min;
        this.endYear = max;
        this.value = [min, max];
        this.disableDrag = false;
        this.hasData = true;

        // Delay slider rendering
        this.$nextTick(() => {
          this.isReady = true;
          this.sliderKey++;
        });
      },
      immediate: true
    }
  },
  methods: {
    filtered() {
      if (this.value[0] === this.startYear && this.value[1] === this.endYear) {
        return;
      }

      const [start, end] = this.value;
      this.$store.commit('filterByTemporalCoverage', { start, end });
    },
    onCollapseShown() {
      if (this.$refs.rangeSlider && this.$refs.rangeSlider.refresh) {
        this.$nextTick(() => this.$refs.rangeSlider.refresh());
      }
    }
  },
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