<template>
  <div class="filter_card">
    <b-button
      v-b-toggle="'accordion_daterange_' + facetSetting.field"
      block
      squared
    >
      {{ facetSetting.title }}

      <b-badge pill variant="info">{{temporalCount}}</b-badge>
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
    <b-collapse :id="'accordion_daterange_' + facetSetting.field" @shown="onCollapseShown">
      <VueformSlider v-if="temporalCount > 0"
        v-model="value.range"
        ref="rangeSlider"
        :key="sliderKey"
        class="mx-2 py-2"
        :tooltip="false"
        :min="parseInt(startYear)"
        :max="parseInt(endYear)"
        :disabled="disableDrag"
        @drag-end="filtered"
      ></VueformSlider>
      <div v-if="temporalCount > 0" class="mt-0 px-2 py-0">
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
import VueformSlider from '@vueform/slider'
import '@vueform/slider/themes/default.css'
import { useStore } from 'vuex'
import { DateRange } from '@/components/facetsearch/range'
import { computed, ref, watch, inject, nextTick } from 'vue'

export default {
  name: 'RangeSliderYear',
  components: {
    'vue-range-slider': VueformSlider,
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
  setup(props) {
    const store = useStore()
    const toggleFilter = inject("toggleFilter")

    // Reactive data
    const mydata = ref([])
    const startYear = ref(new Date().getFullYear())
    const endYear = ref(new Date().getFullYear())
    const value = ref(new DateRange(0, 2025))
    const sliderKey = ref(0)
    const disableDrag = ref(false)
    const rangeSlider = ref(null)
    const temporalCount = ref(0);

    // Computed
    const results = computed(() => store.state.results || [])

    // Watch results
    watch(results, (newResults) => {
      if (!Array.isArray(newResults)) return;

      const ranges = newResults.map(item => {
        const tc = item?.temporalCoverage || "";
        if (!tc.includes("/")) return null;

        const [rawStart, rawEnd] = tc.split("/");
        const start = parseInt(rawStart.trim(), 10);
        const end = parseInt(rawEnd.trim(), 10);

        return (!isNaN(start) && !isNaN(end)) ? { start, end } : null;
      }).filter(Boolean);

      if (ranges.length > 0) {
        temporalCount.value = ranges.length;
        value.value.temporalCount = ranges.length;
      } else {
        temporalCount.value = 0;
        value.value.temporalCount = 0;
      }

      const startYears = ranges.map(r => r.start);
      const endYears = ranges.map(r => r.end);

      startYear.value = startYears.length ? Math.min(...startYears) : new Date().getFullYear();
      endYear.value = endYears.length ? Math.max(...endYears) : new Date().getFullYear();

      if (value.value.range) {
        value.value.range[0] = startYear.value;
        value.value.range[1] = endYear.value;
      }
    }, { immediate: true })

    // Methods
    const filtered = () => {
      if (value.value.range) {
        toggleFilter(props.facetSetting.field, value.value, true);
      }
    }

    const onCollapseShown = () => {
      // Option A: if the slider instance has a .refresh() API
      if (rangeSlider.value && typeof rangeSlider.value.refresh === 'function') {
        nextTick(() => rangeSlider.value.refresh());
        return;
      }
      // Option B: force a remount via key
      sliderKey.value++;
    }

    return {
      mydata,
      startYear,
      endYear,
      value,
      sliderKey,
      disableDrag,
      rangeSlider,
      results,
      filtered,
      onCollapseShown,
      temporalCount
    }
  }
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

