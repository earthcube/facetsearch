<template>
  <b-container fluid="md" class="mt-4">
    <b-row class="align-items-center mb-3">
      <b-col cols="auto">
        <back-button />
      </b-col>
    </b-row>

    <div v-if="isLoadingCatalog" class="text-center my-5">
      <b-spinner variant="primary" />
      <p class="mt-2">Loading catalog for {{ source }}&hellip;</p>
    </div>

    <div v-else-if="notFound">
      <b-alert show variant="warning">
        No DataCatalog was found for source <strong>{{ source }}</strong
        >.
      </b-alert>
    </div>

    <div v-else-if="error">
      <b-alert show variant="danger">{{ error }}</b-alert>
    </div>

    <div v-else-if="catalog">
      <b-card class="mb-4" bg-variant="light" border-variant="secondary">
        <b-card-title v-html="catalog.name || source"></b-card-title>
        <b-card-text v-if="catalog.description" v-html="catalog.description"></b-card-text>
        <b-card-text class="text-muted small mb-0">
          Source: {{ source }} &mdash; {{ totalCount.toLocaleString() }} dataset{{
            totalCount === 1 ? "" : "s"
          }}
        </b-card-text>
      </b-card>

      <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <span v-if="totalCount > 0">
            Showing {{ displayStart.toLocaleString() }}-{{ displayEnd.toLocaleString() }} of
            {{ totalCount.toLocaleString() }} datasets
          </span>
        </div>
        <b-form-select
          :value="pageSize"
          :options="pageSizeSelectOptions"
          size="sm"
          style="width: 130px"
          @input="setPageSize"
        />
      </div>

      <div v-if="isLoadingDatasets" class="text-center my-4">
        <b-spinner small variant="primary" />
      </div>

      <b-list-group v-else class="mb-3">
        <b-list-group-item v-for="(ds, index) in datasets" :key="ds.subj || index">
          <h6 class="mb-1">
            <a v-if="ds.url" :href="ds.url" target="_blank" rel="noopener" v-html="ds.name"></a>
            <span v-else v-html="ds.name"></span>
          </h6>
          <p v-if="ds.description" class="small text-muted mb-1" v-html="ds.description"></p>
          <div v-if="ds.kw && ds.kw.length">
            <b-badge
              v-for="(kw, kwIndex) in ds.kw"
              :key="kwIndex"
              variant="info"
              class="mr-1"
              >{{ kw }}</b-badge
            >
          </div>
        </b-list-group-item>
        <b-list-group-item v-if="datasets.length === 0">
          No datasets on this page.
        </b-list-group-item>
      </b-list-group>

      <b-pagination
        v-if="totalPages > 1"
        :value="page"
        :total-rows="totalCount"
        :per-page="pageSize"
        :limit="7"
        align="center"
        size="sm"
        @input="setPage"
      />
    </div>
  </b-container>
</template>

<script>
import backButton from "@/components/backButton.vue";
import { useCatalog } from "@/composables/useCatalog.js";
import { useConfig } from "@/composables/useConfig.js";

export default {
  name: "DataCatalogView",
  components: { backButton },
  props: {
    source: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { config } = useConfig();
    return useCatalog(config, props.source);
  },
  computed: {
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
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";
</style>
