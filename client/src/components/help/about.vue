<template>
  <b-container fluid="md" class="mt-5">
    <!-- intro paragraph -->
    <b-row class="align-items-stretch">
      <b-col cols="6" class="d-flex">
        <b-jumbotron text-variant="white" bg-variant="primary" class="w-100 d-flex flex-column">
          <template #header>
            <span class="text-white">What is GeoCODES?</span>
          </template>

          <template #lead>
            <span class="p-5 flex-grow-1">
              GeoCODES is an NSF Earthcube program effort to better enable
              cross-domain discovery of and access to geoscience data and research
              tools. GeoCODES is made up of three components respectively.
            </span>
          </template>
        </b-jumbotron>
      </b-col>

      <b-col cols="6" class="d-flex">
        <b-jumbotron text-variant="white" :style="{ backgroundColor: currentTenant.color || secondary }" class="w-100 d-flex flex-column">
          <template #header>
<!--            <span class="text-white">You are on {{ this.tenantData.tenant[0].community }}</span>-->
            <span class="text-white">You are on {{ currentTenant.name }}</span>
          </template>

          <template #lead>
            <span class="p-5 flex-grow-1">
              {{ currentTenant.description }}
            </span>
          </template>
        </b-jumbotron>
      </b-col>
    </b-row>


    <b-card-group deck>
      <b-card
        bg-variant="light"
        class="text-center"
        title="An evolving standard"
      >
        <b-card-text
          >for exposing data called
          <a
            href="https://github.com/ESIPFed/science-on-schema.org"
            target="_blank"
            rel="noopener"
            class="text-nowrap"
            >science on schema</a
          ></b-card-text
        >
      </b-card>

      <b-card bg-variant="light" class="text-center" title="A set of tools">
        <b-card-text
          >to index relevant data from partners within the Council of Data
          Facilities who have adopted science on schema, plus a prototype portal
          to query that data</b-card-text
        >
      </b-card>

      <b-card
        bg-variant="light"
        class="text-center"
        title="A Resource Registry"
      >
        <b-card-text
          >by which to
          <a
            href="http://tinyurl.com/2register-ecrr"
            target="_blank"
            rel="noopener"
            >register</a
          >
          and
          <a
            href="http://www.earthcube.org/resourceregistry/"
            target="_blank"
            rel="noopener"
            >discover</a
          >
          <span class="text-nowrap">relevant tools</span></b-card-text
        >
      </b-card>
    </b-card-group>

    <!--
in case more intro paragraph text is needed
        <b-container class="col-md-8 mt-5">
        </b-container>
-->

    <b-container fluid="md" class="mt-5">
      <h2>
         <a
          :href="currentTenant.url"
          target="_blank"
          >{{ currentTenant.name }}</a
        >
      </h2>
      <h5>Repositories crawled and indexed</h5>
    </b-container>

    <b-card-group columns class="d-flex flex-wrap justify-content-start mt-4">
      <b-card
        v-for="(item, index) in reports"
        :key="index"
        no-body
        class="text-center card-equal d-flex flex-column"
    style="flex: 0 1 356px;"
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
                <b-img fluid :src="'/images/repo/' + item.image"
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
                :to="{ name: 'report', params: { source: item.source}, query: { description: item.description } }"
                >Reports</router-link
              >
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

    <b-container fluid="md" class="mt-5">
      <h2>Feedback</h2>

      <p>
        <a
          href="https://github.com/earthcube/facetsearch/issues"
          target="_blank"
          >Create an issue</a
        >
        and a
        <a href="mailto:feedback@geocodes.earthcube.org">email feedback.</a>
      </p>
      <p>
        <a href="https://github.com/earthcube/facetsearch/" target="_blank"
          >Source Code
        </a>
      </p>
      <p>Version: {{ appVersion }} Date: {{ appDate }}</p>
      <p>
        Citation:
        <cite
          >McHenry K, Bobak M, Coakley K, Fils D, Gatzke L, Zhang B, Kooper R,
          Richard S, Valentine D, Zaslavsky I, Shepherd, A & Lingerfelt E.
          (2021). GeoCODES. EarthCube. https://geocodes.earthcube.org.
        </cite>
      </p>
    </b-container>

    <b-container fluid="md" class="mt-5">
      <h2>Supported by</h2>

      <p>Work on this site is supported by</p>

      <div>
        <img
          src="https://new.nsf.gov/themes/custom/nsf_theme/components/sdc-components/molecules/logo/logo-desktop.svg"
          width="150"
          alt="NSF"
        />
      </div>
      <h5>NSF EarthCube</h5>
      <div><i>NSF award #1928208</i></div>

      <p class="mt-4">
        <a href="https://github.com/earthcube" target="_blank">Open source</a>
        under the
        <a href="https://opensource.org/licenses/MIT" target="_blank"
          >MIT License</a
        >
      </p>
    </b-container>
    <div>
      <b-link :to="{ name: 'configuration' }" class="mr-0">Config</b-link>
    </div>
  </b-container>
</template>

<script>
import axios from "axios";
import $ from "jquery";
import { mapState, mapGetters, mapActions} from "vuex";
import yaml from 'js-yaml';

export default {
  name: "about.vue",
  data() {
    return {
      reports: null,
      title: 'Not Set',
      community: 'Not Set',
      community_url: null,
      visibleImages : []
    };
  },
  computed: {
    ...mapState(["FacetsConfig"]),
    ...mapGetters(["appVersion", "appDate", "getTenantData"]),
    tenantData() {
      return this.$store.getters.getTenantData;
    },
    currentCommunity() {
      return this.FacetsConfig.COMMUNITY;
    },
    currentTenant() {
      if (!this.tenantData?.tenant) return null;
      return this.tenantData.tenant.find(
        t => t.community === this.currentCommunity
      ) || null;
    },
    bgColor() {
      return this.generateColorFromTitle("Geochemistry");
    }
  },
  async mounted() {
    const s3base = this.FacetsConfig.S3_REPORTS_URL;
    let community = this.FacetsConfig.COMMUNITY;
    // this.title = 'Get From Tennant ' // tenant.yaml[communitti].title
    // this.community_url = 'http://example.com' // tenant.yaml[communitti].url
    // if (
    //   community === undefined ||
    //   community === null ||
    //   community.trim().length === 0
    // )
    //   community = "all";
    this.reportsJson = `${s3base}tenant/${community}/latest/report_stats.json`;
    this.fetchAllReports();
  },
  methods: {
    // try to avoid jquery hacks.
    // do as a bootstrap modal. https://bootstrap-vue.org/docs/components/modal
    showModal(t) {
      console.log(t);
      $("#" + t).modal("show");
    },
    fetchAllReports() {
      axios.get(this.reportsJson).then((response) => {
        this.reports = response.data;
        this.visibleImages = this.reports.map(() => true);
      });
    },
    // Function to generate a color from the title using a hash
    generateColorFromTitle(title) {
      let hash = 0;
      for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);  // Hashing formula
      }
      // Generate a color from the hash
      const color = `#${((hash >> 8) & 0xFF).toString(16).padStart(2, '0')}${((hash >> 16) & 0xFF).toString(16).padStart(2, '0')}${((hash >> 24) & 0xFF).toString(16).padStart(2, '0')}`;
      return color;
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.logo {
  max: {
    width: 100px;
  }
  max: {
    height: 100px;
  }
}

.card-text {
  &.collapsed .when_closed,
  &.not-collapsed .when_open {
    display: none;
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

.customDropdown {
  background-color: white;
}

.button-file {
  border: 0;
  background: transparent;
  color: gray;
}

.customTable {
  background: #f8f9f9;
}

th {
  display: table-cell;
  vertical-align: inherit;
  text-align: center;
  background: #18598b;
  color: white;
}
</style>
