<template>
  <article class="media content-section">
    <div class="media-body">
      <b-container fluid="md" class="mt-3">
        <b-row>
          <back-button/>


          <!-- sidebar -->
          <b-col md="3" class="sidebar">
            <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
              <div class="filter_card">
                <div v-if="facetSetting.field=='unassigned'">
                  <b-button block squared v-b-toggle="'accordion_text_'+ facetSetting.field"
                            @click="chooseType(facetSetting.field)">
                    {{ facetSetting.title }}
                    <!--                <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>-->
                    <!--                <b-icon icon="dash-square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>-->
                    <!--                <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>-->
                  </b-button>
                </div>
              </div>

            </div>

          </b-col>

          <b-col md="12">
            <CreateCollection></CreateCollection>
          </b-col>


          <b-col md="3" class="sidebar scrollable text-center green flex-grow-1 flex-shrink-0 overflow-auto">
            <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">

              <div class="filter_card">
                <div v-if="facetSetting.type=='all'">
                  <div v-for='name in facetSetting.names' :key="name">
                    <!--                                        {{name}}-->
                    <div v-if="facetSetting.names.length">
                      <b-list-group flush>
                        <CollectionMenuItem
                            @click="handleCNameClick(facetSetting.field, name )"
                            :term="name"
                        ></CollectionMenuItem>
                      </b-list-group>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </b-col>

          <b-col md="9" class="results">
            <div class="mb-2 mb-lg-0">
              <header>
                <div v-if="($data.collectionTitle).length">
                  <h1 class="article-title mx-auto">{{ $data.collectionTitle }} Collection</h1>
                </div>
              </header>
              <sendCollectionToNotebook v-if=" collectionTitle.length > 0 "
                                        :collection-name="collectionTitle"></sendCollectionToNotebook>
            </div>
            <div class="mt-3">
              <div v-for="type in this.types"
                   v-bind:key="type.row"
                   :type="type">
                <!--              {{type}}-->
                <div v-if="(type.content).length">
                  <header>
                    <hr class="divider"/>
                    <h2 class="mb-3">{{ type.name }}</h2>
                  </header>
                </div>
                <div v-if="!(type.content).length">
                  <header>
                    <h1 class="mb-3">{{ type.name }}</h1>
                    <p class="mb-3">No items</p>
                  </header>
                </div>
                <!--              {{$data.currentClick }}-->
                <div v-for="item in type.content"
                     v-bind:key="item.row"
                     :item="item">

                  <CollectionCard :item="item" :current-click="currentClick" :types="types"></CollectionCard>
                </div>
              </div>

            </div>
          </b-col>


        </b-row>
      </b-container>

    </div>
  </article>

</template>

<script>
// import Vue from 'vue'
// import {mapState} from "vuex";
// import Facets from "./Facets";
import localforage from 'localforage';
//import FacetsConfig from "../../config";
// import FacetTextItem from "./FacetTextItem";
// import _ from "underscore";
import Vue from "vue";
import CreateCollection from "./CreateCollection.vue";

import CollectionMenuItem from "./CollectionMenuItem.vue";
import sendCollectionToNotebook from "./sendCollectionToNotebook.vue";
import CollectionCard from "./CollectionCard.vue"
import backButton from "@/components/backButton.vue"
import {mapGetters, mapState} from "vuex";
import vSelect from "vue-select";
import VueScrollbox from 'vue-scrollbox';
import "vue-select/dist/vue-select.css";
// import ConfirmDialogue from './ConfirmDialogue.vue'

// Vue.component("v-select", vSelect);
// Vue.component('vue-scrollbox', VueScrollbox);

export default {
  name: "Collection.vue",
  emits: ["click"],
  components: {
    // FacetTextItem,
    CreateCollection,
    CollectionMenuItem,
    // ConfirmDialogue,
    sendCollectionToNotebook,
    CollectionCard,
    backButton,
    vSelect,
    VueScrollbox
  },
  data() {
    return {
      visible: false,
      type: '',
      collections: {},
      assigned_collection_names: [],
      facetStore: {},
      facets: undefined, //FacetsConfig.COLLECTION_FACETS,
      selectedCollectionItems: {},
      selectedCollectionName: '',
      datasets: [],
      queries: [],
      tools: [],
      // allCollections: [],
      //---- ok to edit facets
      // facets: FacetsConfig.FACETS,
      types: {},
      currentClick: "",
      collectionTitle: "",

    }
  },
  provide: function () {
    return {
      updteAllCollections: this.updteAllCollections,
      chooseType: this.chooseType
    }
  },
  computed: {
    ...mapGetters(['getCollections']),
    ...mapState(['FacetsConfig'])
  },
  // computed: { ...mapState ([ 'collections'])},
  created() {
    this.facets = this.FacetsConfig.COLLECTION_FACETS
  },
  async mounted() {
    let self = this
    await self.reloadCollections()
    this.currentClick = 'unassigned'
    this.chooseType('unassigned')

  },
  methods: {

    reloadCollections: async function () {
      var self = this
      var colls = []
      this.selectedCollectionItems = {}
      this.selectedCollectionName = ""
      await localforage.iterate(function (value, key) {
        console.log([key, value]);
        colls.push(value)
        // Vue.set(self.collections, self.collections.length, value)
      }).then(function () {
        console.log('Iteration has completed');
        // self.collections['data'] = colls
        var assgined = {}
        var data_collections = []
        var query_collections = []
        var tool_collections = []
        var assigned_collection_names = []
        for (let i = 0; i < colls.length; i++) {
          var item = colls[i]
          if (item['collection'] == 'unassigned') {
            if (item['type'] == 'query') {
              query_collections.push(item)
              // query_collections.push({name: item.value})
            } else if (item['type'] == 'data') {
              data_collections.push(item)
            } else if (item['type'] == 'tool') {
              tool_collections.push(item)
            }
          } else if (item['collection'] == 'collection name') {
            assigned_collection_names.push(item.value)
          } else if (item['collection'] == 'assigned') {
            if ('collections' in item && item['collections'] !== undefined) {
              for (let j = 0; j < item.collections.length; j++) {
                var name = item.collections[j]
                if (!(name in assgined)) {
                  assgined[name] = {'data': 0, 'query': 0, 'tool': 0}
                }
                assgined[name][item['type']] += 1
              }
            }
          }
        }

        // Vue.set(self.collections, 'data', data_collections)
        // Vue.set(self.collections, 'query', query_collections)
        // Vue.set(self.collections, 'tool', tool_collections)
       self.collections['data']=data_collections
        self.collections['query']=query_collections
        self.collections['tool']= tool_collections

        for (let i = 0; i < self.FacetsConfig.COLLECTION_FACETS.length; i++) {
          if (self.FacetsConfig.COLLECTION_FACETS[i].field == 'unassigned') {
            self.facets[i] ={
              field: self.FacetsConfig.COLLECTION_FACETS[i].field,
              title: self.FacetsConfig.COLLECTION_FACETS[i].title,
              sort: self.FacetsConfig.COLLECTION_FACETS[i].sort,
              open: self.FacetsConfig.COLLECTION_FACETS[i].open,
              type: self.FacetsConfig.COLLECTION_FACETS[i].type,
              collections: self.FacetsConfig.COLLECTION_FACETS[i].collections,
              items: [{id: "data", count: data_collections.length, isActive: false, name: "data"},
                {id: "query", count: query_collections.length, isActive: false, name: "query"},
                {id: "tool", count: 0, isActive: false, name: "tool"}]
            }
          } else if (self.FacetsConfig.COLLECTION_FACETS[i].field == 'all') {
            var items = {}
            for (let i = 0; i < assigned_collection_names.length; i++) {
              if (assigned_collection_names[i] in assgined) {
                var assgin = assgined[assigned_collection_names[i]]
                // items.push([{id: "data", count: assgin['data'], isActive: false, name: "data"},
                //   {id: "query", count: assgin['query'], isActive: false, name: "query"},
                //   {id: "tool", count: assgin['tool'], isActive: false, name: "tool"}])
                items[assigned_collection_names[i]] = [{
                  id: "data",
                  count: assgin['data'],
                  isActive: false,
                  name: "data"
                },
                  {id: "query", count: assgin['query'], isActive: false, name: "query"},
                  {id: "tool", count: assgin['tool'], isActive: false, name: "tool"}]
              } else {
                items[assigned_collection_names[i]] = [{id: "data", count: 0, isActive: false, name: "data"},
                  {id: "query", count: 0, isActive: false, name: "query"},
                  {id: "tool", count: 0, isActive: false, name: "tool"}]
              }
            }

            self.facets[i] ={
              field: self.FacetsConfig.COLLECTION_FACETS[i].field,
              title: self.FacetsConfig.COLLECTION_FACETS[i].title,
              sort: self.FacetsConfig.COLLECTION_FACETS[i].sort,
              open: self.FacetsConfig.COLLECTION_FACETS[i].open,
              type: self.FacetsConfig.COLLECTION_FACETS[i].type,
              collections: self.FacetsConfig.COLLECTION_FACETS[i].collections,
              items: items,
              names: assigned_collection_names,
            }
          }
        }

      }).catch(function (err) {
        // This code runs if there were any errors
        console.log(err);
      });
    },

    updteAllCollections: function (colls) {
      // this.allCollections = colls
      console.log(this.allCollections)
      for (let i = 0; i < this.FacetsConfig.COLLECTION_FACETS.length; i++) {
        if (this.FacetsConfig.COLLECTION_FACETS[i].field == 'all') {
          this.facet[i] = {
            field: this.FacetsConfig.COLLECTION_FACETS[i].field,
            title: this.FacetsConfig.COLLECTION_FACETS[i].title,
            sort: this.FacetsConfig.COLLECTION_FACETS[i].sort,
            open: this.FacetsConfig.COLLECTION_FACETS[i].open,
            type: this.FacetsConfig.COLLECTION_FACETS[i].type,
            collections: this.FacetsConfig.COLLECTION_FACETS[i].collections,
            names: colls,
          }
        }
      }
      this.reloadCollections()
    },
    populateAssignedCollection: function (type, collname) {
      const self = this;
      this.type = 'all'
      //collection name;
      //select type:
      console.log(collname)
      this.selectedCollectionName = collname
      var colls = []
      localforage.iterate(function (value, key) {
        console.log([key, value]);
        if (value.type === type && (value.collections === collname || (Array.isArray(value.collections) && value.collections.includes(collname))))
          colls.push(value)
        // Vue.set(self.collections, self.collections.length, value)
      }).then(function () {
        console.log('Iteration has completed');
        if (!(self.selectedCollectionName in self.selectedCollectionItems)) {
          self.selectedCollectionItems[self.selectedCollectionName] = []
        }
        var set = new Set()
        // var selectedcoll = self.selectedCollectionItems[collname]
        var selectedcoll = self.selectedCollectionItems[collname].filter(item => item.type === type);
        for (let i = 0; i < self.selectedCollectionItems[self.selectedCollectionName].length; i++) {
          var item = self.selectedCollectionItems[self.selectedCollectionName][i];
          if (type === item.type) {
            set.add(item.value.name)
          }
        }
        for (let i = 0; i < colls.length; i++) {
          // if(!self.selectedCollectionItems[self.selectedCollectionName].includes(colls[i])) {
          //   self.selectedCollectionItems[self.selectedCollectionName].push(colls[i])
          // }
          if (!set.has(colls[i].value.name)) {
            set.add(colls[i].value.name)
            // self.selectedCollectionItems[self.selectedCollectionName].push(colls[i])
            selectedcoll.push(colls[i])
          }
        }
        // Vue.set(self.selectedCollectionItems, collname, selectedcoll)
        self.type = collname
        // Vue.set(self.collections, collname, selectedcoll)
        //Vue.set(self.types, type, {'name': type, 'content': selectedcoll})
        self.types[type]={'name': type, 'content': selectedcoll}
      }).catch(function (err) {
        // This code runs if there were any errors
        console.log(err);
      });
    },
    handleCNameClick: function (type, collname) {
      // console.log(item + type)
      // if (type == "unassigned") {
      //   if (item.id === 'data') {
      //     this.type = 'data'
      //   } else if (item.id === 'tool') {
      //     this.type = 'tool'
      //   } else if (item.id === 'query') {
      //     this.type = 'query'
      //   }
      // } else {
        this.collectionTitle = collname
        this.currentClick = "assigned"
        this.populateAssignedCollection('data', collname)
        this.populateAssignedCollection('query', collname)
        this.populateAssignedCollection('tool', collname)

      //}
    },
    showDetails() {
      console.log("clicl on item");

    },
    populate(name) {
      // var data = []
      // for (let i = 0; i < this.collections[name].length; i++) {
      //   if ('collection' in this.collections[name][i]) {
      //     if (this.collections[name][i]['collection'] == 'unassigned') {
      //       data.push(this.collections[name][i])
      //     }
      //   }
      //   // this.datasets = data
      //   Vue.set(this.types, name, {'name': name, 'content': data})
      // }
      var self = this
      var data = []
      localforage.iterate(function (value, key) {
        console.log([key, value]);
        // if(value.type === name && value.collection == "unassigned")
        if (value.type === name)
          data.push(value)
        // Vue.set(self.collections, self.collections.length, value)
      }).then(function () {
        console.log(data)
        //Vue.set(self.types, name, {'name': name, 'content': data})
        self.types[name]={'name': name, 'content': data}
      }).catch(function (err) {
        // This code runs if there were any errors
        console.log(err);
      });


    },
    chooseType(field, type) {
      this.currentClick = field
      console.log("field: " + field);
      console.log("chooseType: " + type);
      if (field === 'dataType') {
        this.type = 'data'
      } else if (field === 'toolType') {
        this.type = 'tool'
      } else if (field === 'queryType') {
        this.type = 'query'
      } else if (field == 'all') {
        this.reloadCollections()
      } else if (field == 'unassigned') {
        // this.type = 'data'
        // this.field = 'unassigned'
        this.collectionTitle = ""
        if ('data' in this.collections) {
          this.populate('data')
        }
        if ('query' in this.collections) {
          this.populate('query')
        }
        if ('tool' in this.collections) {
          this.populate('tool')
        }
      }
    },
  },
}
</script>

<style scoped>

</style>

<style scoped lang="scss">
@import '@/assets/bootstrapcss/custom';

.filter_card {
  background: {
    color: #f5f5f5;
  }

  border: 1px solid rgba(0, 0, 0, .125);

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

.scrollable {
  overflow-y: scroll;
}

</style>

