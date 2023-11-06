<template>
    <b-container fluid="md" class="mt-5">
        <div>
            <b-card header="Missing Report">
          <div  v-if="missing">
              <b-link :href="missing_url" class="card-link">Download Original Report (JSON)</b-link>
              <p>Report Date: {{ missing.date }}</p>
              <ul>
                  <li>Sitemap count: {{ missing.sitemap_count }}</li>
                  <li>Summoned count: {{ missing.summoned_count }}</li>
                  <li>Missing summoned count: {{ missing.missing_sitemap_summon_count }}</li>
                  <li>Graph URN count: {{ missing.graph_urn_count }}</li>
                  <li>Missing graph URN count: {{ missing.missing_summon_graph_count }}</li>
              </ul>
            </div>
            </b-card>
          <div  v-if="graphinfo">
              <b-card header="Graph Stats">
              <b-link :href="graph_url" class="card-link">Download Original Report (JSON )</b-link>
              <p>Report Date: {{ graphinfo.date }}</p>
              <ul>
                  <b-list-group>
                <b-list-group-item
                  v-for="(item, index) in graphinfo.reports"
                  :key="index"
                  class = "customList"
                >
                    <li v-if="item.report=='dataset_count'">
                        <p v-for="(report, report_index) in item.data" :key="report_index">
                            {{ item.report }} : {{ report.datasetcount }}
                        </p>
                    </li>
                    <li v-if="item.report=='triple_count'">
                        <p v-for="(report, report_index) in item.data" :key="report_index">
                            {{ item.report }} : {{ report.tripelcount }}
                        </p>
                    </li>
                    <li v-if="item.report=='repos_with_keywords'">
                        <p v-for="(report, report_index) in item.data" :key="report_index">
                            {{ item.report }} : {{ report.kwcount }}
                        </p>
                    </li>
                    <li v-if="item.report=='graph_count_by_repo'">{{ item.report }} :
                        <table class="customTable">
                            <thead>
                            <tr>
                                <th>graphs</th>
                                <th>triples</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr
                              v-for="(report, report_index) in item.data"
                              :key="report_index"
                            >
                                <td>{{ report.graphs }}</td>
                                <td>{{ report.triples }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </li>
                    <li v-if="item.report=='dataset_count_by_repo'">{{ item.report }} :
                        <table class="customTable">
                            <thead>
                            <tr>
                                <th>graphs</th>
                                <th>datasets</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr
                              v-for="(report, report_index) in item.data"
                              :key="report_index"
                            >
                                <td>{{ report.graphs }}</td>
                                <td>{{ report.datasets }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </li>
                    <li v-if="item.report=='types_count'">{{ item.report }} :
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
                        <b-list-group>
                            <b-list-group-item
                              v-for="(report, report_index) in item.data"
                              :key="report_index"
                            >
                                {{ report.versioncount }}
                            </b-list-group-item>
                        </b-list-group>
                    </li>
                    <li v-if="item.report=='variablename_count'">{{ item.report }} :
                        <b-list-group>
                            <b-list-group-item
                              v-for="(report, report_index) in item.data"
                              :key="report_index"
                            >
                                {{ report.variablenamecount }}
                            </b-list-group-item>
                        </b-list-group>
                    </li>
                    <li v-if="item.report=='types_count_by_repo'">{{ item.report }} :
                        <table class="customTable">
                            <thead>
                            <tr>
                                <th>type</th>
                                <th>type_counts</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr
                              v-for="(report, report_index) in item.data"
                              :key="report_index"
                            >
                                <td>{{ report.type }}</td>
                                <td>{{ report.type_counts }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </li>
                    <li v-if="item.report=='mutilple_version_count_by_repo'">
                        <p v-for="(report, report_index) in item.data" :key="report_index">
                            {{ item.report }} : {{ report.versioncount }}
                        </p>
                    </li>
                    <li v-if="item.report=='variablename_count'">
                        <p v-for="(report, report_index) in item.data" :key="report_index">
                            {{ item.report }} : {{ report.variablenamecount }}
                        </p>
                    </li>
                </b-list-group-item>
              </b-list-group>

              </ul>
              </b-card>
            </div>
          </div>
    </b-container>
</template>

<script>

import axios from "axios";
import JSON5 from 'json5'


export default {
  name: "report.vue",
  props: {
    source: String,
  },
  data() {
    return {
        missing: null,
        graphinfo: null,
      missing_url: "",
      graph_url: ""
    }
  },
    mounted () {
     // const source = this.$route.params.repo;
      console.log(this.source);
      const s3base = "https://oss.geocodes-aws.earthcube.org/earthcube/reports/";
      this.missing_url = `${s3base}${ this.source}/latest/missing_report_graph.json`;
      this.graph_url =`${s3base}${ this.source}/latest/graph_stats.json`;

      this.fetchMissingReport();
      this.fetchGraphStats();
     }, methods: {
      fetchMissingReport() {
          axios
              .get(this.missing_url)
              .then(miss => (
                  this.missing = miss.data))
      },
      fetchGraphStats() {

          axios
              .get(this.graph_url)
              .then(response => {
                  this.graphinfo = JSON5.parse(response.data );
                  console.log(this.graphinfo);
                 }
              )
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

th, td {
  padding-left: 30px;
  padding-right: 30px;
}

.customList {
    border: none
}

</style>
