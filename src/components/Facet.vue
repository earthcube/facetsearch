<template>
  <div class="accordion col-12  rounded" :id="'accordian' + facetSetting.field ">
    <b-card >
      <b-card-header header-tag="header" class="p-1" role="tab">
        <b-button block v-b-toggle.accordion-1 variant="info"> {{facetSetting.title}}</b-button>
      </b-card-header>
      <b-collapse id="accordion-1" visible accordion="my-accordion" role="tabpanel">
        <b-card-body>
          <b-card-text>I start opened because <code>visible</code> is <code>true</code></b-card-text>
          <b-card-text>{{facetSetting.title}}</b-card-text>
          <FacetItem v-for='(info, term) in facetStore' v-bind:key="info.id"
                :term="term" :count="info.count">
          </FacetItem>

        </b-card-body>
      </b-collapse>
    </b-card>
  </div>
</template>

<script>
import _ from "underscore";
import FacetItem from "./FacetItem";

export default {
  name: "Facet",
  components: {FacetItem},
  props: {"facetSetting":Object, "settings":Object, },
  data () {
    return {
      // watch facetStore
      facetStore: this.settings.facetStore[this.facetSetting.field],
      currentResults: this.settings.currentResults
    }
  },
  computed:{
    facetList: function( ){
      var count = 0 ;
      var facetSetting = this.facetSetting;
      // Update the count for each facet and item:
      // intialize the count to be zero
      //this.resetFacetCount(settings);
      // then reduce the items to get the current count for each facet
     // _.each(settings.facets, function (facet) {
     var facetItems =  _.each(this.settings.currentResults, function (item) {
          if (_.isArray(item[facetSetting.field])) {
            _.each(item[facetSetting.field], function (facetitem) {
              if (_.isEmpty(facetitem)) {
                return;
              }
              count += 1;
            });
          } else {
            if (item[facetSetting.field] !== undefined) {
              if (_.isEmpty(item[facetSetting.field])) {
                return;
              }
              count += 1;
            }
          }
        });
     // });

      // remove confusing 0 from facets where a filter has been set

          if (count == 0 && this.settings.state.filters[facetSetting.field].length) count = "+";



      //return settings.facetStore[facetSetting.field][item[facetSetting]].count;
      return facetItems;
    }
  },
  methods:

      {
        // facetCount: function( ){
        //   var count = 0 ;
        //   var facetSetting = this.facetSetting;
        //   // Update the count for each facet and item:
        //   // intialize the count to be zero
        //   //this.resetFacetCount(settings);
        //   // then reduce the items to get the current count for each facet
        //   // _.each(settings.facets, function (facet) {
        //   _.each(this.currentResults, function (item) {
        //     if (_.isArray(item[facetSetting.field])) {
        //       _.each(item[facetSetting.field], function (facetitem) {
        //         if (_.isEmpty(facetitem)) {
        //           return;
        //         }
        //         count += 1;
        //       });
        //     } else {
        //       if (item[facetSetting.field] !== undefined) {
        //         if (_.isEmpty(item[facetSetting.field])) {
        //           return;
        //         }
        //         count += 1;
        //       }
        //     }
        //   });
        //   // });
        //
        //   // remove confusing 0 from facets where a filter has been set
        //
        //   if (count == 0 && this.settings.state.filters[facetSetting.field].length) count = "+";
        //
        //
        //
        //   //return settings.facetStore[facetSetting.field][item[facetSetting]].count;
        //   return count;
        // },
        /**
         * resets the facet count
         */
        resetFacetCount: function (settings) {
          _.each(settings.facetStore, function (items, facetname) {
            _.each(items, function (value, itemname) {
              settings.facetStore[facetname][itemname].count = 0;
            });
          });
        },
        setFacetCount: function(settings){
          // Update the count for each facet and item:
          // intialize the count to be zero
          this.resetFacetCount(settings);
          // then reduce the items to get the current count for each facet
          _.each(settings.facets, function (facet) {
            _.each(settings.currentResults, function (item) {
              if (_.isArray(item[facet.field])) {
                _.each(item[facet.field], function (facetitem) {
                  if (_.isEmpty(facetitem)) {
                    return;
                  }
                  settings.facetStore[facet.field][facetitem].count += 1;
                });
              } else {
                if (item[facet] !== undefined) {
                  if (_.isEmpty(item[facet.field])) {
                    return;
                  }
                  settings.facetStore[facet.field][item[facet.field]].count += 1;
                }
              }
            });
          });

          // remove confusing 0 from facets where a filter has been set
          _.each(settings.state.filters, function (filters, facettitle) {
            _.each(settings.facetStore[facettitle], function (facet) {
              if (facet.count == 0 && settings.state.filters[facettitle].length) facet.count = "+";
            });
          });
        }
      }


}
</script>

<style scoped>

</style>
