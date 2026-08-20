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
        :active-filters="activeFilters"
        :connected-tools-map="connectedToolsMap"
      />
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
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
    },
    activeFilters: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      // graph IRI -> boolean; undefined while the batch query is in flight
      connectedToolsMap: {},
      toolsRequestId: 0
    };
  },

  watch: {
    results: {
      immediate: true,
      handler(newResults) {
        this.fetchConnectedTools(newResults);
      }
    }
  },

  methods: {
    ...mapActions(['hasConnectedToolsBatch']),
    async fetchConnectedTools(results) {
      const requestId = ++this.toolsRequestId;
      this.connectedToolsMap = {};
      const graphs = [...new Set((results || []).map((r) => r.g).filter(Boolean))];
      if (graphs.length === 0) return;
      try {
        const map = await this.hasConnectedToolsBatch(graphs);
        if (requestId !== this.toolsRequestId) return; // results changed mid-flight
        this.connectedToolsMap = map;
      } catch (err) {
        console.info('fetchConnectedTools:' + err);
        if (requestId !== this.toolsRequestId) return;
        // stop the per-card spinners; badge simply not shown
        this.connectedToolsMap = Object.fromEntries(graphs.map((g) => [g, false]));
      }
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