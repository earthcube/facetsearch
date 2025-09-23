
<template>
  <b-container fluid="md" class="mt-3">
    <b-overlay
      rounded="sm"
      :show="isLoading"
      variant="white"
      :opacity="0.85"
    >
      <b-row>
        <!-- Sidebar -->
        <b-col md="3" class="sidebar">
          <!-- Full Text Search -->
          <div class="mb-3">
            <label for="textSearch" class="form-label fw-bold">Search</label>
            <b-input-group>
              <b-form-input
                id="textSearch"
                v-model="textQuery"
                placeholder="Enter search terms..."
                :debounce="500"
              />
              <b-input-group-append>
                <b-button
                  variant="outline-secondary"
                  @click="textQuery = ''"
                  :disabled="!textQuery"
                >
                  <i class="fas fa-times"></i>
                </b-button>
              </b-input-group-append>
            </b-input-group>

            <!-- Search Options -->
            <div class="mt-2">
              <b-form-check
                v-model="searchExactMatch"
                class="small"
              >
                Exact match
              </b-form-check>
            </div>
          </div>

          <!-- Active Filters Summary -->
          <div v-if="hasActiveFilters" class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">Active Filters ({{ filterCount }})</small>
              <b-button
                size="sm"
                variant="outline-danger"
                @click="clearAllFilters"
              >
                Clear All
              </b-button>
            </div>
          </div>

          <!-- Dynamic Facets -->
          <Facets2 :facets="facets" />

          <!-- Feedback Component -->
          <feedback
            subject="Search"
            :name="textQuery"
            :urn="textQuery"
          />
        </b-col>

        <!-- Results -->
        <b-col md="9" class="results">
          <ResultHeader2
            :current-count="results.length"
            :total-count="results.length"
            :filters="activeFiltersDisplay"
            :loading="isLoading"
          />

          <!-- Error Display -->
          <b-alert v-if="error" variant="danger" show>
            <strong>Search Error:</strong> {{ error }}
          </b-alert>

          <!-- Results Display -->
          <Results2
            :results="results"
            :loading="isLoading"
          />
        </b-col>
      </b-row>
    </b-overlay>
  </b-container>
</template>

<script>
import { onMounted, provide } from 'vue';
import { useRoute } from 'vue-router';
import { useSearch } from '@/composables/useSearch.js';
import { useConfig } from '@/composables/useConfig.js';
import Facets2 from './Facets2.vue';
import ResultHeader2 from './ResultHeader2.vue';
import Results2 from './Results2.vue';
import feedback from '@/components/feedback/feedback.vue';

export default {
  name: "Search2",

  components: {
    Facets2,
    ResultHeader2,
    Results2,
    feedback,
  },

  setup() {
    const route = useRoute();
    const { config, facets } = useConfig();

    const search = useSearch(config.value);

    provide('searchComposable', search);

    onMounted(() => {
      if (route.query) {
        search.updateFromUrl(route.query);
      }
    });

    return {
      ...search,
      facets
    };
  }
};
</script>

<style scoped>
.sidebar {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
}

.results {
  padding-left: 1rem;
}

.form-label {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
</style>
