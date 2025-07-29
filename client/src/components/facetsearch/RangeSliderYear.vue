<template>
  <div class="filter_card">
    <b-button
        v-b-toggle="'accordion_daterange_' + facetSetting.field"
        block
        squared
    >
      {{facetSetting.title}}

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
    <b-collapse :id="'accordion_daterange_' + facetSetting.field" @shown="onCollapseShown"
                :visible="facetSetting.open">
      <Slider v-if="temporalCount > 0"
                     :model-value="sliderValue"
                     ref="rangeSlider"
                     :key="sliderKey"
                     class="slider  mx-2 py-2"
                     :min="startYear"
                     :max="endYear"
                     :disabled="disableDrag"
                     @update:model-value="handleSliderUpdate"
      ></Slider>
      <div v-if="temporalCount > 0" class="mt-0 px-2 py-0">
        <span class="text-h2 font-weight-light">{{controlValue.range[0]}}</span>
        <span class="subheading font-weight-light mx-1">to</span>
        <span class="text-h2 font-weight-light">{{controlValue.range[1]}}</span>
        <span class="subheading font-weight-light ml-1">year</span>
      </div>
      <div v-else>No Temporal Ranges</div>
    </b-collapse>
  </div>
</template>

<script>
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'
import {useStore} from 'vuex'
import {DateRange} from '@/components/facetsearch/range'
import {computed, ref, watch, inject, nextTick, getCurrentInstance} from 'vue'
import {DateTime, Interval} from "luxon";
import _ from 'lodash';
import {isArray} from "underscore";


export default {
  name: 'RangeSliderYear',
  components: {
    Slider,
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
    const currentResults = inject('currentResults')

    // Reactive data
    const mydata = ref([])
    const yearNow = DateTime.now().year
    const startYear = ref( yearNow)
    const endYear = ref(yearNow)
    const sliderValue = ref([1800,2100])
    const sliderKey = ref(0)
    const controlValue = new DateRange(1800,2100) // not reactive
    const disableDrag = ref(false)
    const rangeSlider = ref(null)
    const temporalCount = ref(0);

    // Computed
    const results = computed(() => store.state.results || [])
    const filteredResults = computed(() => currentResults || [])
    const thisYear = DateTime.now().toISODate();
    const temporalFix = (facetData,thisYear) => {
      if (typeof facetData === 'string' && facetData.endsWith('/..')) {
        return facetData.replace('/..', `/${thisYear}`);
      }
      return facetData;

    };
    const parseTemporalRanges = (resultsList) => {
      return resultsList.map(item => {
        const tc = item[props.facetSetting.field];
        if (tc === undefined) return null;
        try {
          const fixedFacet = temporalFix(tc, thisYear);
          let range = Interval.fromISO(fixedFacet);
          if (!range.invalid) {
            return [range.start, range.end]
          } else {
            let date = DateTime.fromISO(tc);
            if (!date.invalid) {
              return [date, date]
            }
          }
        } catch (e) {
          console.log(` cannot parse ${tc} ${e}`)
          return null;
        }
        return null
      }).filter(Boolean);
    }

    // Watch original results to set slider bounds and initial position
    watch(results, (newResults) => {
      if (!Array.isArray(newResults)) return;

      const ranges = parseTemporalRanges(newResults);

      if (ranges.length > 0) {
        const startYears = ranges.filter(r => (r != undefined || r != null) ).map(r => r[0].year);
        const endYears = ranges.filter(r => (r != undefined || r != null)).map(r =>  r[1].year);

        startYear.value = startYears.length ? _.min(startYears) : yearNow;
        endYear.value = endYears.length ? _.max(endYears) : yearNow;

        // Only reset slider value if this is the initial load
        if (sliderValue.value[0] === 1800 && sliderValue.value[1] === 2100) {
          controlValue.range[0] = startYear.value;
          controlValue.range[1] = endYear.value;
          sliderValue.value = [startYear.value, endYear.value]
        }
      }
    }, {immediate: true})

    // Watch filtered results to update count only
    watch(filteredResults, (newResults) => {
      if (!Array.isArray(newResults)) {
        temporalCount.value = 0;
        return;
      }

      const ranges = parseTemporalRanges(newResults);
      temporalCount.value = ranges.length;
    }, {immediate: true})

    // Methods
    const filtered = () => {

      if (sliderValue.value && sliderValue.value.length === 2) {
        controlValue.range = [...sliderValue.value];
        toggleFilter(props.facetSetting.field, controlValue, false)
      } else {
        toggleFilter(props.facetSetting.field, controlValue, false)
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
    const resetToFullRange = () => {
      if (startYear.value !== null && endYear.value !== null) {
        sliderValue.value = [startYear.value, endYear.value]
        sliderKey.value++
        // Don't call filtered() here as it would add the default range to the URL
      }
    }
    const { proxy: { $root } } = getCurrentInstance()
    $root.$on('refresh slider range', (action) => {
      if (action === 'clear') {
        resetToFullRange()
      }
    })
    const handleSliderUpdate = (newValue) => {
      if (isArray(newValue)){
        sliderValue.value = newValue

      } else {
        sliderValue.value = [startYear.value, endYear.value]
      }
      filtered()

    }
    return {
      mydata,
      startYear,
      endYear,
      sliderValue,
      sliderKey,
      controlValue,
      disableDrag,
      rangeSlider,
      results,
      filtered,
      onCollapseShown,
      temporalCount,
      handleSliderUpdate
    }
  }
};
</script>
<style scoped lang="scss">
@import "@/assets/bootstrapcss/_variables.scss";
@import "@/assets/bootstrapcss/custom"; // your custom Bootstrap overrides
@import '@vueform/slider/themes/tailwind.scss';

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
/* Custom styles for @vueform/slider */
.slider {
  --slider-handle-bg: #18598b;
  --slider-connect-bg: #18598b;
  --slider-tooltip-bg: #18598b;
  --slider-tooltip-color: white;
  --slider-height: 6px;
  --slider-handle-width: 16px;
  --slider-handle-height: 16px;
  --slider-handle-border-radius: 50%;
  --slider-handle-border: none;
  --slider-handle-shadow: 0 1px 3px rgba(0,0,0,0.3);
  --slider-handle-ring-color: #18598b;
  margin: 20px 10px;
}
</style>

