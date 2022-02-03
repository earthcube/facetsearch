<template>
  <b-container fluid="md" class="mt-3">
      <b-row>
        <b-col md="12">
          <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
          <CreateCollection> </CreateCollection>
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
                          <div class="filter_card">
                            <b-button block squared v-b-toggle="'accordion_text_'+ name" @click="chooseType(name, facetSetting.type)">
                              {{name}}
                              <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>
                              <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>
                            </b-button>
                          </div>

                        <b-collapse
                            :id="'accordion_text_'+ name"
                            :visible="false"
                        >

                          <b-list-group flush>
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

                        </b-collapse>

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
              <div v-if="item.collection=='unassigned'">
              <b-card tag="article" class="rounded-0">

                <!--        <router-link  :to="linkTo()">-->
                <b-card-title class="name" v-html="item.value.name">
                </b-card-title>
                <!--        </router-link>-->
                <b-card-title class="publisher" v-if="item.value.pubname" v-html="item.value.pubname"></b-card-title>

                <b-card-text class="description small mb-2" v-if="item.value.description" v-html="item.value.description"></b-card-text>

                {{item}}
                <div v-if="item.collection=='unassigned'">
                <b-button variant="link" size="sm" class="ml2-auto" v-on:click="moveToCollection(item)">Move to Collection</b-button>
                </div>
                <div v-if="item.collection !=='unassigned'">
                  <b-button variant="link" size="sm" class="ml2-auto" v-on:click="moveToCollection">Remove from Collection</b-button>
                </div>

                <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
                  <div v-if="facetSetting.type=='all'">
<!--                    {{item}}-->
                    <v-select
                        v-model="item.moveCollection"
                        :id="'accordion_text_'+ item.name"
                        :options="facetSetting.names"
                        @input="(name) => updateSelectedCollection(item, name)"
                    ></v-select>

<!--                    <select v-model="selected" :id="'accordion_text_'+ item.name">-->
<!--                      <option v-for="name in facetSetting.names" v-bind:key="name" :value="name">-->
<!--                        {{ name }}-->
<!--                      </option>-->
<!--                    </select>-->
<!--                    <span>Selected: {{ selected }}</span>-->


<!--                    <b-button v-b-toggle="'accordion_text_'+ item.name" @click="chooseType(facetSetting.field)">-->
<!--                      Move to Collection-->
<!--                      <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>-->
<!--                      <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>-->
<!--                    </b-button>-->

<!--                    <b-collapse :id="'accordion_text_'+ item.name" :visible="facetSetting.open">-->
<!--                      <div class="custom-control custom-radio">-->
<!--                        <div v-for="name in facetSetting.names" :key="name">-->
<!--                          {{name}}-->
<!--&lt;!&ndash;                          <input type="radio" class="custom-control-input" :id="'checker_'+name" name="allCollections">&ndash;&gt;-->
<!--&lt;!&ndash;                          <label class="custom-control-label" for="'checker_'+name">{{name}}</label>&ndash;&gt;-->
<!--                          <input type="radio" v-model="profileImg" name="profileImg" :value="name">-->
<!--                        </div>-->
<!--                      </div>-->
<!--                    </b-collapse>-->


<!--                    <div class="filter_card">-->
<!--                      <b-button block squared v-b-toggle="'move_to_collection'+ facetSetting.field" @click="visible = !visible">-->
<!--                        Move to Collection-->
<!--                        <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>-->
<!--                        <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>-->
<!--                      </b-button>-->
<!--                    </div>-->


<!--                  <b-collapse-->
<!--                      :id="'move_to_collection_'+facetSetting.field"-->
<!--                      v-model="visible"-->
<!--                  >-->
<!--                    <b-list-group flush>-->
<!--                      <b-list-group-item v-for="name in facetSetting.names" :key="name">-->
<!--                        <div class="filter_card">-->
<!--                          <b-button block squared v-b-toggle="'move_to_collection_'+ name" @click="chooseType(name)">-->
<!--                            {{name}}-->
<!--                          </b-button>-->
<!--                        </div>-->

<!--                      </b-list-group-item>-->
<!--                    </b-list-group>-->


<!--                  </b-collapse>-->


                  </div>
                </div>


              </b-card>
                </div>
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
import FacetTextItem from "./FacetTextItem";
// import _ from "underscore";
import Vue from "vue";
import CreateCollection from "./CreateCollection";
import {mapGetters} from "vuex";
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

Vue.component("v-select", vSelect);

export default {
  name: "Collection.vue",
  components: {
    FacetTextItem,
    CreateCollection,
  },
  data () {
    return {
      visible: false,
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
            query_collections.push(item)
            // query_collections.push({name: item.value})
          } else if(item['type'] == 'data') {
            data_collections.push(item)
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
            items: [{id: "data", count: data_collections.length, isActive: false, name: "data"},
              {id: "query", count: query_collections.length, isActive: false, name: "query"},
              {id: "tool", count: 0, isActive: false, name: "tool"}],
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
    updateSelectedCollection:  function(item, collectionName) {
      console.log(item.collection)
      console.log(collectionName)
      item.moveCollection = collectionName
    },
    moveToCollection: function(item) {
      console.log("moveToCollection")
      console.log(item)
    },
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
            items: [{id: "data", count: 0, isActive: false, name: "data"},
              {id: "query", count: 0, isActive: false, name: "query"},
              {id: "tool", count: 0, isActive: false, name: "tool"}],
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
    chooseType(field, type) {
      console.log("field: " + field);
      console.log("chooseType: " + type);
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

