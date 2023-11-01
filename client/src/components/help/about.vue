<template>
    <b-container fluid="md" class="mt-5">
        <!-- intro paragraph -->
        <b-jumbotron text-variant="white" bg-variant="primary">
            <template #header><span class="text-white">What is GeoCODES?</span></template>

            <template #lead><span class="p-5">
                GeoCODES is an NSF Earthcube program effort to better enable cross-domain discovery of and access to geoscience data and research tools. GeoCODES is made up of three components respectively.
            </span></template>
        </b-jumbotron>

        <b-card-group deck>
            <b-card bg-variant="light" class="text-center" title="An evolving standard">
                <b-card-text>for exposing data called <a href="https://github.com/ESIPFed/science-on-schema.org" target="_blank" rel="noopener" class="text-nowrap">science on schema</a></b-card-text>
            </b-card>

            <b-card bg-variant="light" class="text-center" title="A set of tools">
                <b-card-text>to index relevant data from partners within the Council of Data Facilities who have adopted science on schema, plus a prototype portal to query that data</b-card-text>
            </b-card>

            <b-card bg-variant="light" class="text-center" title="A Resource Registry">
                <b-card-text>by which to <a href="http://tinyurl.com/2register-ecrr" target="_blank" rel="noopener">register</a> and <a href="http://www.earthcube.org/resourceregistry/" target="_blank" rel="noopener">discover</a> <span class="text-nowrap">relevant tools</span></b-card-text>
            </b-card>
        </b-card-group>

<!--
in case more intro paragraph text is needed
        <b-container class="col-md-8 mt-5">
        </b-container>
-->

        <b-container fluid="md" class="mt-5">
            <h2>Council of Data Facilities (<a href="https://www.earthcube.org/council-of-data-facilities" target="_blank">CDF</a>)</h2>
            <h5>Repositories crawled and indexed</h5>
        </b-container>

        <b-card-group columns class="mt-4">
            <b-card no-body class="text-center"
                v-for="(item, index) in info"
                v-bind:key="index"
            >

                <b-card-body v-if="item.source!='geocodes_demo_datasets'">
                    <b-card-title>
                        <b-link target="_blank" class="d-flex flex-column align-items-center"
                            :href="item.website"
                        >
                            <div class="logo d-flex justify-content-center align-items-center">
                                <b-img fluid
                                    :src="'/images/repo/' + item.image"
                                ></b-img>
                            </div>

                            <div class="mt-3">{{item.title}}</div>
                        </b-link>
                    </b-card-title>

                    <b-card-text>
                        <i v-if="item.record_count > 0">{{item.record_count}} record{{(item.record_count == 1) ? '' : 's'}}</i>

                        <div class="mt-3 small text-left" v-html="item.description"></div>

                        <div class="d-flex justify-content-end" >
                            <b-button size="x-small" class="button-file" id="show-btn" @click="$bvModal.show(item.source)">
                                Reports
                            </b-button>

                            <b-modal size="lg" :id="item.source" hide-footer>
                              <template #modal-title>
                                {{ item.title }}
                              </template>
                              <div>
                                  <h5>Missing Report</h5>
                                  <a href="https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/iris/latest/graph_stats.json">Download Full Report</a>
                                  <p>Report Date: {{ item.report.missing_report.date }}</p>
                                  <ul>
                                      <li>Sitemap count: {{ item.report.missing_report.sitemap_count }}</li>
                                      <li>Summoned count: {{ item.report.missing_report.summoned_count }}</li>
                                      <li>Missing summoned count: {{ item.report.missing_report.missing_sitemap_summon_count }}</li>
                                      <li>Graph URN count: {{ item.report.missing_report.graph_urn_count }}</li>
                                      <li>Missing graph URN count: {{ item.report.missing_report.missing_summon_graph_count }}</li>
                                  </ul>
                                  <h5>Graph Stats</h5>
                                  <a href="https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/iris/latest/missing_report.json">Download Full Report</a>
                                  <p>Report Date: {{ item.report.graph_stats.date }}</p>
                                  <ul>
                                  <v-list>
                                    <v-list-item
                                      v-for="(item, index) in item.report.graph_stats.reports"
                                      :key="index"
                                    >
                                        <li v-if="item.report=='dataset_count'">{{ item.report }} :
                                            <v-list>
                                                <v-list-item
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    {{ report.datasetcount }}
                                                </v-list-item>
                                            </v-list>
                                        </li>
                                        <li v-if="item.report=='triple_count'">{{ item.report }} :
                                            <v-list>
                                                <v-list-item
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    {{ report.tripelcount }}
                                                </v-list-item>
                                            </v-list>
                                        </li>
                                        <li v-if="item.report=='kw_count'">{{ item.report }} :
                                            <v-list>
                                                <v-list-item
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    {{ report.kwcount }}
                                                </v-list-item>
                                            </v-list>
                                        </li>
                                        <li v-if="item.report=='type_count'">{{ item.report }} :
                                            <table class="customTable">
                                                <thead>
                                                <tr>
                                                    <th>type</th>
                                                    <th>scount</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    <td>{{ report.type }}</td>
                                                    <td>{{ report.scount }}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                        <li v-if="item.report=='version_count'">{{ item.report }} :
                                            <v-list>
                                                <v-list-item
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    {{ report.versioncount }}
                                                </v-list-item>
                                            </v-list>
                                        </li>
                                        <li v-if="item.report=='variablename_count'">{{ item.report }} :
                                            <v-list>
                                                <v-list-item
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    {{ report.variablenamecount }}
                                                </v-list-item>
                                            </v-list>
                                        </li>
                                        <li v-if="item.report=='graph_sizes_count'">{{ item.report }} :
                                            <table class="customTable">
                                                <thead>
                                                <tr>
                                                    <th>triple_per_jsonld</th>
                                                    <th>count</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    <td>{{ report.triple_per_jsonld }}</td>
                                                    <td>{{ report.count }}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                        <li v-if="item.report=='triple_count_by_graph'">{{ item.report }} :
                                            <table class="customTable">
                                                <thead>
                                                <tr>
                                                    <th>g</th>
                                                    <th>count</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr
                                                  v-for="(report, report_index) in item.data"
                                                  :key="report_index"
                                                >
                                                    <td>{{ report.g }}</td>
                                                    <td>{{ report.count }}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                    </v-list-item>
                                  </v-list>
                                  </ul>

                              </div>
                                <b-dropdown class="customDropdown" text="Download Full Reports" variant="None">
                                  <v-list>
                                    <v-list-item
                                      v-for="(item, index) in download"
                                      :key="index"
                                    >
                                        <b-dropdown-item :href="item.url">
                                            {{ item.title }}
                                        </b-dropdown-item>
                                    </v-list-item>
                                  </v-list>
                                </b-dropdown>

                            </b-modal>

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

            <p><a href="https://github.com/earthcube/facetsearch/issues" target="_blank">Create an issue</a> and a <a href="mailto:feedback@geocodes.earthcube.org" >email feedback.</a></p>
          <p><a href="https://github.com/earthcube/facetsearch/" target="_blank">Source Code </a> </p>
          <p> Version: {{$store.getters.appVersion}} Date: {{$store.getters.appDate}} </p>
          <p>Citation: <cite>McHenry K, Bobak M, Coakley K, Fils D, Gatzke L, Zhang B, Kooper R, Richard S, Valentine D, Zaslavsky I, Shepherd, A & Lingerfelt E. (2021). GeoCODES. EarthCube. https://geocodes.earthcube.org. </cite> </p>
        </b-container>

        <b-container fluid="md" class="mt-5">
            <h2>Supported by</h2>

            <p>Work on this site is supported by</p>

            <div><img src="https://www.nsf.gov/images/logos/NSF_4-Color_bitmap_Logo.png" width="38" alt="NSF"></div>
            <h5>NSF EarthCube</h5>
            <div><i>NSF award #1928208</i></div>

            <p class="mt-4"><a href="https://github.com/earthcube" target="_blank">Open source</a> under the <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a></p>
        </b-container>
      <div>
        <b-link :to="{name: 'configuration'}" class="mr-0" >Config</b-link>
      </div>
    </b-container>
</template>

<script>

import axios from "axios";
import $ from "jquery";

export default {
  name: "about.vue",
  data() {
    return {
        info: null,
        download: [
            {"title":"graph stats", "url":"https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/iris/latest/graph_stats.json"},
            {"title":"missing report", "url":"https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/iris/latest/missing_report.json"},
        ]
    }
  },
    mounted () {
    axios
      .get('https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/all/latest/report_stats.json')
      .then(response => (
          this.info = response.data))
  },
    methods: {
        showModal(t) {
            console.log(t)
            $('#'+t).modal('show')
        }
    }
}

</script>

<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';

.logo {
    max: {
        width: 50%;
    }
    min: {
        height: 100px;
    }
}

.card-text {
    &.collapsed .when_closed,
    &.not-collapsed .when_open {
        display: none;
    }
}

.customDropdown {
    background-color: white;
}

.button-file {
    border:0;
    background:transparent;
    color: gray;
}

.customTable {
    background: #F8F9F9;
}

th {
  display: table-cell;
  vertical-align: inherit;
  text-align: center;
    background: #18598b;
    color: white;
}

</style>
