<template>
  <b-container fluid="md" class="mt-3">
      <b-row>
        <b-col md="12">
          <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
        </b-col>

        <!-- sidebar -->
        <b-col md="3" class="sidebar">
          <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
            <div class="filter_card">
              <b-button block squared v-b-toggle="'accordion_text_'+ facetSetting.field" @click="chooseType(facetSetting.field)">
                {{facetSetting.title}}
                <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>
                <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>
              </b-button>

            </div>
            <b-collapse
                :id="'accordion_text_'+ facetSetting.field"
                :visible="facetSetting.open"
            >

              <div v-if="facetSetting.type=='unassigned'">
              <b-list-group flush>
<!--                <b-list-group-item v-for="coll in facetSetting.collections" :key="coll">-->
<!--                  <p>{{ coll }}</p>-->
<!--                </b-list-group-item>-->
                <FacetTextItem
                    v-for='item in facetSetting.items'
                    v-bind:key="item.id"
                    v-on:click.native="_handleClick(item, facetSetting.field)"
                    :term="item.name"
                    :count="item.count"
                    :facetSetting="facetSetting"
                    :isActive="item.isActive"
                ></FacetTextItem>
              </b-list-group>
              </div>
              <div v-if="facetSetting.type=='all'">
                <b-list-group flush>
                      <b-list-group-item v-for="name in facetSetting.names" :key="name">
                        <p>{{ name }}</p>
                      </b-list-group-item>
<!--                  <FacetTextItem-->
<!--                      v-for='item in facetSetting.items'-->
<!--                      v-bind:key="item.id"-->
<!--                      v-on:click.native="_handleClick(item, facetSetting.field)"-->
<!--                      :term="item.name"-->
<!--                      :count="item.count"-->
<!--                      :facetSetting="facetSetting"-->
<!--                      :isActive="item.isActive"-->
<!--                  ></FacetTextItem>-->
                </b-list-group>
              </div>
            </b-collapse>

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
        <CreateCollection subject = 'Search'> </CreateCollection>
      </b-row>
  </b-container>


</template>

<script>
// import Vue from 'vue'
// import {mapState} from "vuex";
// import Facets from "./Facets";
import localforage from 'localforage';
import FacetsConfig from "../../config";
import FacetTextItem from "./FacetTextItem";
// import _ from "underscore";
import Vue from "vue";
import CreateCollection from "./CreateCollection";
import {mapGetters} from "vuex";

export default {
  name: "Collection.vue",
  components: {
    FacetTextItem,
    CreateCollection,
  },
  data () {
    return {
      type: '',
      collections: {},
      assigned_collection_names: [],
      facetStore: {},
      facets: FacetsConfig.COLLECTION_FACETS,
      // allCollections: [],
      //---- ok to edit facets
      // facets: FacetsConfig.FACETS,
    }
  },
  provide: function () {
    return {
      updteAllCollections: this.updteAllCollections,
    }
  },
  computed: {
    ...mapGetters (['getCollections'])
  },
  // computed: { ...mapState ([ 'collections'])},
  mounted() {
    var self = this
    var colls = []
    localforage.iterate(function(value, key) {
      console.log([key, value]);
      colls.push(value)
      // Vue.set(self.collections, self.collections.length, value)
    }).then(function() {
      console.log('Iteration has completed');
      // self.collections['data'] = colls
      var data_collections = []
      var query_collections = []
      var assigned_collection_names = []
      for(let i = 0; i < colls.length; i++) {
        var item = colls[i]
        if( item['collection'] == 'unassigned'){
          if (item['type'] == 'query') {
            query_collections.push({name: item.value})
          } else if(item['type'] == 'data') {
            data_collections.push(item.value)
          }
        } else if(item['collection'] == 'collection name') {
          assigned_collection_names.push(item.value)
        }
      }

      Vue.set(self.collections, 'data', data_collections)
      Vue.set(self.collections, 'query', query_collections)

      for(let i = 0; i < FacetsConfig.COLLECTION_FACETS.length; i++) {
        if(FacetsConfig.COLLECTION_FACETS[i].field == 'unassigned') {
          Vue.set(self.facets, i, {
            field: FacetsConfig.COLLECTION_FACETS[i].field,
            title: FacetsConfig.COLLECTION_FACETS[i].title,
            sort: FacetsConfig.COLLECTION_FACETS[i].sort,
            open: FacetsConfig.COLLECTION_FACETS[i].open,
            type: FacetsConfig.COLLECTION_FACETS[i].type,
            collections: FacetsConfig.COLLECTION_FACETS[i].collections,
            items: [{id: "data", count: data_collections.length, isActive: false, name: "data"},
              {id: "query", count: query_collections.length, isActive: false, name: "query"},
              {id: "tool", count: 0, isActive: false, name: "tool"}]
          })
        }else if(FacetsConfig.COLLECTION_FACETS[i].field == 'all') {
          Vue.set(self.facets, i, {
            field: FacetsConfig.COLLECTION_FACETS[i].field,
            title: FacetsConfig.COLLECTION_FACETS[i].title,
            sort: FacetsConfig.COLLECTION_FACETS[i].sort,
            open: FacetsConfig.COLLECTION_FACETS[i].open,
            type: FacetsConfig.COLLECTION_FACETS[i].type,
            collections: FacetsConfig.COLLECTION_FACETS[i].collections,
            names: assigned_collection_names,
          })
        }
      }

    }).catch(function(err) {
      // This code runs if there were any errors
      console.log(err);
    });
  },
  methods:{
    updteAllCollections: function(colls) {
      // this.allCollections = colls
      console.log(this.allCollections)
      for(let i = 0; i < FacetsConfig.COLLECTION_FACETS.length; i++) {
        if(FacetsConfig.COLLECTION_FACETS[i].field == 'all') {
          Vue.set(this.facets, i, {
            field: FacetsConfig.COLLECTION_FACETS[i].field,
            title: FacetsConfig.COLLECTION_FACETS[i].title,
            sort: FacetsConfig.COLLECTION_FACETS[i].sort,
            open: FacetsConfig.COLLECTION_FACETS[i].open,
            type: FacetsConfig.COLLECTION_FACETS[i].type,
            collections: FacetsConfig.COLLECTION_FACETS[i].collections,
            names: colls,
          })
        }
      }
    },
    _handleClick: function(item, type) {
      // const self = this;
      console.log(item + type)
      if(item.id === 'data') {
        this.type = 'data'
      } else if(item.id === 'tool') {
        this.type = 'tool'
      } else if(item.id === 'query') {
        this.type = 'query'
      }
    },
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

