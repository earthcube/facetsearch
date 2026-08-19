<template>
  <b-container fluid="md" class="mt-4">
    <b-row class="align-items-center mb-3">
      <b-col cols="auto">
        <back-button />
      </b-col>
    </b-row>

    <div v-if="isLoadingCatalog" class="text-center py-5">
      <b-spinner class="me-2"></b-spinner>
      <span>Loading catalog for {{ source }}&hellip;</span>
    </div>

    <div v-else-if="notFound" class="no-results text-center py-5">
      <i class="fas fa-search fa-3x text-muted mb-3"></i>
      <h5 class="text-muted">No data catalog found</h5>
      <p class="text-muted">
        No DataCatalog has been harvested for source <strong>{{ source }}</strong>
      </p>
    </div>

    <div v-else-if="error">
      <b-alert show variant="danger">{{ error }}</b-alert>
    </div>

    <div v-else-if="catalog">
      <b-card tag="section" class="rounded-0 catalog-master mb-3">
        <b-card-title class="name"
          ><span v-html="catalog.name || source"></span
        ></b-card-title>
        <b-card-title class="publisher">{{ source }}</b-card-title>

        <b-card-text v-if="catalog.description" class="description small mb-2"
          ><span v-html="catalog.description"></span
        ></b-card-text>

        <div v-for="agent in catalogAgents" :key="agent.label" class="agents">
          <b-badge variant="primary" class="result-badge mr-2 flex-shrink-0">
            {{ agent.label }}
          </b-badge>
          <div class="values">
            <a
              v-if="isLink(agent.value)"
              :href="agent.value"
              class="agent mx-2"
              target="_blank"
              rel="noopener"
              >{{ agent.value }}</a
            >
            <span v-else class="agent mx-2 text-secondary">{{ agent.value }}</span>
          </div>
        </div>

        <div class="badges mt-2">
          <b-badge variant="data" class="result-badge mr-1">
            <b-icon class="mr-1" icon="server"></b-icon>
            {{ totalCount.toLocaleString() }}
            {{ totalCount === 1 ? "dataset" : "datasets" }}
          </b-badge>
          <b-badge v-if="catalog.dateCreated" variant="light" class="result-badge mr-1">
            <b-icon class="mr-1" icon="clock"></b-icon>
            generated {{ catalog.dateCreated }}
          </b-badge>
        </div>
      </b-card>

      <div class="result-header mb-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="result-count">
            <h5 class="mb-1">
              <span v-if="isLoadingDatasets">
                <b-spinner small class="me-2"></b-spinner>
                Loading&hellip;
              </span>
              <span v-else-if="totalCount > 0">
                Showing {{ displayStart.toLocaleString() }}-{{ displayEnd.toLocaleString() }} of
                {{ totalCount.toLocaleString() }} datasets
              </span>
              <span v-else>0 datasets</span>
            </h5>
          </div>

          <div class="sort-controls">
            <b-form-select
              :value="pageSize"
              :options="pageSizeSelectOptions"
              size="sm"
              class="page-size-select"
              @input="setPageSize"
            />
          </div>
        </div>

        <div v-if="totalPages > 1" class="pagination-row mt-2">
          <b-pagination
            :value="page"
            :total-rows="totalCount"
            :per-page="pageSize"
            :limit="7"
            align="center"
            size="sm"
            @input="setPage"
          />
        </div>
      </div>

      <Results2 :results="datasets" :loading="isLoadingDatasets" />
    </div>
  </b-container>
</template>

<script>
import backButton from "@/components/backButton.vue";
import Results2 from "@/components/facetsearch/Results2.vue";
import { useCatalog } from "@/composables/useCatalog.js";
import { useConfig } from "@/composables/useConfig.js";

export default {
  name: "DataCatalogView",
  components: { backButton, Results2 },
  props: {
    source: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { config } = useConfig();
    return useCatalog(config, () => props.source);
  },
  computed: {
    catalogAgents() {
      return [
        ["Organization", this.catalog?.organization],
        ["Publisher", this.catalog?.publisher],
        ["Provider", this.catalog?.provider],
      ]
        .map(([label, value]) => ({ label, value: String(value ?? "").trim() }))
        .filter((entry) => entry.value.length > 0);
    },
    displayStart() {
      if (this.totalCount <= 0) return 0;
      return (this.page - 1) * this.pageSize + 1;
    },
    displayEnd() {
      if (this.totalCount <= 0) return 0;
      return Math.min(this.totalCount, this.page * this.pageSize);
    },
    totalPages() {
      if (this.pageSize <= 0) return 1;
      return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    },
    pageSizeSelectOptions() {
      return (this.pageSizeOptions || []).map((size) => ({
        value: Number(size),
        text: `${Number(size)} / page`,
      }));
    },
  },
  watch: {
    source() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    isLink(value) {
      return /^https?:\/\//i.test(String(value));
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

// Mirrors article.result-item-master in ResultItem2, minus the click affordance.
section.catalog-master {
  border: 2px solid $gray-400;
  box-shadow: none;

  .card-body {
    padding: ($spacer * 1.5) $spacer;
  }

  .badge {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    padding: 0 8px;
    height: 26px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;

    .b-icon {
      font-size: 12px;
      line-height: 1;
    }
  }
}

.agents {
  display: flex;
  align-items: flex-start;

  .values {
    font: {
      size: 80%;
    }
    display: flex;
    flex-wrap: wrap;

    .agent {
      padding: {
        left: 0;
      }
    }
  }
}

.name {
  color: $gray-800;

  font: {
    weight: 600;
    size: 120%;
  }
  line: {
    height: 120%;
  }
}

.publisher {
  color: $gray-500;

  margin: {
    top: -($spacer * 0.4);
  }

  font: {
    style: italic;
    size: 90%;
  }
}

.description {
  color: $gray-500;
}

.result-header {
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 1rem;
}

.page-size-select {
  width: 120px;
}

.pagination-row :deep(.pagination) {
  margin-bottom: 0;
}

.no-results {
  color: #6c757d;
}
</style>
