<template>
  <div class="result-header mb-3">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div class="result-count">
        <h5 class="mb-1">
          <span v-if="loading">
            <b-spinner small class="me-2"></b-spinner>
            Searching...
          </span>
          <span v-else-if="totalCount > 0">
            Showing {{ displayStart.toLocaleString() }}-{{ displayEnd.toLocaleString() }} of
            {{ totalCount.toLocaleString() }} results
          </span>
          <span v-else-if="hasFilters && searchTotalCount > totalCount">
            Showing {{ totalCount.toLocaleString() }} of
            {{ searchTotalCount.toLocaleString() }} results
          </span>
          <span v-else>
            {{ resultLabelCount.toLocaleString() }}
            {{ resultLabelCount === 1 ? 'result' : 'results' }}
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
          :value="currentPageSize"
          :options="pageSizeOptionsFormatted"
          size="sm"
          class="page-size-select me-2"
          @input="onPageSizeChange"
        />
        <b-form-select
          v-model="selectedSort"
          :options="sortOptions"
          size="sm"
          class="sort-select"
        />
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination-row mt-2">
      <b-pagination
        :value="currentPage"
        :total-rows="totalCount"
        :per-page="currentPageSize"
        :limit="7"
        align="center"
        size="sm"
        @input="onPageChange"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import { useConfig } from '@/composables/useConfig.js';

export default {
  name: "ResultHeader2",
  emits: ['page-change', 'page-size-change'],

  props: {
    currentCount: {
      type: Number,
      default: 0
    },
    totalCount: {
      type: Number,
      default: 0
    },
    searchTotalCount: {
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
    },
    currentPage: {
      type: Number,
      default: 1
    },
    currentPageSize: {
      type: Number,
      default: 10
    },
    pageSizeOptions: {
      type: Array,
      default: () => [10, 50, 100]
    }
  },

  computed: {
    resultLabelCount() {
      return this.totalCount > 0 ? this.totalCount : this.currentCount;
    },
  },

  setup(props, { emit }) {
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

    const displayStart = computed(() => {
      if (props.totalCount <= 0) return 0;
      return (props.currentPage - 1) * props.currentPageSize + 1;
    });

    const displayEnd = computed(() => {
      if (props.totalCount <= 0) return 0;
      return Math.min(props.totalCount, props.currentPage * props.currentPageSize);
    });

    const totalPages = computed(() => {
      if (props.currentPageSize <= 0) return 1;
      return Math.max(1, Math.ceil(props.totalCount / props.currentPageSize));
    });

    const pageSizeOptionsFormatted = computed(() =>
      (props.pageSizeOptions || []).map((size) => ({
        value: Number(size),
        text: `${Number(size)} / page`,
      }))
    );

    // Methods
    const getFieldDisplayName = (field) => {
      const facetConfig = getFacetConfig(field);
      return facetConfig?.title || field;
    };

    const onPageChange = (page) => {
      if (!Number.isFinite(Number(page))) return;
      emit('page-change', Number(page));
    };

    const onPageSizeChange = (size) => {
      if (!Number.isFinite(Number(size))) return;
      emit('page-size-change', Number(size));
    };

    return {
      selectedSort,
      hasFilters,
      sortOptions,
      getFieldDisplayName,
      displayStart,
      displayEnd,
      totalPages,
      pageSizeOptionsFormatted,
      onPageChange,
      onPageSizeChange
    };
  },
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

.page-size-select {
  width: 120px;
}

.pagination-row :deep(.pagination) {
  margin-bottom: 0;
}
</style>