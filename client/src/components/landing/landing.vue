<template>
  <b-container fluid="md" class="mt-5">
    <!-- allow logo to size according to container. fill with primary color from bootstrap variables -->
    <b-container class="col-md-5 pt-5">
      <template v-if="currentTenant">
        <span class="logo">{{ currentTenant.name }}</span>
      </template>
       <template v-else>
        <logoGeoCodes fill="#18598b" width="100%" />
      </template>
    </b-container>

    <b-container class="col-md-5 mt-4">
      <b-form @submit="onSubmit" @reset="onReset">
        <b-input-group>
          <b-form-input
            id="q"
            v-model="q"
            name="q"
            placeholder="Search"
            aria-label="Search"
          ></b-form-input>

          <b-input-group-append>
            <b-button variant="primary" type="submit" class="mr-2"
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-search"
                viewBox="0 0 16 16"
              >
                <path
                  d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"
                /></svg
            ></b-button>
            <VueToggles
              id="checkbox"
              :value="searchExactMatch"
              :height="35"
              :width="75"
              checked-text="AND"
              unchecked-text="OR"
              checked-bg="#777"
              :disabled="false"
              @click="searchExactMatch = !searchExactMatch"
            />
            <b-tooltip target="checkbox1" placement="right" triggers="hover">
              {{
                searchExactMatch
                  ? "Unselect to match any of the search terms"
                  : "Select to match all of the search terms"
              }}
            </b-tooltip>
          </b-input-group-append>
        </b-input-group>

        <!--TODO: work on the radio buttons and show them -->
        <b-form-group v-show="false" class="mt-2">
          <b-form-radio-group
            id="resourceType"
            v-model="toolOptionsSelected"
            :options="toolOptions"
            name="resourceType"
          ></b-form-radio-group>
        </b-form-group>
      </b-form>
    </b-container>

    <b-container v-if="currentTenant" fluid="md" class="mt-5">
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
<!--        <b-carousel-slide> a schema.org/Dataset search </b-carousel-slide>-->
<!--        <b-carousel-slide>-->
<!--          Geoscience Cyberinfrastructure-->
<!--          <span class="text-nowrap">for Open Discovery</span>-->
<!--          <span class="text-nowrap">in the Earth Sciences</span>-->
<!--        </b-carousel-slide>-->
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
        style="flex: 0 1 340px;"
      >
        <b-card-body v-if="item.source != 'geocodes_demo_datasets'" class = "d-flex flex-column flex-grow-1">
          <b-card-title>
            <b-link
              target="_blank"
              class="d-flex flex-column align-items-center"
              :href="item.website"
            >
              <div v-if="visibleImages[index]"
                class="logo d-flex justify-content-center align-items-center"
              >
                <b-img fluid :src="'/images/repo/' + item.image" class="card-logo"
                @error="visibleImages[index] = false"></b-img>
              </div>

              <div class="mt-3">{{ item.title }}</div>
            </b-link>
          </b-card-title>

          <b-card-text class="d-flex flex-column flex-grow-1 justify-content-between">
            <i v-if="item.records > 0"
              >{{ item.records }} record{{ item.records == 1 ? "" : "s" }}</i
            >

            <div class="mt-3 small text-left description-container" v-html="item.description"></div>

            <div class="mt-auto pt-3 text-left">
              <router-link
                :to="{ name: 'report', params: { source: item.source}, query: { description: item.description }}"
                >Reports</router-link>
            </div>
          </b-card-text>

          <!--
//left this here in case the description was too much to be shown all the time (use collapse). problem is, sometimes expanding forces an item to move to a different column (feels like it disappears)
//could use accordian option to only allow a single card to be expanded at a time...but still doesn't solve the issue completely and why this was moved to show the description by default
                    <b-card-text
                        v-b-toggle="'collapse_repository_' + index"
                    >
                        <i v-if="item.record_count > 0">{{item.record_count}} record{{(item.record_count == 1) ? '' : 's'}}</i>

                        <b-collapse class="text-left small"
                            :id="'collapse_repository_' + index"
                        >
                            <div class="mt-3" v-html="item.description"></div>
                        </b-collapse>

                        <div class="mt-3">
                            <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>
                            <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>
                        </div>
                    </b-card-text>
-->
        </b-card-body>
      </b-card>
    </b-card-group>
    </b-container>
  </b-container>
</template>

<script>
//import VueRouter from 'vue-router'
import logoGeoCodes from "@/components/logos/logoGeoCodes.vue";
import {mapGetters, mapMutations, mapState} from "vuex";
import VueToggles from "vue-toggles";
import axios from "axios";
import yaml from "js-yaml";


export default {
  name: "Landing",
  components: { logoGeoCodes, VueToggles },
  data() {
    return {
      q: "",
      searchExactMatch: false,
      toolOptionsSelected: "all",
      toolOptions: [
        { value: "all", text: "All" },
        { value: "tool", text: "Tool" },
        { value: "data", text: "Data" },
      ],
      slide: 0,
      reports: null,
      visibleImages: []
    };
  },
  computed: {
    ...mapState(["FacetsConfig"]),
    currentCommunity() {
      return this.FacetsConfig.COMMUNITY;
    },
    currentTenant() {
      if (!this.tenantData?.tenant) return null;
      return this.tenantData.tenant.find(
        t => t.community === this.currentCommunity
      ) || null;
    },
    tenantData() {
      return this.$store.getters.getTenantData;
    }
  },
  mounted() {
    const s3base = this.FacetsConfig.S3_REPORTS_URL;
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
    ...mapMutations(["setTextQuery", "setResourceTypeQuery"]),
    onSubmit() {
      var query = this.q;
      var resourceType = this.toolOptionsSelected;
      var exact =  this.searchExactMatch
      this.$router.push({
        name: "Search",
        query: {
          q: query,
          searchExactMatch: exact,
          resourceType: resourceType,
        },
      });
    },
    onReset() {
      this.setTextQuery("");
    },
    fetchAllReports() {
      axios
        .get(this.reportsJson)
        .then((response) => {
          this.reports = response.data
            .sort((a, b) => b.records - a.records) // Sort in descending order
            .slice(0, 3)
          this.visibleImages = this.reports.map(() => true);
        });
    }
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

      //                @include translate(0%, 50%); //set top: 50% and activate this line if you want vertically centered text

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

.logo {
    font-family: 'Open Sans', sans-serif;
    font-size: 72px;
    color: #2A5279;
    letter-spacing: 2px;
    display: inline-flex;
    align-items: center;
}

.card-logo{
  max: {
    width: 100px;
  }
  max: {
    height: 100px;
  }
}
</style>
