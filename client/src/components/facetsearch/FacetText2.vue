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

    <b-collapse :visible="isOpen">
      <div class="facet-body">
        <!-- Loading State -->
        <div v-if="optionsLoading" class="text-center py-2">
          <b-spinner small></b-spinner>
          <small class="text-muted ms-2">Loading options...</small>
        </div>

        <!-- Options -->
        <div v-else-if="options.length > 0" class="facet-options">
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
          <div v-if="options.length > 5" class="mt-2">
            <b-button
              v-if="!showAll"
              variant="link"
              size="sm"
              class="p-0"
              @click="showAll = true"
            >
              Show {{ options.length - 5 }} more...
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
    </b-collapse>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import { useFacet } from '@/composables/useSearch.js';

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

    // Computed
    const displayedOptions = computed(() => {
      if (showAll.value || facet.options.value.length <= 5) {
        return facet.options.value;
      }
      return facet.options.value.slice(0, 5);
    });

    const toggleOpen = () => {
      isOpen.value = !isOpen.value;
    };

    return {
      ...facet,
      showAll,
      isOpen,
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