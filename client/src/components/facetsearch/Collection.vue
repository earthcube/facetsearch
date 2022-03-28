<template>
  <b-container fluid="md" class="mt-3">
    <b-row>
        <b-col md="12">
          <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
<!--          <CreateCollection> </CreateCollection>-->
        </b-col>


        <!-- sidebar -->
        <b-col md="3" class="sidebar">
          <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
            <div class="filter_card">
              <div v-if="facetSetting.field=='unassigned'">
                <b-button block squared v-b-toggle="'accordion_text_'+ facetSetting.field" @click="chooseType(facetSetting.field)">
                  {{facetSetting.title}}
  <!--                <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>-->
  <!--                <b-icon icon="dash-square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>-->
  <!--                <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>-->
                </b-button>
              </div>
            </div>

          </div>

        </b-col>

        <b-col md="12">
          <CreateCollection> </CreateCollection>
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
                          v-on:click.native="_handleClick(item, facetSetting.field, name)"
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
          <div class="mt-3">
            <div v-for="type in this.types"
                 v-bind:key="type.row"
                 :type="type">
<!--              {{type}}-->
              <div v-if="(type.content).length">
                <header>
                  <h1 class="mb-3">{{type.name}}</h1>
                </header>
              </div>
              <div v-if="!(type.content).length">
                <header>
                  <h1 class="mb-3">{{type.name}}</h1>
                  <p class="mb-3">No items</p>
                </header>
              </div>
<!--              {{$data.currentClick }}-->
              <div v-for="item in type.content"
                   v-bind:key="item.row"
                   :item="item">
<!--                {{item}}-->
                <b-card tag="article" class="rounded-0">

                  <b-card-title class="name" v-html="item.value.name">
                  </b-card-title>
                  <b-card-title class="publisher" v-if="item.value.pubname" v-html="item.value.pubname"></b-card-title>

                  <b-card-text class="description small mb-2" v-if="item.value.description" v-html="item.value.description"></b-card-text>
<!--                                  {{item}}-->
                  <div v-if="item.collection=='unassigned'">
                    <b-container fluid="md" class="mt-3">
                      <b-row>
                        <b-col cols="8">
                          <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
                            <!--                                          {{item}}-->
                            <div v-if="facetSetting.title=='All Collections'">

                              <v-select
                                  placeholder="Being assigned to"
                                  multiple
                                  v-model="item.collections"
                                  :id="'accordion_text_'+ item.value.name"
                                  :options="facetSetting.names"
                                  @input="(name) => updateMovedToCollection(item, name)"
                              ></v-select>
                            </div>
                          </div>

                        </b-col>
                        <b-col>
                          <!--                        <b-button variant="link" size="sm" class="ml2-auto" v-on:click="moveToCollection(item)">Move to Collections</b-button>-->
                          <b-button variant="outline-primary" size="sm" class="ml2-auto" v-on:click="moveToCollection(item)">Move</b-button>
                        </b-col>
                      </b-row>
                    </b-container>
                  </div>

                  <div v-if="item.collection =='assigned'">
                    <div v-if="$data.currentClick =='assigned'">
                      <b-container fluid="md" class="mt-3">
                        <b-row>
                          Being removed from
                        </b-row>
                        <b-row>
                          <b-col cols="8">
                            <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
                              <!--                    {{item}}-->
                              <div v-if="facetSetting.title=='All Collections'">
                                <v-select disabled
                                    placeholder="Being removed from"
                                    multiple
                                    v-model="item.collections"
                                    :id="'accordion_text_'+ item.value.name"
                                    :options="facetSetting.names"
                                    @input="(name) => updateRemovedCollection(item, name)"
                                ></v-select>
                              </div>
                            </div>
                          </b-col>
                          <b-col>
                            <b-button variant="outline-primary" size="sm" class="ml2-auto" v-on:click="removeFromCollection(item)">Confirm</b-button>
                            <confirm-dialogue ref="confirmDialogue"></confirm-dialogue>
                          </b-col>
                        </b-row>
                      </b-container>
                    </div>

                    <div v-if="$data.currentClick =='unassigned'">
                      <b-container fluid="md" class="mt-3">
                        <b-row>
                          Has been in Collections:
                        </b-row>
                        <b-row>
                          <div v-for="removecollection in item.removeCollection" v-bind:key="removecollection">
                            {{removecollection}} {{" "}}
<!--                            <b-icon icon="exclamation-circle-fill" variant="success"></b-icon>-->
                            <b-icon icon="check-square" scale="1" variant="success"></b-icon>
                          </div>
                        </b-row>

                      </b-container>
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
// import FacetTextItem from "./FacetTextItem";
// import _ from "underscore";
import Vue from "vue";
import CreateCollection from "./CreateCollection";
import CollectionMenuItem from "./CollectionMenuItem";
import {mapGetters} from "vuex";
import vSelect from "vue-select";
import VueScrollbox from 'vue-scrollbox';
import "vue-select/dist/vue-select.css";
import ConfirmDialogue from './ConfirmDialogue.vue'

Vue.component("v-select", vSelect);
Vue.component('vue-scrollbox', VueScrollbox);

export default {
  name: "Collection.vue",
  components: {
    // FacetTextItem,
    CreateCollection,
    CollectionMenuItem,
    ConfirmDialogue,
  },
  data () {
    return {
      visible: false,
      type: '',
      collections: {},
      assigned_collection_names: [],
      facetStore: {},
      facets: FacetsConfig.COLLECTION_FACETS,
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
    this.reloadCollections()
  },
  methods:{

    reloadCollections: function() {
      var self = this
      var colls = []
      this.selectedCollectionItems = {}
      this.selectedCollectionName = ""
      localforage.iterate(function(value, key) {
        console.log([key, value]);
        colls.push(value)
        // Vue.set(self.collections, self.collections.length, value)
      }).then(function() {
        console.log('Iteration has completed');
        // self.collections['data'] = colls
        var assgined = {}
        var data_collections = []
        var query_collections = []
        var tool_collections = []
        var assigned_collection_names = []
        for(let i = 0; i < colls.length; i++) {
          var item = colls[i]
          if( item['collection'] == 'unassigned'){
            if (item['type'] == 'query') {
              query_collections.push(item)
              // query_collections.push({name: item.value})
            } else if(item['type'] == 'data') {
              data_collections.push(item)
            } else if(item['type'] == 'tool') {
              tool_collections.push(item)
            }
          } else if(item['collection'] == 'collection name') {
            assigned_collection_names.push(item.value)
          } else if(item['collection'] == 'assigned') {
            if('collections' in item && item['collections'] !== undefined) {
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

        Vue.set(self.collections, 'data', data_collections)
        Vue.set(self.collections, 'query', query_collections)
        Vue.set(self.collections, 'tool', tool_collections)

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
            var items = {}
            for(let i = 0; i < assigned_collection_names.length; i++) {
              if(assigned_collection_names[i] in assgined) {
                var assgin = assgined[assigned_collection_names[i]]
                // items.push([{id: "data", count: assgin['data'], isActive: false, name: "data"},
                //   {id: "query", count: assgin['query'], isActive: false, name: "query"},
                //   {id: "tool", count: assgin['tool'], isActive: false, name: "tool"}])
                items[assigned_collection_names[i]] = [{id: "data", count: assgin['data'], isActive: false, name: "data"},
                  {id: "query", count: assgin['query'], isActive: false, name: "query"},
                  {id: "tool", count: assgin['tool'], isActive: false, name: "tool"}]
              }else {
                items[assigned_collection_names[i]] = [{id: "data", count: 0, isActive: false, name: "data"},
                  {id: "query", count: 0, isActive: false, name: "query"},
                  {id: "tool", count: 0, isActive: false, name: "tool"}]
              }
            }

            Vue.set(self.facets, i, {
              field: FacetsConfig.COLLECTION_FACETS[i].field,
              title: FacetsConfig.COLLECTION_FACETS[i].title,
              sort: FacetsConfig.COLLECTION_FACETS[i].sort,
              open: FacetsConfig.COLLECTION_FACETS[i].open,
              type: FacetsConfig.COLLECTION_FACETS[i].type,
              collections: FacetsConfig.COLLECTION_FACETS[i].collections,
              items: items,
              names: assigned_collection_names,
            })
          }
        }

      }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
      });
    },
    updateRemovedCollection:  function(item, collectionNames) {
      item.removeCollection = collectionNames
    },
    updateMovedToCollection:  function(item, collectionNames) {
      console.log(item.collection)
      console.log(collectionNames)
      item.moveCollection = collectionNames
    },
    async removeFromCollection(item) {
      if (item.removeCollection.length === 0)
        return
      var self = this
      console.log("removeFromCollection")

      const ok = await this.$refs.confirmDialogue[0].show({
        title: 'Remove Confirmation',
        message: 'Are you sure you want to remove this item back to default collection?',
        okButton: 'Remove',
      })
      if (ok) {
        var newColl = item.collections.filter(collname => (!item.removeCollection.includes(collname)))
        item.collections = newColl
        // write back to storage.
        localforage.getItem(item.value.g, function (err, value) {
          console.log(err)
          console.log(value)
          if (item.collections.length === 0) {
            item.collection = "unassigned"
          }
          item.removeCollection = []
          item.moveCollection = []

          localforage.setItem(
              item.value.g,
              item
          ).then(() => {
            console.log(item.value.g + " is " + item.collection)
            // update collections
            // var currentColl = self.collections[self.type]
            // var indx = currentColl.indexOf(item)
            // if (indx > -1) {
            //   currentColl.splice(indx, 1);
            //   console.log("delete: " + item.value.name + " type: " + self.type + ", " + currentColl);
            // }
            // Vue.set(self.collections, self.type, currentColl)
            var content = self.types[item.type].content
            var indx = content.indexOf(item)
            if (indx > -1) {
              content.splice(indx, 1);
              console.log("delete: " + item.value.name + " type: " + item.type + ", " + content);
            }
            // Vue.set(self.collections, item.type, currentColl)
            Vue.set(self.types, item.type, {'name': item.type, 'content': content})
            self.reloadCollections()
          }).catch((err) => {
            console.log('oops! the account was too far gone, there was nothing we could do to save him ', err);
          });
        });
      }
    },
    moveToCollection: function(item) {
      if (!('moveCollection' in item) || item.moveCollection === 0) {
        console.log("skip move to empty collections")
        return
      }
      console.log("moveToCollection")
      console.log(item)
      var self = this
      item.collections = item.moveCollection
      item.removeCollection = item.collections
      // write back to storage.
      localforage.getItem(item.value.g, function (err, value) {
        console.log(err)
        console.log(value)
        item.collection = "assigned"
        item.moveCollection = []
        localforage.setItem(
            item.value.g,
            item
        ).then(() => {
          console.log(item.value.g + " is " + item.collection)
          // update collections
          var content = self.types[item.type].content
          var indx = content.indexOf(item)
          if (indx > -1) {
            content.splice(indx, 1);
            console.log("delete: " + item.value.name + " type: " + item.type + ", " + content);
          }
          // Vue.set(self.collections, item.type, currentColl)
          Vue.set(self.types, item.type, {'name': item.type, 'content': content})
          console.log("add to collection");
          // self.reloadCollections()
          self.chooseType("unassigned", "")
        }).catch((err) => {
          console.log('oops! the account was too far gone, there was nothing we could do to save him ', err);
        });
      });
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
            names: colls,
          })
        }
      }
      this.reloadCollections()
    },
    populateAssignedCollection: function(type, collname) {
      const self = this;
      this.type = 'all'
      //collection name;
      //select type:
      console.log(collname)
      this.selectedCollectionName = collname
      var colls = []
      localforage.iterate(function(value, key) {
        console.log([key, value]);
        if(value.type === type && (value.collections === collname || (Array.isArray(value.collections) && value.collections.includes(collname))))
          colls.push(value)
        // Vue.set(self.collections, self.collections.length, value)
      }).then(function() {
        console.log('Iteration has completed');
        if(!(self.selectedCollectionName in self.selectedCollectionItems)) {
          self.selectedCollectionItems[self.selectedCollectionName] = []
        }
        var set = new Set()
        // var selectedcoll = self.selectedCollectionItems[collname]
        var selectedcoll = self.selectedCollectionItems[collname].filter(item => item.type === type);
        for(let i = 0; i < self.selectedCollectionItems[self.selectedCollectionName].length; i++) {
          var item = self.selectedCollectionItems[self.selectedCollectionName][i];
          if (type === item.type) {
            set.add(item.value.name)
          }
        }
        for(let i = 0; i < colls.length; i++) {
          // if(!self.selectedCollectionItems[self.selectedCollectionName].includes(colls[i])) {
          //   self.selectedCollectionItems[self.selectedCollectionName].push(colls[i])
          // }
          if(!set.has(colls[i].value.name)) {
            set.add(colls[i].value.name)
            // self.selectedCollectionItems[self.selectedCollectionName].push(colls[i])
            selectedcoll.push(colls[i])
          }
        }
        // Vue.set(self.selectedCollectionItems, collname, selectedcoll)
        self.type = collname
        // Vue.set(self.collections, collname, selectedcoll)
        Vue.set(self.types, type, {'name': type, 'content': selectedcoll})
      }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
      });
    },
    _handleClick: function(item, type, collname) {
      // console.log(item + type)
      if(type == "unassigned") {
        if (item.id === 'data') {
          this.type = 'data'
        } else if (item.id === 'tool') {
          this.type = 'tool'
        } else if (item.id === 'query') {
          this.type = 'query'
        }
      } else {
        this.currentClick = "assigned"
        this.populateAssignedCollection('data', collname)
        this.populateAssignedCollection('query', collname)
        this.populateAssignedCollection('tool', collname)

      }
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
      localforage.iterate(function(value, key) {
        console.log([key, value]);
        // if(value.type === name && value.collection == "unassigned")
        if(value.type === name)
          data.push(value)
        // Vue.set(self.collections, self.collections.length, value)
      }).then(function() {
        console.log(data)
        Vue.set(self.types, name, {'name': name, 'content': data})
      }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
      });


    },
    chooseType(field, type) {
      this.currentClick = field
      console.log("field: " + field);
      console.log("chooseType: " + type);
      if(field === 'dataType') {
        this.type = 'data'
      } else if(field === 'toolType') {
        this.type = 'tool'
      } else if(field === 'queryType') {
        this.type = 'query'
      } else if(field == 'all') {
        this.reloadCollections()
      } else if(field == 'unassigned') {
        // this.type = 'data'
        // this.field = 'unassigned'

        if('data' in this.collections) {
          this.populate('data')
        }
        if('query' in this.collections) {
          this.populate('query')
        }
        if('tool' in this.collections) {
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

.scrollable {
  overflow-y: scroll;
}

</style>

