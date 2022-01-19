<template>
  <b-container fluid="md" class="mt-3">
      <b-row>
        <b-col md="12">
          <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
        </b-col>
<!--        <b-form-checkbox-group-->
<!--            v-model="selected"-->
<!--            :options="options"-->
<!--            class="mb-3"-->
<!--            value-field="item"-->
<!--            text-field="name"-->
<!--            disabled-field="notEnabled"-->
<!--        ></b-form-checkbox-group>-->
<!--        <div class="mt-3">Selected: <strong>{{ selected }}</strong></div>-->


        <!-- sidebar -->
        <b-col md="3" class="sidebar">
<!--          <Facets-->
<!--              v-bind:facets="facets"-->
<!--              v-bind:facetStore="facetStore"-->
<!--              v-bind:state="state"-->
<!--          ></Facets>-->
          <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
            <div class="filter_card">
              <b-button block squared v-b-toggle="'accordion_text_'+ facetSetting.field" @click="chooseType(facetSetting.field)">
                {{facetSetting.title}}
                <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>
                <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>
              </b-button>

            </div>
          </div>


        </b-col>

        <!-- filter and results -->
        <b-col md="9" class="results">
          <div class="mt-3">
            <!-- list of results -->
            <div v-for="item in this.collections[this.type]"
                 v-bind:key="item.row"
                 :item="item">
              <b-card tag="article" class="rounded-0"

              >
                <!--        <router-link  :to="linkTo()">-->
                <b-card-title class="name" v-html="item.name">
                </b-card-title>
                <!--        </router-link>-->
                <b-card-title class="publisher" v-if="item.pubname" v-html="item.pubname"></b-card-title>

                <b-card-text class="description small mb-2" v-if="item.description" v-html="item.description"></b-card-text>

              </b-card>

            </div>
          </div>
        </b-col>
      </b-row>
  </b-container>


</template>

<script>
// import Vue from 'vue'
// import {mapState} from "vuex";
// import Facets from "./Facets";
import localforage from 'localforage';
import FacetsConfig from "../../config";
// import _ from "underscore";
import Vue from "vue";

export default {
  name: "Collection.vue",
  components: {
    // Facets,
  },
  data () {
    return {
      type: '',
      collections: {},
      facetStore: {},
      facets: FacetsConfig.COLLECTION_FACETS,
      //---- ok to edit facets
      // facets: FacetsConfig.FACETS,
    }
  },

  // computed: { ...mapState ([ 'collections'])},
  mounted() {
    var self = this
    var colls = []
    localforage.iterate(function(value, key) {
      // Resulting key/value pair -- this callback
      // will be executed for every item in the
      // database.
      console.log([key, value]);
      colls.push(value)
      // Vue.set(self.collections, self.collections.length, value)
    }).then(function() {
      console.log('Iteration has completed');
      // self.collections['data'] = colls
      var data_collections = []
      var query_collections = []
      for(let i = 0; i < colls.length; i++) {
        var item = colls[i]
        if(typeof item === 'object' && 'g' in item) {
          data_collections.push(item)
        } else {
          query_collections.push({name: item})
        }
      }
      Vue.set(self.collections, 'data', data_collections)
      Vue.set(self.collections, 'query', query_collections)
    }).catch(function(err) {
      // This code runs if there were any errors
      console.log(err);
    });
  },
  methods:{
    showDetails() {
      console.log("clicl on item");
    },
    chooseType(field) {
      console.log("chooseType: " + field);
      if(field === 'dataType') {
        this.type = 'data'
      } else if(field === 'toolType') {
        this.type = 'tool'
      } else if(field === 'queryType') {
        this.type = 'query'
      }

    },
  },
}
</script>

<style scoped>

</style>

<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';

.filter_card {
  background: {
    color: #f5f5f5;
  }

  border: 1px solid rgba(0,0,0, .125);

  & + .filter_card {
    margin: {
      top: $spacer / 2;
    }
  }

  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:not(:hover) {
      color: $gray-700;
      background: {
        color: $gray-300;
      }
    }

    border: 0px;
  }

  .list-group {
    overflow: {
      y: auto;
    }

    max: {
      height: 170px;
    }
  }
}

//make flat color
.btn-secondary,
.btn-secondary:hover {
  background: {
    image: none;
  }
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

</style>