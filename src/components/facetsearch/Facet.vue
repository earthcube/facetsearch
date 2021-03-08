<template  >
  <div class="accordion col-12  rounded p-0 mt-1" :id="'accordian' + facetSetting.field ">
    <b-card >
      <b-card-header header-tag="header" class="p-0" role="tab">
        <b-button block v-b-toggle="'accordion-'+ facetSetting.field" variant="info"> {{facetSetting.title}}</b-button>
      </b-card-header>
      <b-collapse :id="'accordion-'+ facetSetting.field" :visible="facetSetting.open" :accordion="facetSetting.field+'-accordion'" role="tabpanel">
        <b-card-body>
<!-- v-on:facetupdate="updateFacetItems"-->
          <FacetItem   v-for='(info, term) in facetItems' v-bind:key="info.id"  v-on:click.native="_handleClick"
                       v-bind:id="facetStore[facetSetting.field][term].id"
                       :term="term" :count="info.count" :facetSetting="facetSetting" :isActive="info.isActive">
          </FacetItem>
<!--          <div v-for='(info, term) in facetItems'  v-bind:key="info.id" class="facetitem" v-on:click.native="_handleClick"-->
<!--          v-bind:id="facetStore[facetSetting.field][term].id">-->
<!--            <span>{{ term }}</span>-->
<!--            <b-badge variant="light" class="ml-auto" > {{  info.count }} </b-badge>-->
<!--          </div>-->
        </b-card-body>
      </b-collapse>
    </b-card>
  </div>
</template>

<script>
//import Vue from 'vue'
import _ from "underscore";
import FacetItem from "./FacetItem";
import {bus} from "../../main.js"
export default {
  name: "Facet",
  components: {FacetItem},
  inject: ["toggleFilter"],
  props: {
    "facetSetting":Object,
    "facetStore":Object,
    "state":Object,
 //   "currentResults": Array
  },
  data () {
    return {
      // watch facetStore
      facetItems: this.facetStore[this.facetSetting.field],



    }
  },
  mounted(){
    var self = this;
      bus.$on('facetupdate', () => {
        console.log("facetupdate event");
        self.facetItems = self.facetStore[self.facetSetting.field];
      })
    }
  ,

  computed:{

    // facetList: function( ){
    //   var self = this;
    //   var count = 0 ;
    //   var facetSetting = this.facetSetting;
    //   // Update the count for each facet and item:
    //   // intialize the count to be zero
    //   //this.resetFacetCount(settings);
    //   // then reduce the items to get the current count for each facet
    //  // _.each(settings.facets, function (facet) {
    //  var facetItems =  _.each(self.currentResults, function (item) {
    //       if (_.isArray(item[facetSetting.field])) {
    //         _.each(item[facetSetting.field], function (facetitem) {
    //           if (!_.isEmpty(facetitem)) {
    //             count += 1;
    //           }
    //
    //         });
    //       } else {
    //         if (item[facetSetting.field] !== undefined) {
    //           if (!_.isEmpty(item[facetSetting.field])) {
    //             count += 1;
    //           }
    //
    //         }
    //       }
    //     });
    //  // });
    //
    //   // remove confusing 0 from facets where a filter has been set
    //
    //       if (count == 0 && self.settings.state.filters[facetSetting.field].length) count = "+";
    //
    //
    //
    //   //return settings.facetStore[facetSetting.field][item[facetSetting]].count;
    //   return facetItems;
    // }
  },
  methods:

      {

        updateFacetItems: function(){
          console.log("facetupdateitems methtod called event");
          this.$forceUpdate();
          //  this.facetItems = this.facetStore[this.facetSetting.field];
        },
        _handleClick: function(event){
          const self = this;
          console.log(event)
          //var filter = this.getFilterById(this.id);
          var filter = self.getFilterById(event.target.id);
          //var filter = this.facetSetting
          // use $nextTick to delay an processing until after the entire dom has been updated.
          // otherwise we get a an error about a null key
          //self.$nextTick(() =>  self.toggleFilter(filter.facetname, filter.filtername) )
          self.toggleFilter(filter.field, filter.title);
         // $(this.facetSelector).trigger("facetedsearchfacetclick", filter);
          bus.$emit("facetedsearchfacetclick", filter)
          //order();
         // updateFacetUI();
         // updateResults();
        },

        /**
         * get a facetname and filtername by the unique id that is created in the beginning
         */
        getFilterById: function (id) {
        var result = false;
        _.each(this.facetStore, function(facet, facetname) {
          _.each(facet, function(filter, filtername){
            if (filter.id == id) {
              result =  {'field': facetname, 'title': filtername};
            }
          });
        });
        return result;
      },
      //   // toggleFilter: function(key, value)
      //   // {
      //   //   this.state.filters[key] = this.state.filters[key] || [];
      //   //   if (_.indexOf(this.state.filters[key], value) == -1) {
      //   //     this.state.filters[key].push(value);
      //   //     //this.facetStore[key][value].isActive = true;
      //   //    Vue.set( this.facetStore[key][value], 'isActive',true);
      //   //    // this.activeFacet=true;
      //   //   } else {
      //   //     this.state.filters[key] = _.without(this.state.filters[key], value);
      //   //     if (this.state.filters[key].length == 0) {
      //   //       delete this.state.filters[key];
      //   //       //this.facetStore[key][value].isActive = false;
      //   //
      //   //       Vue.set(this.facetStore[key][value], 'isActive',false);
      //   //     //  this.activeFacet=false;
      //   //     }
      //   //   }
      //   //   this.$parent.$parent.filter();
      //   // },
      //   // facetCount: function( ){
      //   //   var count = 0 ;
      //   //   var facetSetting = this.facetSetting;
      //   //   // Update the count for each facet and item:
      //   //   // intialize the count to be zero
      //   //   //this.resetFacetCount(settings);
      //   //   // then reduce the items to get the current count for each facet
      //   //   // _.each(settings.facets, function (facet) {
      //   //   _.each(this.currentResults, function (item) {
      //   //     if (_.isArray(item[facetSetting.field])) {
      //   //       _.each(item[facetSetting.field], function (facetitem) {
      //   //         if (_.isEmpty(facetitem)) {
      //   //           return;
      //   //         }
      //   //         count += 1;
      //   //       });
      //   //     } else {
      //   //       if (item[facetSetting.field] !== undefined) {
      //   //         if (_.isEmpty(item[facetSetting.field])) {
      //   //           return;
      //   //         }
      //   //         count += 1;
      //   //       }
      //   //     }
      //   //   });
      //   //   // });
      //   //
      //   //   // remove confusing 0 from facets where a filter has been set
      //   //
      //   //   if (count == 0 && this.settings.state.filters[facetSetting.field].length) count = "+";
      //   //
      //   //
      //   //
      //   //   //return settings.facetStore[facetSetting.field][item[facetSetting]].count;
      //   //   return count;
      //   // },
      //   /**
      //    * resets the facet count
      //    */
      //   resetFacetCount: function (settings) {
      //     _.each(settings.facetStore, function (items, facetname) {
      //       _.each(items, function (value, itemname) {
      //         settings.facetStore[facetname][itemname].count = 0;
      //         settings.facetStore[facetname][itemname].isActive = false;
      //       });
      //     });
      //   },
      //   setFacetCount: function(settings){
      //     // Update the count for each facet and item:
      //     // intialize the count to be zero
      //     this.resetFacetCount(settings);
      //     // then reduce the items to get the current count for each facet
      //     _.each(settings.facets, function (facet) {
      //       _.each(settings.currentResults, function (item) {
      //         if (_.isArray(item[facet.field])) {
      //           _.each(item[facet.field], function (facetitem) {
      //             if (_.isEmpty(facetitem)) {
      //               return;
      //             }
      //             settings.facetStore[facet.field][facetitem].count += 1;
      //           });
      //         } else {
      //           if (item[facet] !== undefined) {
      //             if (_.isEmpty(item[facet.field])) {
      //               return;
      //             }
      //             settings.facetStore[facet.field][item[facet.field]].count += 1;
      //           }
      //         }
      //       });
      //     });
      //
      //     // remove confusing 0 from facets where a filter has been set
      //     _.each(settings.state.filters, function (filters, facettitle) {
      //       _.each(settings.facetStore[facettitle], function (facet) {
      //         if (facet.count === 0 && settings.state.filters[facettitle].length) facet.count = "+";
      //       });
      //     });
      //   }
       }


}
</script>

<style scoped>

</style>
