<template>
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
          <!--                        <b-col>-->
          <!--                          &lt;!&ndash;                        <b-button variant="link" size="sm" class="ml2-auto" v-on:click="moveToCollection(item)">Move to Collections</b-button>&ndash;&gt;-->
          <!--                          <b-button variant="outline-primary" size="sm" class="ml2-auto" v-on:click="moveToCollection(item)">Move</b-button>-->
          <!--                        </b-col>-->
        </b-row>
      </b-container>
    </div>

    <div v-if="item.collection =='assigned'">
      <div v-if="currentClick =='assigned'">
        <b-container fluid="md" class="mt-3">
          <b-row>
            Has been in Collections:
          </b-row>
          <b-row>
            <b-col cols="8">
              <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
                <!--                                                  {{item}}-->
                <div v-if="facetSetting.title=='All Collections'">
                  <v-select disabled
                            placeholder="Being removed from"
                            multiple
                            v-model="item.collections"
                            :id="'accordion_text_'+ item.value.name"
                            :options="facetSetting.names"
                            @input="(name) => updateRemovedCollection(item, name, false)"
                  ></v-select>
                </div>
              </div>
            </b-col>
            <!--                          <b-col>-->
            <!--                            <b-button variant="outline-primary" size="sm" class="ml2-auto" v-on:click="removeFromCollection(item)">Confirm</b-button>-->
            <!--                            <confirm-dialogue ref="confirmDialogue"></confirm-dialogue>-->
            <!--                          </b-col>-->
          </b-row>
        </b-container>
      </div>

      <div v-if="currentClick =='unassigned'">
        <b-container fluid="md" class="mt-3">
          <b-row>
            In Collections:
          </b-row>
          <!--                        <b-row>-->
          <!--                          <div v-for="removecollection in item.removeCollection" v-bind:key="removecollection">-->
          <!--                            {{removecollection}} {{" "}}-->
          <!--&lt;!&ndash;                            <b-icon icon="exclamation-circle-fill" variant="success"></b-icon>&ndash;&gt;-->
          <!--                            <b-icon icon="check-square" scale="1" variant="success"></b-icon>-->
          <!--                          </div>-->
          <!--                        </b-row>-->
          <b-row>
            <b-col cols="8">
              <div v-for="facetSetting in facets" v-bind:key="facetSetting.title">
                <!--                                                  {{item}}-->
                <div v-if="facetSetting.title=='All Collections'">
                  <v-select
                      placeholder="Being removed from"
                      multiple
                      v-model="item.assignedCollections"
                      :id="'accordion_text_'+ item.value.name"
                      :options="facetSetting.names"
                      v-on:option:selected="updateRemovedCollection(item, $event, false)"
                      v-on:option:deselected="optionRemoved($event, item)"
                  ></v-select>
                </div>
              </div>
            </b-col>
            <!--                          <b-col>-->
            <!--                            <b-button variant="outline-primary" size="sm" class="ml2-auto" v-on:click="removeFromCollection(item)">Remove</b-button>-->
            <!--                            <confirm-dialogue ref="confirmDialogue"></confirm-dialogue>-->
            <!--                          </b-col>-->
          </b-row>
        </b-container>
      </div>

    </div>
  </b-card>
</template>

<script>
import localforage from "localforage";
import Vue from "vue";
import FacetsConfig from "../../config";

export default {
  name: "CollectionCard",
  props: ["item", "currentClick", ],
  data: () => {
    return {
      facets: FacetsConfig.COLLECTION_FACETS,
    }
  },
  methods: {
    optionRemoved: function(option, item) {
      console.log(option + ", " + item)
      this.updateRemovedCollection(item, [option], true)
    },
    updateRemovedCollection:  function(item, collectionNames, isRemove) {
      if (collectionNames.length === 0) return
      var addedCollections = collectionNames
      if('removeCollection' in item && item.removeCollection.length > 0)
        addedCollections = collectionNames.filter(collname => (!item.removeCollection.includes(collname)))
      for(let i = 0; i < collectionNames.length; i++) {
        if(!item.removeCollection.includes(collectionNames[i])) {
          item.removeCollection.push(collectionNames[i])
        }
        if(isRemove && 'assignedCollections' in item)
          if(item.assignedCollections.includes(collectionNames[i])) {
            item.assignedCollections.remove(collectionNames[i])
          }
      }
      // item.removeCollection = collectionNames
      if (addedCollections.length > 0) {
        console.log("updateRemovedCollection: add to coll: " + addedCollections)
        this.moveToCollection(item)
      } else {
        // var removedCollections = item.removeCollection.filter(collname => (!collectionNames.includes(collname)))
        console.log("updateRemovedCollection: remove from coll: " + collectionNames)
        this.removeFromCollection(item)
      }
    },
    updateMovedToCollection:  function(item, collectionNames) {
      if (collectionNames.length === 0) return
      console.log(item.collection)
      console.log(collectionNames)
      var addedCollections = collectionNames
      if('assignedCollections' in item) {
        for (let i = 0; i < collectionNames.length; i++) {
          if (!item.assignedCollections.includes(collectionNames[i])) {
            item.assignedCollections.push(collectionNames[i])
          }
        }
      } else {
        item.assignedCollections = collectionNames
      }
      if('moveCollection' in item && item.moveCollection.length > 0)
        addedCollections = collectionNames.filter(collname => (!item.moveCollection.includes(collname)))
      item.moveCollection = collectionNames
      if (addedCollections.length > 0) {
        console.log("updateMovedToCollection: add to coll: " + addedCollections)
        this.moveToCollection(item)
      } else {
        var removedCollections = item.moveCollection.filter(collname => (!collectionNames.includes(collname)))
        console.log("updateMovedToCollection: remove from coll: " + removedCollections)
        this.removeFromCollection(item)
      }
    },
    async removeFromCollection(item) {
      if (item.removeCollection.length === 0)
        return
      var self = this
      console.log("removeFromCollection")

      // const ok = await this.$refs.confirmDialogue[0].show({
      //   title: 'Remove Confirmation',
      //   message: 'Are you sure you want to remove this item from ' + item.assignedCollections + ' collection(s)?',
      //   okButton: 'Remove',
      // })
      const ok = true
      if (ok) {
        // var newColl = item.collections.filter(collname => (!item.removeCollection.includes(collname)))
        // item.assignedCollections = [...item.collections.filter(collname => (!item.assignedCollections.includes(collname)))]
        // item.collections = newColl
        // write back to storage.
        localforage.getItem(item.value.g, function (err, value) {
          console.log(err)
          console.log(value)
          if (item.assignedCollections.length === 0) {
            item.collection = "unassigned"
            item.collections = []
          }
          item.removeCollection = [...item.assignedCollections]
          item.moveCollection = []
          item.collections = [...item.assignedCollections]
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
            if(item.assignedCollections.length === 0) {
              var indx = content.indexOf(item)
              if (indx > -1) {
                content.splice(indx, 1);
                console.log("delete: " + item.value.name + " type: " + item.type + ", " + content);
              }
            }
            // Vue.set(self.collections, item.type, currentColl)
            console.log("reload collection after remove from collection")
            Vue.set(self.types, item.type, {'name': item.type, 'content': content})
            // self.reloadCollections()
            self.chooseType("unassigned", "")
            // if (item.assignedCollections.length === 0) {
            //   self.chooseType("unassigned", "")
            // } else {
            //   self.chooseType("all", "")
            // }
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
      item.collections = [...item.assignedCollections]
      item.removeCollection = [...item.collections]
      // write back to storage.
      localforage.getItem(item.value.g, function (err, value) {
        console.log(err)
        console.log(value)
        item.collection = "assigned"
        item.moveCollection = []
        item.assignedCollections = [...item.collections]
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
          console.log("reload collection after move to collections");
          // self.reloadCollections()
          self.chooseType("unassigned", "")
        }).catch((err) => {
          console.log('oops! the account was too far gone, there was nothing we could do to save him ', err);
        });
      });
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
  }
}
</script>

<style scoped>

</style>
