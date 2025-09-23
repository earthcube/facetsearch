<template>
  <div class="result-header mb-3">
    <div class="d-flex justify-content-between align-items-center">
      <div class="result-count">
        <h5 class="mb-1">
          <span v-if="loading">
            <b-spinner small class="me-2"></b-spinner>
            Searching...
          </span>
          <span v-else>
            {{ currentCount.toLocaleString() }}
            {{ currentCount === 1 ? 'result' : 'results' }}
          </span>
        </h5>

        <!-- Active Filters Display -->
        <div v-if="hasFilters" class="active-filters">
          <small class="text-muted">Filtered by: </small>
          <span v-for="(values, field) in filters" :key="field" class="me-2">
            <b-badge variant="secondary" class="me-1">
              {{ getFieldDisplayName(field) }}: {{ values.join(', ') }}
            </b-badge>
          </span>
        </div>
      </div>

      <!-- Sort Options -->
      <div class="sort-controls">
        <b-form-select
          v-model="selectedSort"
          :options="sortOptions"
          size="sm"
          class="sort-select"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import { useConfig } from '@/composables/useConfig.js';

export default {
  name: "ResultHeader2",

  props: {
    currentCount: {
      type: Number,
      default: 0
    },
    totalCount: {
      type: Number,
      default: 0
    },
    filters: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    inject('searchComposable');
    const { config, getFacetConfig } = useConfig();

    // Sort state
    const selectedSort = ref('score');

    // Computed
    const hasFilters = computed(() => {
      return Object.keys(props.filters).length > 0;
    });

    const sortOptions = computed(() => {
      const options = config.value?.ORDER_BY_OPTIONS || [];
      return options.map(option => ({
        value: option.field,
        text: option.title
      }));
    });

    // Methods
    const getFieldDisplayName = (field) => {
      const facetConfig = getFacetConfig(field);
      return facetConfig?.title || field;
    };

    return {
      selectedSort,
      hasFilters,
      sortOptions,
      getFieldDisplayName
    };
  }
};
</script>

<style scoped>
.result-header {
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 1rem;
}

.active-filters {
  margin-top: 0.5rem;
}

.sort-select {
  width: 150px;
}
</style>