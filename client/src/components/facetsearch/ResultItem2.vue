<template>
  <b-card
    tag="article"
    class="rounded-0 result-item-master"
    :class="['type_' + resourceTypeLower]"
    @click="showDetails"
  >
    <router-link :to="resultLink" @click.stop>
      <b-card-title class="name"><span v-html="displayName"></span></b-card-title>
    </router-link>
    <b-card-title
      v-if="result.pubname"
      class="publisher"
      ><span v-html="result.pubname"></span></b-card-title
    >

    <b-card-text
      v-if="result.description"
      class="description small mb-2"
      ><span v-html="result.description"></span></b-card-text
    >

    <div v-if="result.kw" class="keywords">
      <b-badge variant="primary" class="result-badge mr-2 flex-shrink-0">
        Keywords
      </b-badge>
      <div class="values">
        <span
          v-for="(kw, idx) in highlightKw(activeFilters, result.kw)"
          :key="idx"
          class="keyword mx-2 text-secondary"
          v-html="kw"
        ></span>
      </div>
    </div>
    <div v-if="collectionNames != null">
      in collections {{ collectionNames }}
    </div>
    <div class="badges mt-2">
      <b-badge variant="data" class="result-badge mr-1">
        <b-icon class="mr-1" icon="server"></b-icon>
        {{ result.resourceType || "data" }}
      </b-badge>

      <b-badge v-if="connectedTools" variant="tool" class="result-badge mr-1">
        <b-icon class="mr-1" icon="tools"></b-icon>Connected Tools
      </b-badge>
      <b-spinner v-if="connectedTools === undefined" size="small" />

      <span v-if="disurlList.length">
        <b-badge
          v-for="i in disurlList"
          :key="i"
          variant="light"
          class="mr-1"
          :href="i"
        >
          <a v-if="i.length > 0" class="card-link" target="_blank" rel="noopener">{{ i }}</a>
        </b-badge>
      </span>
    </div>
  </b-card>
</template>

<script>
import _ from "lodash";
import { mapActions, mapGetters } from "vuex";
import localforage from "localforage";
import { normalizeDatasetGraphIri } from "@/utils/datasetIdentifiers.js";

export default {
  name: "ResultItem2",
  props: {
    result: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      default: 0,
    },
    /** From Search2 / useSearch — used to bold active keyword facets (field `kw`). */
    activeFilters: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      connectedTools: undefined,
      collectionNames: undefined,
    };
  },
  computed: {
    ...mapGetters(["getConnectedTool"]),
    resourceTypeLower() {
      return String(this.result.resourceType || "data").toLowerCase();
    },
    displayName() {
      return this.result.name || "Untitled";
    },
    resultLink() {
      return this.buildResultLink(this.result);
    },
    disurlList() {
      const d = this.result.disurl;
      if (!d) return [];
      if (Array.isArray(d)) return d.filter((x) => x && String(x).length > 0);
      return [String(d)].filter((x) => x.length > 0);
    },
  },
  mounted() {
    this.hasTool();
    this.inCollection();
  },
  methods: {
    ...mapActions(["hasConnectedTools"]),
    storageKey() {
      return this.result.g || this.result.subj || "";
    },
    inCollection() {
      const key = this.storageKey();
      if (!key) return;
      const self = this;
      localforage
        .getItem(key, function (err, value) {
          if (err != null || value === null) {
            return;
          }
          if (value?.assignedCollections) {
            self.collectionNames = value.assignedCollections;
          }
        })
        .catch((error) => console.log(error));
    },
    highlightKw(filters, keywords) {
      if (!keywords) return [];
      const activeKw = filters?.kw;
      if (Array.isArray(keywords)) {
        return keywords.map((kw) => {
          if (_.includes(activeKw, kw)) {
            return `<b>${_.escape(kw)}</b>`;
          }
          return _.escape(kw);
        });
      }
      if (_.includes(activeKw, keywords)) {
        return [`<b>${_.escape(keywords)}</b>`];
      }
      return [_.escape(String(keywords))];
    },
    buildResultLink(result) {
      const resourceType = result.resourceType || "data";
      const id = String(result.id || result.subj || "").trim();
      if (!id) return { name: "dataset", params: { d: "" } };
      if (resourceType === "tool") {
        return { name: "tool", params: { t: id } };
      }
      const gNorm = result.g
        ? normalizeDatasetGraphIri(result.g) ?? result.g
        : undefined;
      if (gNorm) {
        return {
          name: "dataset",
          params: { d: gNorm },
        };
      }
      return {
        name: "dataset",
        params: { d: id },
      };
    },
    showDetails() {
      const rt = this.result.resourceType || "data";
      if (rt !== "data" && rt !== "tool") {
        this.makeToast(this.result.subj);
        return;
      }
      this.$router.push(this.resultLink);
    },
    makeToast(mesg = "Error") {
      const message = `Unknown type. Send us this identifier ${mesg}`;
      this.$bvToast.toast(message, {
        title: "Cannot locate item",
        autoHideDelay: 5000,
        appendToast: false,
      });
    },
    hasTool() {
      const self = this;
      const gg = self.result.g;
      if (!gg) {
        self.connectedTools = false;
        return;
      }
      if (self.getConnectedTool(gg)) {
        self.connectedTools = self.getConnectedTool(gg);
      } else {
        self
          .hasConnectedTools(gg)
          .then(function (o) {
            self.connectedTools = o;
          })
          .catch((err) => {
            self.connectedTools = false;
            console.info(err);
          });
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

article.result-item-master {
  cursor: pointer;
  margin-top: 0.5em;
  border: 2px solid $gray-400;
  box-shadow: none;

  &:hover {
    background: {
      color: $gray-300;
    }
  }

  .card-body {
    padding: ($spacer * 1.5) $spacer;
  }

  .badge {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    padding: 0 8px;
    height: 26px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;

    .b-icon {
      font-size: 12px;
      line-height: 1;
    }
  }
}

.keywords {
  display: flex;
  align-items: flex-start;

  .values {
    font: {
      size: 80%;
    }
    display: flex;
    flex-wrap: wrap;

    .keyword {
      padding: {
        left: 0;
      }
    }
  }
}

.name {
  color: $gray-800;

  font: {
    weight: 600;
    size: 120%;
  }
  line: {
    height: 120%;
  }
}

.publisher {
  color: $gray-500;

  margin: {
    top: -($spacer * 0.4);
  }

  font: {
    style: italic;
    size: 90%;
  }
}

.description {
  color: $gray-500;
}
</style>
