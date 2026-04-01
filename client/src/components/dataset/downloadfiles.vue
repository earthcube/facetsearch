<template>
  <div class="download-list">
    <div
      v-for="(dl, index) in m.s_downloads || []"
      :key="index"
      class="download-list__item"
    >
      <b-button
        block
        size="sm"
        variant="primary"
        class="download-list__file-btn"
        :href="dl.contentUrl"
      >
        <span class="download-list__file-label">{{ dl.linkName }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-download download-list__icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"
          />
          <path
            d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"
          />
        </svg>
      </b-button>

      <div
        v-if="hasVisibleNotebook(dl)"
        class="download-list__notebooks"
      >
        <div class="download-list__notebooks-label text-muted small">
          Open in
        </div>
        <b-button
          v-for="(nb, nbindex) in notebooksservers"
          v-show="nbBinderShow(nb, dl.contentUrl, dl.encodingFormat)"
          :key="nbindex"
          block
          size="sm"
          variant="primary"
          class="download-list__nb-btn"
          :href="nbBinderUrl(nb, dl.contentUrl, dl.encodingFormat, d)"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ nb.name }}
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { mapState } from "vuex";

export default {
  name: "Downloadfiles",
  props: { d: String, m: Object },
  data() {
    return {
      notebooksservers: [],
    };
  },
  mounted() {
    this.notebooksservers = this.FacetsConfig.NOTEBOOKS || [];
  },
  computed: {
    ...mapState(["FacetsConfig"]),
  },

  methods: {
    hasVisibleNotebook(dl) {
      if (!dl || !this.notebooksservers?.length) return false;
      return this.notebooksservers.some((nb) =>
        this.nbBinderShow(nb, dl.contentUrl, dl.encodingFormat)
      );
    },
    nbBinderShow(NbConfig, contentUrl, format) {
      let show = true;
      const datatypes = NbConfig.formats ? NbConfig.formats : ["*"];

      if (Array.isArray(datatypes)) {
        if (datatypes.includes("*")) return true;
        show = _.indexOf(datatypes, format) > -1;
      } else {
        if (datatypes === "*") return true;
        if (datatypes === format) show = true;
      }

      return show;
    },
    nbBinderUrl(NbConfig, contentUrl, format, urn, page = "") {
      format = format.replace("#", "<hash>");
      format = encodeURIComponent(format);

      contentUrl = contentUrl.replace("#", "<hash>");
      const serverBase = NbConfig.baseurl;
      let dispatcherPage = NbConfig.dispatcherPage;

      const nbParamsT = _.template(
        NbConfig.contentQuery,
        this.FacetsConfig.ES_TEMPLATE_OPTIONS
      );
      const nbPageT = _.template(
        NbConfig.pageTemplate,
        this.FacetsConfig.ES_TEMPLATE_OPTIONS
      );

      let nbParams = nbParamsT({
        contentUrl: contentUrl,
        format: format,
        urn: urn,
      });
      let nbPage = nbPageT({ notebooktorun: page });
      let params = "";
      if (Object.prototype.hasOwnProperty.call(NbConfig, "dispatcherPage")) {
        params = `${dispatcherPage}&${nbParams}&${nbPage}`;
      } else {
        params = `${nbParams}&${nbPage}`;
      }

      if (NbConfig.binderEncodeParameters) {
        const params2 = `?${nbParams}&${nbPage}`;
        if (Object.prototype.hasOwnProperty.call(NbConfig, "dispatcherPage")) {
          params = `${dispatcherPage}${params2}`;
        }
      }
      return `${serverBase}?${params}`;
    },
  },
};
</script>

<!-- unscoped to override json-view white-space:nowrap -->
<style>
.value-key {
  white-space: normal !important;
}
</style>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.download-list {
  width: 100%;
  min-width: 0;
}

.download-list__item {
  width: 100%;

  &:not(:first-child) {
    margin-top: $spacer;
    padding-top: $spacer;
    border-top: 1px solid $gray-300;
  }
}

.download-list__file-btn {
  display: flex !important;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: $spacer * 0.5;
  width: 100% !important;
  min-height: 2.75rem;
  padding-top: $spacer * 0.75 !important;
  padding-bottom: $spacer * 0.75 !important;
  white-space: normal !important;
  text-align: left !important;
}

.download-list__file-label {
  flex: 1 1 auto;
  min-width: 0;
  word-break: break-word;
  line-height: 1.35;
}

.download-list__icon {
  flex-shrink: 0;
}

.download-list__notebooks {
  margin-top: $spacer * 0.75;
  width: 100%;
}

.download-list__notebooks-label {
  margin-bottom: $spacer * 0.35;
  font-weight: 600;
}

.download-list__nb-btn {
  width: 100% !important;
  margin-bottom: $spacer * 0.35;
  white-space: normal !important;
  word-break: break-word;
  line-height: 1.35;
  text-align: center;
  padding-top: $spacer * 0.5 !important;
  padding-bottom: $spacer * 0.5 !important;
}

@include media-breakpoint-down(md) {
  .download-list__file-btn,
  .download-list__nb-btn {
    padding-top: ($spacer * 1.1) !important;
    padding-bottom: ($spacer * 1.1) !important;
  }
}
</style>
