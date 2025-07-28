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
    <b-collapse :id="'accordion_daterange_' + facetSetting.field" @shown="onCollapseShown" :visible="facetSetting.open">
      <VueformSlider v-if="temporalCount > 0"
                     :model-value="sliderValue"
                     ref="rangeSlider"
                     :key="sliderKey"
                     class="slider  mx-2 py-2"
                     :min="parseInt(startYear)"
                     :max="parseInt(endYear)"
                     :disabled="disableDrag"
                     @update:model-value="handleSliderUpdate"
      ></VueformSlider>
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
import VueformSlider from '@vueform/slider'
import '@vueform/slider/themes/default.css'
import {useStore} from 'vuex'
import {DateRange} from '@/components/facetsearch/range'
import {computed, ref, watch, inject, nextTick, getCurrentInstance} from 'vue'
import {DateTime, Interval} from "luxon";
import _ from 'lodash';


export default {
  name: 'RangeSliderYear',
  components: {
    VueformSlider,
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
    const startYear = ref( DateTime.now().year)
    const endYear = ref(DateTime.now().year)
    const sliderValue = ref([1800,2100])
    const sliderKey = ref(0)
    const controlValue = new DateRange(1800,2100) // not reactive
    const disableDrag = ref(false)
    const rangeSlider = ref(null)
    const temporalCount = ref(0);

    // Computed
    const results = computed(() => store.state.results || [])

    // Watch results
    watch(results, (newResults) => {
      if (!Array.isArray(newResults)) return;

      const ranges = newResults.map(item => {
        //const tc = item?.temporalCoverage ;
        const tc = item[props.facetSetting.field];
        if (tc === undefined) return null;
        // if (!tc.includes("/")) return null; // just parse them
        try {
          let range = Interval.fromISO(tc);
          if (!range.invalid) {
            return [range.start, range.end]
          } else {

            let date = DateTime.fromISO(tc);

            if (!date.invalid) {
              return [date, date]
            }
          }
        } catch (e) {

          console.log(` cannot parse ${tc} ${e}  ${e2}`)
          return null;
        }


        // const [rawStart, rawEnd] = tc.split("/");
        // const start = parseInt(rawStart.trim(), 10);
        // const end = parseInt(rawEnd.trim(), 10);

        //return (!isNaN(start) && !isNaN(end)) ? { start, end } : null;
        return null
      }).filter(Boolean); //.filter(Boolean);

      if (ranges.length > 0) {
        temporalCount.value = ranges.length;
        controlValue.temporalCount = ranges.length;


        const startYears = ranges.filter(r => r != undefined || r != null).map(r => r[0]);
        const endYears = ranges.filter(r => r != undefined || r != null).map(r =>  r[1]);

        // startYear.value = startYears.length ? Math.min(...startYears) : new Date().getFullYear();
        // endYear.value = endYears.length ? Math.max(...endYears) : new Date().getFullYear();
        startYear.value = startYears.length ? _.min(startYears) : DateTime.now();
        endYear.value = endYears.length ? _.max(endYears) : DateTime.now();

        if (controlValue.range) {
          controlValue.range[0] = startYear.value.year;
          controlValue.range[1] = endYear.value.year;
          sliderValue.value = [startYear.value.year, endYear.value.year]
        }
      } else {
        temporalCount.value = 0;
        controlValue.temporalCount = 0;
      }
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
        sliderValue.value = [startYear.value.year, endYear.value.year]
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
      sliderValue.value = newValue
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

