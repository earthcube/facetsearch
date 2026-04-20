<template>
  <div class="range-slider-depth">
    <div class="facet-header" @click="toggleOpen">
      <h6 class="facet-title mb-0">
        <i :class="isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="me-2"></i>
        {{ facetConfig.title }}
        <b-badge v-if="hasActiveRange" variant="primary" class="ms-2">
          {{ formatDepth(activeRange[0]) }} - {{ formatDepth(activeRange[1]) }}
        </b-badge>
      </h6>
    </div>

    <b-collapse :visible="isOpen">
      <div class="facet-body">
        <div class="slider-container">
          <Slider
            :model-value="localRange"
            :min="minValue"
            :max="maxValue"
            :step="1"
            :format="formatDepth"
            :disabled="!hasDepthData"
            @update:model-value="handleSliderPreview"
            @change="handleSliderChange"
          />

          <div class="range-labels">
            <span class="text-muted">{{ formatDepth(minValue) }}</span>
            <span class="text-muted">{{ formatDepth(maxValue) }}</span>
          </div>
        </div>

        <div v-if="hasActiveRange" class="mt-2">
          <b-button
            variant="outline-secondary"
            size="sm"
            @click="clearRange"
          >
            Clear Range
          </b-button>
        </div>

        <div v-if="!hasDepthData" class="text-muted">
          <small>No depth data available</small>
        </div>
      </div>
    </b-collapse>
  </div>
</template>

<script>
import { ref, computed, inject, watch } from 'vue';
import Slider from '@vueform/slider';
import '@vueform/slider/themes/default.css';
import { useRangeFacet } from '@/composables/useSearch.js';

export default {
  name: "RangeSliderDepth2",

  components: {
    Slider
  },

  props: {
    facetConfig: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    // Get search composable from parent
    const searchComposable = inject('searchComposable');

    // Default depth range (in meters)
    const minValue = 0;
    const maxValue = 11000;

    // Use range facet composable
    const rangeFacet = useRangeFacet(props.facetConfig, searchComposable, minValue, maxValue, {
      fullRangeSlop: 1
    });

    const roundPair = (r) => {
      if (!Array.isArray(r) || r.length < 2) return [minValue, maxValue];
      return [
        Math.round(Number(r[0])),
        Math.round(Number(r[1])),
      ];
    };

    // Local state
    const isOpen = ref(props.facetConfig.open !== false);
    const localRange = ref(roundPair(rangeFacet.activeRange.value));

    // Computed
    const hasDepthData = computed(() => minValue < maxValue);

    // Watchers
    watch(() => rangeFacet.activeRange.value, (newRange) => {
      localRange.value = roundPair(newRange);
    });

    // Methods
    const toggleOpen = () => {
      isOpen.value = !isOpen.value;
    };

    const onRangeChange = (range) => {
      rangeFacet.setRange(range);
    };

    const formatDepth = (value) => {
      const n = Math.round(Number(value));
      return `${Number.isFinite(n) ? n : 0}m`;
    };

    const normalizeRange = (val) => {
      const lo = Math.min(maxValue, Math.max(minValue, Math.round(Number(val[0]))));
      const hi = Math.min(maxValue, Math.max(minValue, Math.round(Number(val[1]))));
      return lo <= hi ? [lo, hi] : [hi, lo];
    };

    const handleSliderPreview = (val) => {
      const rounded = normalizeRange(val);
      localRange.value = rounded;
    };

    const handleSliderChange = (val) => {
      const rounded = normalizeRange(val);
      localRange.value = rounded;
      onRangeChange(rounded);
    };

    return {
      ...rangeFacet,
      isOpen,
      localRange,
      hasDepthData,
      toggleOpen,
      onRangeChange,
      formatDepth,
      handleSliderPreview,
      handleSliderChange
    };
  }
};
</script>

<style scoped>
.range-slider-depth {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
}

.facet-header {
  padding: 0.75rem;
  cursor: pointer;
  background: #f8f9fa;
  border-radius: 0.375rem 0.375rem 0 0;
}

.facet-header:hover {
  background: #e9ecef;
}

.facet-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
}

.facet-body {
  padding: 0.75rem;
}

.slider-container {
  margin: 1rem 0;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}
</style>