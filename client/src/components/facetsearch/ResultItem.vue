<template>
  <b-card
    tag="article"
    class="rounded-0"
    :class="['type_' + item.resourceType.toLowerCase()]"
    @click="showDetails"
  >
    <router-link :to="linkTo()">
      <b-card-title class="name" v-html="item.name"> </b-card-title>
    </router-link>
    <b-card-title
      v-if="item.pubname"
      class="publisher"
      v-html="item.pubname"
    ></b-card-title>

    <b-card-text
      v-if="item.description"
      class="description small mb-2"
      v-html="item.description"
    ></b-card-text>

    <div v-if="item.kw" class="keywords">
      <div class="label">Keywords</div>
      <div class="values">
        <span
          v-for="kw in highlightKw(filters, item.kw)"
          :key="kw"
          class="keyword mx-2 text-secondary"
          v-html="kw"
        ></span>
      </div>
    </div>
    <div v-if="collectionNames !== undefined">
      in collections {{ collectionNames }}
    </div>
    <div class="badges mt-2">
      <b-badge variant="data" class="mr-1"
        ><b-icon class="mr-1" icon="server"></b-icon
        >{{ item.resourceType }}</b-badge
      >

      <b-badge v-if="connectedTools" variant="tool" class="mr-1"
        ><b-icon class="mr-1" icon="tools"></b-icon>Connected Tools
      </b-badge>
      <b-spinner v-if="connectedTools === undefined" size="small" />

      <span v-if="item.disurl">
        <!-- array created in state.js/flatten... -->
        <b-badge
          v-for="i in item.disurl"
          :key="i"
          variant="light"
          class="mr-1"
          :href="i"
        >
          <a v-if="i.length > 0" class="card-link" target="_blank">{{ i }}</a>
        </b-badge>
      </span>
    </div>

    <div class="badges mt-2">
      <b-button
        v-if="item.resourceType == 'data'"
        variant="primary"
        size="sm"
        class="ml2-auto"
        @click="saveItems(item.resourceType)"
        >Save Dataset</b-button
      >
      <b-button
        v-else-if="item.resourceType == 'tool'"
        variant="primary"
        size="sm"
        class="ml2-auto"
        @click="saveItems(item.resourceType)"
        >Save Tool</b-button
      >
      <b-button
        v-else
        variant="primary"
        size="sm"
        class="ml2-auto"
        @click="saveItems(item.resourceType)"
        >Save Other</b-button
      >
    </div>
  </b-card>
</template>

<script>
// import Vue from 'vue'
import _ from "lodash";
import { mapActions, mapGetters, mapState } from "vuex";
import localforage from "localforage";
import { isProxy, toRaw } from "vue";

export default {
  name: "ResultItem",
  props: ["item", "state"],
  data() {
    return {
      filters: this.state.filters,
      connectedTools: undefined,
      clickToAddCollection: false,
      collectionNames: undefined,
    };
  },
  computed: {
    ...mapGetters(["getConnectedTool"]),
    ...mapState(["collections"]),
  },
  mounted() {
    this.hasTool();
    this.inCollection();
  },
  methods: {
    ...mapActions(["hasConnectedTools"]),
    inCollection() {
      const self = this;
      localforage
        .getItem(self.item.g, function (err, value) {
          console.log(err);
          console.log(value);
          if (err != null || value === null) {
            return false;
          }

          if (value?.assignedCollections) {
            self.collectionNames = value.assignedCollections;
            return true;
          }
        })
        .catch((error) => console.log(error));
      return false;
    },
    saveItems(type) {
      var self = this;
      self.clickToAddCollection = true;
      let item = this.item;
      if (isProxy(this.item)) {
        item = toRaw(this.item);
      }
      // var toAdd = true
      // for(var i = 0; i < this.collections.length; i++) {
      //   var item = this.collections[i]
      //   if (item.g === this.item.g) {
      //     toAdd = false
      //     break
      //   }
      // }
      localforage.getItem(item.g, function (err, value) {
        if (value === null) {
          localforage
            .setItem(item.g, {
              type: type,
              collection: "unassigned",
              value: item,
            })
            .then((value) => {
              console.log("store " + value.g + " to localstorage");
            })
            .catch((err) => {
              console.log(
                "oops! the account was too far gone, there was nothing we could do to save him ",
                err
              );
            });
          console.log("add to collection");
        } else {
          // localforage.setItem(newFilename, value, function () {
          //   localforage.removeItem(filename, function () { return callback(); });
          // });
          console.log(value);
        }
      });
      // if(toAdd) {
      //   // Vue.set(this.collections, this.collections.length, this.item)
      // }
    },
    linkTo() {
      if (this.item.resourceType === "tool") {
        return {
          name: "tool",
          params: {
            t: this.item.subj,
          },
        };
      } else if (this.item.resourceType === "data") {
        return {
          name: "dataset",
          params: {
            d: this.item.g,
          },
        };
      }
    },
    showDetails() {
      if (this.clickToAddCollection) {
        this.clickToAddCollection = false;
        //
        return;
      }
      if (this.item.resourceType === "tool") {
        this.$router.push({
          name: "tool",
          params: {
            t: this.item.subj,
          },
        });
      } else if (this.item.resourceType === "data") {
        this.$router.push({
          name: "dataset",
          params: {
            d: this.item.g,
          },
        });
      } else {
        // needs to be a dialog saying, borked.. no url to go to.
        this.makeToast(this.item.subj);
        return;
      }
    },
    highlightKw(filters, keywords) {
      if (keywords) {
        let kwList = [];
        if (_.isArray(keywords)) {
          kwList = keywords.map(function (kw) {
            if (_.includes(filters["kw"], kw)) {
              return `<b>${kw}</b>`;
            } else {
              return kw;
            }
          });
        } else {
          if (_.includes(filters, keywords)) {
            return [`<b>${keywords}<b/>`];
          } else {
            kwList = [keywords];
          }
        }
        return kwList;
      }
    },
    hasTool() {
      var self = this;
      self.connectToolsIsLoading = true;
      let gg = self.item.g;
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
  makeToast(mesg = "Error") {
    let message = `Unknown type. Send us this identifier ${mesg}`;
    this.$bvToast.toast(message, {
      title: "Cannot locate item",
      autoHideDelay: 5000,
      appendToast: false,
    });
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

article {
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

  //special css treatment for data or tool results
  /*
      &.type_data {
          &:not(:hover) {
              background: {
                  color: rgba($data, .1);
              }
          }
      }

      &.type_tool {
          &:not(:hover) {
              background: {
                  color: rgba($tool, .1);
              }
          }
      }
  */
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
