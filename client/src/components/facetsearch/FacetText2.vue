<template>
  <div class="facet-text">
    <div class="facet-header" @click="toggleOpen">
      <h6 class="facet-title mb-0">
        <i :class="isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="me-2"></i>
        {{ facetConfig.title }}
        <b-badge v-if="hasActiveValues" variant="primary" class="ms-2">
          {{ activeValues.length }}
        </b-badge>
      </h6>
    </div>

    <div v-show="isOpen" class="facet-body">
        <!-- Loading State (only when no options yet) -->
        <div v-if="optionsLoading && options.length === 0" class="text-center py-2">
          <b-spinner small></b-spinner>
          <small class="text-muted ms-2">Loading options...</small>
        </div>

        <template v-else-if="options.length > 0">
          <div v-if="supportsOptionSort" class="facet-sort mb-2">
            <span class="facet-sort-label">Sort:</span>
            <div class="facet-sort-toggle" role="group" aria-label="Sort facet options">
              <button
                type="button"
                class="facet-sort-btn"
                :class="{ active: optionSortMode === 'count' }"
                @click.stop="setOptionSortMode('count')"
              >
                Count
              </button>
              <button
                type="button"
                class="facet-sort-btn"
                :class="{ active: optionSortMode === 'alpha' }"
                @click.stop="setOptionSortMode('alpha')"
              >
                A–Z
              </button>
            </div>
          </div>

          <div class="facet-options">
            <div
              v-for="option in displayedOptions"
              :key="option.value"
              class="form-check"
            >
              <input
                :id="`${field}-${option.value}`"
                type="checkbox"
                class="form-check-input"
                :checked="isValueActive(option.value)"
                @change="toggleValue(option.value)"
              />
              <label
                :for="`${field}-${option.value}`"
                class="form-check-label"
              >
                {{ option.label }}
                <span class="text-muted">({{ option.count }})</span>
              </label>
            </div>

            <!-- Show More/Less -->
            <div v-if="sortedOptions.length > 5" class="mt-2">
              <b-button
                v-if="!showAll"
                variant="link"
                size="sm"
                class="p-0"
                @click="showAll = true"
              >
                Show {{ sortedOptions.length - 5 }} more...
              </b-button>

              <b-button
                v-else
                variant="link"
                size="sm"
                class="p-0"
                @click="showAll = false"
              >
                Show less
              </b-button>
            </div>
          </div>
        </template>

        <!-- No Options -->
        <div v-else class="text-muted">
          <small>No options available</small>
        </div>

        <!-- Clear Button -->
        <div v-if="hasActiveValues" class="mt-2">
          <b-button
            variant="outline-secondary"
            size="sm"
            @click="clearValues"
          >
            Clear
          </b-button>
        </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import { useFacet } from '@/composables/useSearch.js';

const SORTABLE_FACET_FIELDS = ['kw'];

export default {
  name: "FacetText2",

  props: {
    facetConfig: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    // Get search composable from parent
    const searchComposable = inject('searchComposable');

    // Use facet composable
    const facet = useFacet(props.facetConfig, searchComposable);

    // Local state
    const showAll = ref(false);
    const isOpen = ref(props.facetConfig.open !== false);
    const optionSortMode = ref('count');

    const supportsOptionSort = computed(() =>
      SORTABLE_FACET_FIELDS.includes(props.facetConfig.field)
    );

    const sortedOptions = computed(() => {
      const opts = facet.options.value;
      if (!opts?.length) return [];

      const compareAlpha = (a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
      const compareCount = (a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return compareAlpha(a, b);
      };

      const compare = optionSortMode.value === 'alpha' ? compareAlpha : compareCount;
      return [...opts].sort(compare);
    });

    const setOptionSortMode = (mode) => {
      optionSortMode.value = mode;
    };

    // Computed
    const displayedOptions = computed(() => {
      if (showAll.value || sortedOptions.value.length <= 5) {
        return sortedOptions.value;
      }
      return sortedOptions.value.slice(0, 5);
    });

    const toggleOpen = () => {
      isOpen.value = !isOpen.value;
    };

    return {
      ...facet,
      showAll,
      isOpen,
      supportsOptionSort,
      optionSortMode,
      setOptionSortMode,
      sortedOptions,
      displayedOptions,
      toggleOpen
    };
  }
};
</script>

<style scoped>
.facet-text {
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

.facet-sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.facet-sort-label {
  font-size: 0.8rem;
  color: #6c757d;
  white-space: nowrap;
}

.facet-sort-toggle {
  display: inline-flex;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  overflow: hidden;
}

.facet-sort-btn {
  border: none;
  background: #fff;
  color: #495057;
  font-size: 0.8rem;
  padding: 0.2rem 0.55rem;
  line-height: 1.4;
  cursor: pointer;
}

.facet-sort-btn + .facet-sort-btn {
  border-left: 1px solid #ced4da;
}

.facet-sort-btn:hover {
  background: #f8f9fa;
}

.facet-sort-btn.active {
  background: #0d6efd;
  color: #fff;
}

.facet-sort-btn.active:hover {
  background: #0b5ed7;
}

.facet-options {
  max-height: 300px;
  overflow-y: auto;
}

.form-check {
  margin-bottom: 0.5rem;
}

.form-check-label {
  font-size: 0.85rem;
  cursor: pointer;
}

.form-check-input {
  cursor: pointer;
}
</style>