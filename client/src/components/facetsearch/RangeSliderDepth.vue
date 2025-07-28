<template>
  <div class="filter_card">
    <b-button
      v-b-toggle="'accordion_depthrange_' + facetSetting.field"
      block
      squared
    >
      {{ facetSetting.title }}
      <b-badge pill variant="info">{{depthCount}}</b-badge>
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
    <b-collapse :id="'accordion_depthrange_' + facetSetting.field" @shown="onCollapseShown"
                :visible="facetSetting.open">
      <Slider v-if="depthCount > 0"
        :model-value="sliderValue"
        :key="sliderKey"
        class="slider mx-2 py-2"
        :min="minDepth"
        :max="maxDepth"
        :disabled="disableDrag"
        :tooltip="tooltipFormat"
        :format="numberFormat"
        @update:model-value="handleSliderUpdate"
      />
      <div v-if="depthCount > 0" class="mt-0 px-2 py-0">
        <div v-if="sliderValue.length === 2" class="mt-0 px-2 py-0">
          <span class="text-h2 font-weight-light">{{ formatNumber(sliderValue[0]) }}</span>
          <span class="subheading font-weight-light mx-1">to</span>
          <span class="text-h2 font-weight-light">{{ formatNumber(sliderValue[1]) }}</span>
          <span class="subheading font-weight-light ml-1">m</span>
        </div>
      </div>
      <div v-else>No Depths</div>

    </b-collapse>
  </div>
</template>

<script>
import Slider from '@vueform/slider'
import { useStore } from 'vuex'
import { NumericRange } from '@/components/facetsearch/range'
import { computed, ref, watch, inject, nextTick, getCurrentInstance, onUnmounted } from 'vue'
import '@vueform/slider/themes/default.css'
import _ from 'lodash';

export default {
  name: 'RangeSliderDepth',
  components: {
    Slider,
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
  setup(props) {
    const store = useStore()
    const toggleFilter = inject('toggleFilter')
    const filtersState = inject('filtersState')
    const defaultMinDepth = -5000;
    const defaultMaxDepth = 5000;
    const minDepth = ref(defaultMinDepth)
    const maxDepth = ref(defaultMaxDepth)
    const sliderValue = ref([-5000, 0])
    const sliderKey = ref(0)
    const disableDrag = ref(false)
    const controlValue = new NumericRange(-5000,0); // not reactive
    const depthCount =ref(0)
// Computed
    const results = computed(() => store.state.results || [])

    const formatNumber = (value) => {
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
      }).format(value)
    }

    const numberFormat = (value) => {
      return formatNumber(value)
    }

    const tooltipFormat = (value) => {
      return `${formatNumber(value)} m`
    }

    const filtered = () => {
      if (sliderValue.value && sliderValue.value.length === 2) {
        controlValue.range = [...sliderValue.value];
        toggleFilter(props.facetSetting.field, controlValue, false)
      } else {
        toggleFilter(props.facetSetting.field, controlValue, false)
      }
    }

    const onCollapseShown = () => {
      sliderKey.value++
    }

    const resetToFullRange = () => {
      if (minDepth.value !== null && maxDepth.value !== null) {
        sliderValue.value = [minDepth.value, maxDepth.value]
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

    watch(results, (newResults) => {
      if (!newResults) return

      const minDepthField = props.facetSetting.range_fields[0]
      const maxDepthField = props.facetSetting.range_fields[1]

      const validMinDepths = newResults
        .map(d => parseFloat(d[minDepthField]))
        .filter(d => !isNaN(d))

      const validMaxDepths = newResults
        .map(d => parseFloat(d[maxDepthField]))
        .filter(d => !isNaN(d))

      minDepth.value = validMinDepths.length > 0 ? _.min(validMinDepths) : defaultMinDepth
      maxDepth.value = validMinDepths.length > 0 ? _.max(validMaxDepths) : defaultMaxDepth
      if (validMinDepths.length > 0 || validMinDepths.length > 0 ){
        depthCount.value =Math.max(validMinDepths.length, validMaxDepths.length);
      } else {
        depthCount.value = 0;
      }
      sliderValue.value = [minDepth.value, maxDepth.value]
    }, { immediate: true })

    onUnmounted(() => {
      $root.$off('refresh slider range')
    })

    const handleSliderUpdate = (newValue) => {
      sliderValue.value = newValue
      filtered()
    }

    return {
      minDepth,
      maxDepth,
      sliderKey,
      disableDrag,
      sliderValue,
      controlValue,
      depthCount,
      filtered,
      onCollapseShown,
      formatNumber,
      numberFormat,
      tooltipFormat,
      resetToFullRange,
      handleSliderUpdate
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/_variables.scss";
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
