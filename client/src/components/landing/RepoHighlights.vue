<template>
  <b-container v-if="currentTenant" fluid="md" class="mt-5 px-0">
    <b-carousel
      id="carousel-landing"
      v-model="slide"
      :interval="4000"
      fade
      indicators
    >
      <b-carousel-slide>
        {{ currentTenant.landing_introduction }}
      </b-carousel-slide>
    </b-carousel>
    <b-container fluid="md" class="mt-5">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Top Repositories crawled and indexed</h5>
        <span class="text-muted d-flex align-items-center gap-1">
          See all repositories in our
          <b-link :to="{ name: 'about' }" class="px-1">About</b-link>
          page
        </span>
      </div>
    </b-container>

    <b-card-group columns class="d-flex flex-wrap justify-content-start mt-4">
      <b-card
        v-for="(item, index) in reports"
        :key="index"
        no-body
        class="text-center card-equal d-flex flex-column"
        style="flex: 0 1 340px"
      >
        <b-card-body
          v-if="item.source != 'geocodes_demo_datasets'"
          class="d-flex flex-column flex-grow-1"
        >
          <b-card-title>
            <b-link
              target="_blank"
              class="d-flex flex-column align-items-center"
              :href="item.website"
            >
              <div
                v-if="visibleImages[index]"
                class="logo d-flex justify-content-center align-items-center"
              >
                <b-img
                  fluid
                  :src="'/images/repo/' + item.image"
                  class="card-logo"
                  @error="visibleImages[index] = false"
                ></b-img>
              </div>

              <div class="mt-3">{{ item.title }}</div>
            </b-link>
          </b-card-title>

          <b-card-text
            class="d-flex flex-column flex-grow-1 justify-content-between"
          >
            <i v-if="item.records > 0"
              >{{ item.records }} record{{ item.records == 1 ? "" : "s" }}</i
            >

            <div
              class="mt-3 small text-left description-container"
              v-html="item.description"
            ></div>

            <div class="mt-auto pt-3 text-left">
              <router-link
                :to="{
                  name: 'report',
                  params: { source: item.source },
                  query: { description: item.description },
                }"
                >Reports</router-link
              >
            </div>
          </b-card-text>
        </b-card-body>
      </b-card>
    </b-card-group>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";
import { tenantDefault } from "@/config.js";

export default {
  name: "RepoHighlights",
  data() {
    return {
      slide: 0,
      reports: null,
      visibleImages: [],
    };
  },
  computed: {
    ...mapState(["FacetsConfig"]),
    currentCommunity() {
      return this.FacetsConfig.COMMUNITY;
    },
    currentTenant() {
      if (!this.tenantData?.tenant) return tenantDefault.tenant[0];
      return (
        this.tenantData.tenant.find(
          (t) => t.community === this.currentCommunity
        ) || tenantDefault.tenant[0]
      );
    },
    tenantData() {
      return this.$store.getters.getTenantData;
    },
  },
  mounted() {
    const s3base = this.FacetsConfig.S3_REPORTS_URL;
    // Optional: skip OSS request (avoids console 403 when bucket is private / local dev).
    if (
      import.meta.env.VITE_SKIP_LANDING_REPORT_STATS === "true" ||
      this.FacetsConfig.FETCH_LANDING_REPORT_STATS === false
    ) {
      this.reports = [];
      return;
    }
    if (!s3base || String(s3base).trim() === "") {
      this.reports = [];
      return;
    }
    let community = this.FacetsConfig.COMMUNITY;
    if (
      community === undefined ||
      community === null ||
      community.trim().length === 0
    )
      community = "all";
    this.reportsJson = `${s3base}tenant/${community}/latest/report_stats.json`;
    this.fetchAllReports();
  },
  methods: {
    /**
     * Loads "Top Repositories" cards from S3_REPORTS_URL/.../report_stats.json.
     * A browser console 403/404 here means the OSS object is not publicly readable or missing —
     * not a search/SPARQL issue. EarthCube ops must allow anonymous GET on that path (or proxy via API).
     */
    fetchAllReports() {
      axios
        .get(this.reportsJson, { timeout: 10000 })
        .then((response) => {
          this.reports = response.data
            .sort((a, b) => b.records - a.records) // Sort in descending order
            .slice(0, 3);
          this.visibleImages = this.reports.map(() => true);
        })
        .catch(() => {
          this.reports = [];
        });
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

//use v-deep to style the inner carousel components
.carousel:deep(.carousel-inner) {
  .carousel-item {
    height: 240px;

    background: {
      color: $white;
    }

    .carousel-caption {
      top: 0px;
      left: 0px !important;
      right: 0px !important;
      bottom: auto !important;

      color: $gray-500;

      padding: 0px;

      font: {
        size: 140%;
      }
      line: {
        height: 140%;
      }

      @include media-breakpoint-down(md) {
        font: {
          size: 120%;
        }

        .text-nowrap {
          //remove no wrap on small screens
          white-space: normal !important;
        }
      }
    }
  }
}

.card-equal {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 300px; /* Adjust width as needed */
}

.description-container {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4; /* Adjust number of lines before truncation */
  -webkit-box-orient: vertical;
}

.card-logo {
  max: {
    width: 100px;
  }
  max: {
    height: 100px;
  }
}
</style>
