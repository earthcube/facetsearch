<template>
  <b-list-group-item :class="{ active: isActive }" @click="_handleClick">
    {{ term }}
    <b-badge>{{ count }}</b-badge>
  </b-list-group-item>
</template>

<script>
import { event as gtagevent } from "vue-gtag";
//import _ from "underscore";

export default {
  name: "FacetTextItem",
  inject: ["toggleFilter"],
  props: ["facetSetting", "term", "count", "isActive", "fieldname"],
  computed: {},
  methods: {
    _handleClick: function (event) {
      // const self = this;
      console.log(event);
      //var filter = this.getFilterById(this.id);
      // var filter = self.getFilterById(event.target.id);
      //var filter = this.facetSetting
      // use $nextTick to delay an processing until after the entire dom has been updated.
      // otherwise we get a an error about a null key
      //self.$nextTick(() =>  self.toggleFilter(filter.facetname, filter.filtername) )
      //  self.toggleFilter(filter.field, filter.title); //vue2
      this.toggleFilter(this.fieldname, this.term); // vue3

      // $(this.facetSelector).trigger("facetedsearchfacetclick", filter);
      /**** vue3 off **/
      // bus.$emit("facetedsearchfacetclick", filter)

      //   Vue.$gtag.event('select_content', {
      gtagevent("select_content", {
        content_type: this.fieldname,
        item_id: this.term,
      });
      //Vue.$gtag.event('select_facet', {
      gtagevent("select_facet", {
        // content_type:filter.field,
        // item_id: filter.title,
        event_category: "engagement",
        event_label: "facet_clicked",
        value: `${this.fieldname}:${this.term}`,
      });
      //order();
      // updateFacetUI();
      // updateResults();
    },

    /**
     * get a facetname and filtername by the unique id that is created in the beginning
     */
    // getFilterById: function (id) {
    //   var result = false;
    //   _.each(this.facetStore, function(facet, facetname) {
    //     _.each(facet, function(filter, filtername){
    //       if (filter.id == id) {
    //         result =  {'field': facetname, 'title': filtername};
    //       }
    //     });
    //   });
    //   return result;
    // },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.list-group-item {
  cursor: pointer;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: ($spacer * 0.4) ($spacer * 0.75);

  font: {
    size: 85%;
  }
  line: {
    height: 120%;
  }

  border: 0px;

  &:not(.active) {
    background: none;

    &:hover {
      color: $white;
      background: {
        color: $gray-500;
      }
    }
  }

  &.active {
    color: $white;
    background: {
      color: $primary;
    }

    border: {
      color: #aaa;
    }

    .badge {
      color: $primary;
      background: {
        color: $white;
      }
    }
  }

  .badge {
    min: {
      width: 1rem;
    }

    text: {
      align: center;
    }
  }
}
</style>
