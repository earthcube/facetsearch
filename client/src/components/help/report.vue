<template>
    <b-container fluid="md" class="mt-5">
        <div>
            <h2>{{ $route.params.repo }}</h2>
                                  <h5>Missing Report</h5>
                                  <a href="https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/iris/latest/graph_stats.json">Download Full Report</a>
                                  <p>Report Date: {{ missing.date }}</p>
                                  <ul>
                                      <li>Sitemap count: {{ missing.sitemap_count }}</li>
                                      <li>Summoned count: {{ missing.summoned_count }}</li>
                                      <li>Missing summoned count: {{ missing.missing_sitemap_summon_count }}</li>
                                      <li>Graph URN count: {{ missing.graph_urn_count }}</li>
                                      <li>Missing graph URN count: {{ missing.missing_summon_graph_count }}</li>
                                  </ul>
                                  <h5>Graph Stats</h5>
                                  <a href="https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/iris/latest/missing_report.json">Download Full Report</a>
                                  <p>Report Date: {{ graphinfo.date }}</p>
                                  <ul>
                                      <v-list>
                                    <v-list-item
                                      v-for="(item, index) in graphinfo.reports"
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
    </b-container>
</template>

<script>

import axios from "axios";

export default {
  name: "report.vue",
  data() {
    return {
        missing: null,
        graphinfo: null
    }
  },
    mounted () {
      const repo = this.$route.params.repo;
      this.fetchMissingReport(repo);
      this.fetchGraphStats(repo);
  }, methods: {
      fetchMissingReport(repo) {
          axios
              .get('https://oss.geocodes-aws.earthcube.org/earthcube/reports/' + repo + '/latest/missing_report_graph.json')
              .then(miss => (
                  this.missing = miss.data))
      },
      fetchGraphStats(repo) {
          console.log(repo);
          axios
              .get('https://oss.geocodes.ncsa.illinois.edu/yybucket/reports/iris/latest/graph_stats.json')
              .then(response => (
                  this.graphinfo = response.data))
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
