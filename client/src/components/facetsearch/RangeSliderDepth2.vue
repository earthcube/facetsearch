<template>
  <div class="range-slider-depth">
    <div class="facet-header" @click="toggleOpen">
      <h6 class="facet-title mb-0">
        <i :class="isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="me-2"></i>
        {{ facetConfig.title }}
        <b-badge v-if="hasActiveRange" variant="primary" class="ms-2">
          {{ activeRange[0] }}m - {{ activeRange[1] }}m
        </b-badge>
      </h6>
    </div>

    <b-collapse :visible="isOpen">
      <div class="facet-body">
        <div class="slider-container">
          <vue-slider
            v-model="localRange"
            :min="minValue"
            :max="maxValue"
            :interval="1"
            :tooltip="'active'"
            :tooltip-formatter="formatDepth"
            @change="onRangeChange"
            :disabled="!hasDepthData"
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
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';
import { useRangeFacet } from '@/composables/useSearch.js';

export default {
  name: "RangeSliderDepth2",

  components: {
    VueSlider
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
    const rangeFacet = useRangeFacet(props.facetConfig, searchComposable, minValue, maxValue);

    // Local state
    const isOpen = ref(props.facetConfig.open !== false);
    const localRange = ref([...rangeFacet.activeRange.value]);

    // Computed
    const hasDepthData = computed(() => minValue < maxValue);

    // Watchers
    watch(() => rangeFacet.activeRange.value, (newRange) => {
      localRange.value = [...newRange];
    });

    // Methods
    const toggleOpen = () => {
      isOpen.value = !isOpen.value;
    };

    const onRangeChange = (range) => {
      rangeFacet.setRange(range);
    };

    const formatDepth = (value) => {
      return `${value}m`;
    };

    return {
      ...rangeFacet,
      isOpen,
      localRange,
      hasDepthData,
      toggleOpen,
      onRangeChange,
      formatDepth
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