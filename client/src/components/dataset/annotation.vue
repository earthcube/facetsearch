<template>
  <b-row v-if="list.length > 0">
    <h5>Annotation Data</h5>

    <div role="tablist">
      <div
        v-for="(item, index) in list"
        :key="index"
        class="annotate_data_item mt-3"
      >
        <div
          v-b-toggle="'collapse_annotate_data_' + index"
          class="toggle text-primary text-link d-flex"
          role="tab"
        >
          <!--          <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>-->

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-caret-down-fill when_open"
            viewBox="0 0 16 16"
          >
            <path
              d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"
            />
          </svg>

          <!--          <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>-->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-caret-up-fill when_closed"
            viewBox="0 0 16 16"
          >
            <path
              d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"
            />
          </svg>

          <span v-html="item.label"></span>
        </div>

        <b-collapse
          :id="'collapse_annotate_data_' + index"
          accordion="collapse_group"
          role="tabpanel"
        >
          <div class="description small mt-3" v-html="item.description"></div>
        </b-collapse>
      </div>
    </div>
  </b-row>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";
import { frameJsonLD, schemaItem } from "@/api/jsonldObject";
import FacetsConfig from "../../config";

export default {
  name: "Annotation",
  data() {
    return {
      list: [],
      totalVuePackages: null,
    };
  },
  watch: {
    jsonLdObj: "getAnnotationData",
  },
  computed: {
    ...mapState(["jsonLdObj", "jsonLdCompact"]),
  },
  // props:{
  //   list: {
  //     type: Array,
  //     default: null
  //   }
  // },
  methods: {
    getAnnotationData() {
      var self = this;

      let jp = self.jsonLdObj; // just short name
      // console.log(jp.toString());
      frameJsonLD(jp, "Dataset").then((jp) => {
        let s_identifier = schemaItem("identifier", jp);
        if (!Array.isArray(s_identifier)) s_identifier = [s_identifier]; // make an array
        // find returns the first found element
        let t_identifiers = s_identifier.find(
          (obj) =>
            obj["https://schema.org/propertyID"] ===
            "http://linked.earth/ontology#hasDatasetId"
        );

        if (t_identifiers && t_identifiers["https://schema.org/value"]) {
          this.throughputIdentifier = t_identifiers["https://schema.org/value"];
        }
        console.log("this.throughputIdentifier:" + this.throughputIdentifier);
        if (this.throughputIdentifier === undefined) return;

        var dbid = "r3d100012894";

        var url = FacetsConfig.THROUGHPUTDB_URL;
        var params = {
          // fixed for now
          dbid: dbid,
          additionalType: "http://linked.earth/ontology#Dataset",
          id: this.throughputIdentifier,
        };
        const config = {
          url: url,
          method: "get",
          headers: {
            Accept: "application/sparql-results+json",
            "Content-Type": "application/json",
          },
          params: params,
        };
        axios.request(config).then(function (response) {
          console.log("annotation counts: " + response.data.data.length);
          for (var i = 0; i < response.data.data.length; i++) {
            console.log(response.data.data[i].annotation);
            self.list.push({
              label: 1 + i,
              description: response.data.data[i].annotation,
            });
          }
        });
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.toggle {
  cursor: pointer;

  font: {
    weight: 600; //semi-bold
  }
  line: {
    height: 140%;
  }

  &:hover {
    color: $info !important;
  }
}

.b-icon {
  width: $spacer * 1.5;
  height: $spacer * 1.5;
}

.description {
  margin: {
    left: $spacer * 1.5;
  }
}

.collapsed .when_closed,
.not-collapsed .when_open {
  display: none;
}
</style>
