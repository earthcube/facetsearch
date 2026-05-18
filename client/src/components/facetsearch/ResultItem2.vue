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

    <div v-if="keywordList.length" class="keywords">
      <div class="label">Keywords</div>
      <div class="values">
        <span
          v-for="(kw, idx) in highlightedKeywords"
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
      <b-badge variant="data" class="mr-1">
        <b-icon class="mr-1" icon="server"></b-icon>
        {{ result.resourceType || "data" }}
      </b-badge>

      <b-badge v-if="connectedTools" variant="tool" class="mr-1">
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

    <div class="badges mt-2 d-flex flex-wrap align-items-center">
      <b-button
        v-if="result.resourceType === 'data'"
        variant="primary"
        size="sm"
        class="ml-auto"
        @click.stop="saveItems('data')"
        >Save Dataset</b-button
      >
      <b-button
        v-else-if="result.resourceType === 'tool'"
        variant="primary"
        size="sm"
        class="ml-auto"
        @click.stop="saveItems('tool')"
        >Save Tool</b-button
      >
      <b-button
        v-else
        variant="primary"
        size="sm"
        class="ml-auto"
        @click.stop="saveItems(result.resourceType || 'other')"
        >Save Other</b-button
      >
    </div>
  </b-card>
</template>

<script>
import _ from "lodash";
import { isProxy, toRaw } from "vue";
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
      clickToAddCollection: false,
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
    keywordList() {
      const k = this.result.keywords;
      if (Array.isArray(k) && k.length) return k;
      if (this.result.kw) {
        if (Array.isArray(this.result.kw)) return this.result.kw;
        return String(this.result.kw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    },
    disurlList() {
      const d = this.result.disurl;
      if (!d) return [];
      if (Array.isArray(d)) return d.filter((x) => x && String(x).length > 0);
      return [String(d)].filter((x) => x.length > 0);
    },
    kwFacetSelection() {
      const raw = this.activeFilters?.kw;
      if (!raw) return [];
      return Array.isArray(raw) ? raw : [raw];
    },
    highlightedKeywords() {
      const filters = this.kwFacetSelection;
      const keywords = this.keywordList;
      if (!keywords.length) return [];
      return keywords.map((kw) => {
        if (_.includes(filters, kw)) {
          return `<b>${_.escape(kw)}</b>`;
        }
        return _.escape(kw);
      });
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
    saveItems(type) {
      this.clickToAddCollection = true;
      let item = this.result;
      if (isProxy(this.result)) {
        item = toRaw(this.result);
      }
      const key = item.g || item.subj;
      if (!key) {
        this.clickToAddCollection = false;
        return;
      }
      localforage.getItem(key, (err, value) => {
        if (value === null) {
          localforage
            .setItem(key, {
              type,
              collection: "unassigned",
              value: item,
            })
            .then(() => {
              console.log("store " + key + " to localstorage");
            })
            .catch((e) => {
              console.log(e);
            });
        }
      });
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
      if (this.clickToAddCollection) {
        this.clickToAddCollection = false;
        return;
      }
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

  border: {
    right: 0px;
    left: 0px;
  }
  box-shadow: 0 0 10px 1px black;

  &:hover {
    background: {
      color: $gray-300;
    }
  }

  .card-body {
    padding: ($spacer * 1.5) $spacer;
  }
}

.keywords {
  display: flex;

  font: {
    size: 80%;
  }

  .label {
    font: {
      weight: bold;
    }
    text: {
      transform: uppercase;
    }
  }

  .values {
    display: flex;
    white-space: nowrap;
    flex-wrap: wrap;

    .keyword {
      padding: {
        left: $spacer / 2;
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
