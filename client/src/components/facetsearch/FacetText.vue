<template>
  <div class="filter_card">
    <b-button v-b-toggle="'accordion_text_' + facetSetting.field" block squared>
      {{ facetSetting.title }}
      <b-icon
        icon="square"
        class="when-open"
        scale="0.8"
        aria-hidden="true"
      ></b-icon>
      <b-icon
        icon="plus-square"
        class="when-closed"
        scale="0.8"
        aria-hidden="true"
      ></b-icon>
    </b-button>

    <b-collapse
      :id="'accordion_text_' + facetSetting.field"
      :visible="facetSetting.open"
    >
      <b-list-group flush>
        <FacetTextItem
          v-for="(info, term) in facetItems"
          :id="facetStore[facetSetting.field][term].id"
          :key="info.id"
          :term="term"
          :count="info.count"
          :facet-setting="facetSetting"
          :is-active="info.isActive"
          :fieldname="fieldname"
        ></FacetTextItem>
      </b-list-group>
    </b-collapse>
  </div>
</template>

<script>
//import Vue from 'vue'
import { event as gtagevent } from "vue-gtag";
import _ from "underscore";
import FacetTextItem from "@/components/facetsearch/FacetTextItem.vue";
//import {bus} from "../../main.js"
//import { inject } from 'vue'
export default {
  name: "FacetText",
  components: { FacetTextItem },
  inject: ["toggleFilter", "filtersState"],
  // setup(){
  //   // eslint-disable-next-line
  //   const toggleFilter = inject("toggleFilter")
  //   // eslint-disable-next-line
  //   const facetStore = inject('facetStore')
  // },
  props: {
    facetSetting: Object,
    facetStore: Object,
    fieldname: String,
    //   "state":Object,
    //   "currentResults": Array
  },
  data() {
    return {
      // watch facetStore
      facetItems: this.facetStore[this.facetSetting.field],
    };
  },

  computed: {
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
  mounted() {
    /**** vue3 off **/
    // var self = this;
    //   bus.$on('facetupdate', () => {
    //     console.log("facetupdate event");
    //     self.facetItems = self.facetStore[self.facetSetting.field];
    //     self.updateFacetItems()
    //   })
  },
  methods: {
    updateFacetItems: function () {
      console.log("facetupdateitems methtod called event");
      this.$forceUpdate();
      //  this.facetItems = this.facetStore[this.facetSetting.field];
    },
    _handleClick: function (event) {
      const self = this;
      console.log(event);
      //var filter = this.getFilterById(this.id);
      var filter = self.getFilterById(event.target.id);
      //var filter = this.facetSetting
      // use $nextTick to delay an processing until after the entire dom has been updated.
      // otherwise we get a an error about a null key
      //self.$nextTick(() =>  self.toggleFilter(filter.facetname, filter.filtername) )
      //  self.toggleFilter(filter.field, filter.title); //vue2
      this.toggleFilter(filter.field, filter.title); // vue3

      // $(this.facetSelector).trigger("facetedsearchfacetclick", filter);
      /**** vue3 off **/
      // bus.$emit("facetedsearchfacetclick", filter)

      //   Vue.$gtag.event('select_content', {
      gtagevent("select_content", {
        content_type: filter.field,
        item_id: filter.title,
      });
      //Vue.$gtag.event('select_facet', {
      gtagevent("select_facet", {
        // content_type:filter.field,
        // item_id: filter.title,
        event_category: "engagement",
        event_label: "facet_clicked",
        value: `${filter.field}:${filter.title}`,
      });
      //order();
      // updateFacetUI();
      // updateResults();
    },

    /**
     * get a facetname and filtername by the unique id that is created in the beginning
     */
    getFilterById: function (id) {
      var result = false;
      _.each(this.facetStore, function (facet, facetname) {
        _.each(facet, function (filter, filtername) {
          if (filter.id == id) {
            result = { field: facetname, title: filtername };
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
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.filter_card {
  background: {
    color: #f5f5f5;
  }

  border: 1px solid rgba(0, 0, 0, 0.125);

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
