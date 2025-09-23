 <template>
  <div class="results-container">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <b-spinner class="me-2"></b-spinner>
      <span>Loading results...</span>
    </div>

    <!-- No Results -->
    <div v-else-if="results.length === 0" class="no-results text-center py-5">
      <i class="fas fa-search fa-3x text-muted mb-3"></i>
      <h5 class="text-muted">No results found</h5>
      <p class="text-muted">Try adjusting your search terms or filters</p>
    </div>

    <!-- Results List -->
    <div v-else class="results-list">
      <ResultItem2
        v-for="(result, index) in results"
        :key="result.id || result.subj || index"
        :result="result"
        :index="index"
      />
    </div>
  </div>
</template>

<script>
import ResultItem2 from './ResultItem2.vue';

export default {
  name: "Results2",

  components: {
    ResultItem2
  },

  props: {
    results: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.results-container {
  min-height: 400px;
}

.no-results {
  color: #6c757d;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>