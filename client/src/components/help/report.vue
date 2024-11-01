<template>
  <b-container fluid="md" class="mt-5">
    <div>
      <h2>Source: {{ source }}</h2>
      <div v-if="loadinfo">
        <b-card header="Load Report">
          <div v-if="loadinfo">
            <b-link :href="load_url" class="card-link"
              >Download Original Report (JSON)</b-link
            >

            <p>Report Date: {{ loadinfo.date }}</p>
            <ul>
              <li>Sitemap count: {{ loadinfo.sitemap_count }}</li>
              <li>Summoned count: {{ loadinfo.summoned_count }}</li>
              <li>
                Missing summoned count:
                {{ loadinfo.missing_sitemap_summon_count }}
              </li>
              <li>Graph URN count: {{ loadinfo.graph_urn_count }}</li>
              <li>
                Missing graph URN count:
                {{ loadinfo.missing_summon_graph_count }}
              </li>
            </ul>
          </div>
        </b-card>
        <div v-if="graphinfo">
          <b-card header="Graph Stats">
            <b-link :href="graph_url" class="card-link"
              >Download Original Report (JSON )</b-link
            >
            <p>Report Date: {{ graphinfo.date }}</p>
            <ul>
              <b-list-group>
                <b-list-group-item
                  v-for="(item, index) in graphinfo.reports"
                  :key="index"
                  class="customList"
                >
                  <li v-if="item.report == 'dataset_count'">
                    <p
                      v-for="(report, report_index) in item.data"
                      :key="report_index"
                    >
                      {{ item.report }} : {{ report.datasetcount }}
                    </p>
                  </li>
                  <li v-if="item.report == 'types_count'">
                    {{ item.report }} :
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
                  <li v-if="item.report == 'type_count'">
                    {{ item.report }} :
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
                  <li v-if="item.report == 'triple_count'">
                    <p
                      v-for="(report, report_index) in item.data"
                      :key="report_index"
                    >
                      {{ item.report }} : {{ report.tripelcount }}
                    </p>
                  </li>
                  <li v-if="item.report == 'repos_with_keywords'">
                    <p
                      v-for="(report, report_index) in item.data"
                      :key="report_index"
                    >
                      {{ item.report }} : {{ report.kwcount }}
                    </p>
                  </li>
                  <li v-if="item.report == 'kw_count'">
                    {{ item.report }} :
                    <table class="customTable">
                      <thead>
                        <tr>
                          <th>keyword</th>
                          <th>counts</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(report, report_index) in item.data"
                          :key="report_index"
                        >
                          <td>{{ report.keyword }}</td>
                          <td>{{ report.scount }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </li>
                  <li v-if="item.report == 'graph_count_by_repo'">
                    {{ item.report }} :
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
                  <li v-if="item.report == 'types_count'">
                    {{ item.report }} :
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
                  <li v-if="item.report == 'version_count'">
                    {{ item.report }} :
                    <b-list-group>
                      <b-list-group-item
                        v-for="(report, report_index) in item.data"
                        :key="report_index"
                      >
                        {{ report.versioncount }}
                      </b-list-group-item>
                    </b-list-group>
                  </li>
                  <li v-if="item.report == 'variablename_count'">
                    {{ item.report }} :
                    <b-list-group>
                      <b-list-group-item
                        v-for="(report, report_index) in item.data"
                        :key="report_index"
                      >
                        {{ report.variablenamecount }}
                      </b-list-group-item>
                    </b-list-group>
                  </li>

                  <li v-if="item.report == 'types_count_by_repo'">
                    {{ item.report }} :
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
                  <li v-if="item.report == 'mutilple_version_count_by_repo'">
                    <p
                      v-for="(report, report_index) in item.data"
                      :key="report_index"
                    >
                      {{ item.report }} : {{ report.versioncount }}
                    </p>
                  </li>

                  <li v-if="item.report == 'graph_sizes_count'">
                    {{ item.report }} :
                    <table class="customTable">
                      <thead>
                        <tr>
                          <th>triples_per_jsonld</th>
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
                </b-list-group-item>
              </b-list-group>
            </ul>
          </b-card>
        </div>
      </div>
    </div>
  </b-container>
</template>

<script>
import axios from "axios";
import JSON5 from "json5";

import { mapState } from "vuex";

export default {
  name: "report.vue",
  props: {
    source: String,
  },
  data() {
    return {
      loadinfo: null,
      graphinfo: null,
      load_url: "",
      graph_url: "",
    };
  },
  computed: {
    ...mapState(["FacetsConfig"]),
  },
  mounted() {
    // const source = this.$route.params.repo;
    console.log(this.source);
    const s3base = this.FacetsConfig.S3_REPORTS_URL;
    this.load_url = `${s3base}${this.source}/latest/load_report_s3.json`;
    this.graph_url = `${s3base}${this.source}/latest/graph_stats.json`;

    this.fetchLoadReport();
    this.fetchGraphStats();
  },
  methods: {
    fetchLoadReport() {
      axios.get(this.load_url).then((load) => (this.loadinfo = load.data));
    },
    fetchGraphStats() {
      axios.get(this.graph_url).then((response) => {
        try {
          this.graphinfo = JSON5.parse(response.data);
          console.log(this.graphinfo);
        } catch (error) {
          this.graphinfo = response.data;
          console.log(this.graphinfo);
        }
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

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

th,
td {
  padding-left: 30px;
  padding-right: 30px;
}

.customList {
  border: none;
}
</style>
