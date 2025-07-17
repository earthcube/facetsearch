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
    <b-collapse :id="'accordion_range_' + facetSetting.field" @shown="onCollapseShown">
      <vue-range-slider
        v-model="value.range"
        ref="rangeSlider"
        :key="sliderKey"
        class="mx-2 py-2"
        :tooltip="false"
        :min="parseInt(startYear)"
        :max="parseInt(endYear)"
        :disabled="disableDrag"
        @drag-end="filtered"
      ></vue-range-slider>
      <div v-if="this.value.temporalCount > 0" class="mt-0 px-2 py-0">
        <span class="text-h2 font-weight-light">{{ value.range[0] }}</span>
        <span class="subheading font-weight-light mx-1">to</span>
        <span class="text-h2 font-weight-light">{{ value.range[1] }}</span>
        <span class="subheading font-weight-light ml-1">year</span>
      </div>
      <div v-else>No Temporal Ranges</div>
    </b-collapse>
  </div>
</template>

<script>
import "vue-range-component/dist/vue-range-slider.css";
import VueRangeSlider from "vue-range-component-fixed";
import {mapState} from "vuex";
import {DateRange} from '@/components/facetsearch/range'

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
      mydata: [],
      startYear: null,
      endYear: null,
      value: new DateRange(0,2025),
      sliderKey: 0,
      disableDrag: false,
    };
  },
  computed: {
    ...mapState(["results"]),
  },
  watch: {
    results: {
      handler(newResults) {
        const ranges = newResults.map(item => {
          const tc = item.temporalCoverage || "";
          if (!tc.includes("/")) return null;

          const [rawStart, rawEnd] = tc.split("/");
          const start = parseInt(rawStart.trim(), 10);
          const end = parseInt(rawEnd.trim(), 10);

          return (!isNaN(start) && !isNaN(end)) ? { start, end } : null;
        }).filter(Boolean);

        if (ranges.length > 0) {
          this.value.temporalCount=ranges.length;
        }
        else {
          this.value.temporalCount=0;
        }
        const startYears = ranges.map(r => r.start);
        const endYears = ranges.map(r => r.end);

        this.startYear = startYears.length ? Math.min(...startYears) : new Date().getFullYear();
        this.endYear = endYears.length ? Math.max(...endYears) : new Date().getFullYear();

       // this.value = [this.startYear, this.endYear];
        this.value.range[0]=this.startYear;
        this.value.range[1]=this.endYear;
      },
      immediate: true
    }
  },
  methods: {
    filtered() {
      //const [start, end] = this.value;
      const start = this.value.range[0];
      const end = this.value.range[1]
      //this.toggleFilter("startYear", start, true);
     // this.toggleFilter("endYear", end, true);
      this.toggleFilter(this.fieldname, this.value , true);
    },
    onCollapseShown() {
      // Option A: if the slider instance has a .refresh() API
      if (this.$refs.rangeSlider && this.$refs.rangeSlider.refresh) {
        this.$nextTick(() => this.$refs.rangeSlider.refresh());
        return;
      }
      // Option B: force a remount via key
      this.sliderKey++;
   }
  },
};
</script>
<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";  // your custom Bootstrap overrides

.filter_card {
  background-color: #f5f5f5;
  border: 1px solid rgba(0, 0, 0, 0.125);

  & + .filter_card {
    margin-top: $spacer / 2;
  }

  /* this targets the b-button inside filter_card */
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

/* hide/show icons based on collapsed state */
.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

/* if you need flat secondary buttons everywhere */
.btn-secondary,
.btn-secondary:hover {
  background-image: none !important;
}
</style>

