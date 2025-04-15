<template>
  <div id="facets">
    <div v-for="facetSetting in facets" :key="facetSetting.title">
      <FacetText
        v-if="facetSetting.type == 'text'"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
        :fieldname="facetSetting.field"
      >
      </FacetText>
      <!--  <Facet v-for="facetkey in Object.keys(facetStore2)" v-bind:key="facetkey"-->
      <!--         v-bind:facetSetting="facets.find( (obj) => obj.field === facetkey)"-->
      <!--         v-bind:facetStore="facetStore2" >-->
      <!--  </Facet>-->

      <FacetNumericRangeSlider
        v-if="facetSetting.type == 'range'"
        :field-name="facetSetting.field"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
      >
      </FacetNumericRangeSlider>

      <RangeSliderDepth
        v-if="facetSetting.type == 'rangedepth'"
        :field-name="facetSetting.field"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
      >
      </RangeSliderDepth>
    </div>
  </div>
</template>

<script>
import FacetText from "@/components/facetsearch/FacetText.vue";
import FacetNumericRangeSlider from "@/components/facetsearch/FacetNumericRangeSlider.vue";
import RangeSliderDepth from "@/components/facetsearch/RangeSliderDepth.vue";
//import { inject } from 'vue'
export default {
  name: "Facets",
  // setup(){
  //   // eslint-disable-next-line
  //   const toggleFilter = inject("toggleFilter")
  //   // eslint-disable-next-line
  //   const facetStore = inject('facetStore')
  // },
  components: {
    FacetText,
    FacetNumericRangeSlider,
    RangeSliderDepth
  },
  inject: ["toggleFilter", "filtersState"],
  props: {
    facetStore: Object,
    facets: Array,
    //  "state": Object,
    //   "currentResults": Array
  },
  data: function () {
    return {
      facetStore2: this.facetStore,
    };
  },
  methods: {
    //  updateFacets(){
    //   this.$forceUpdate();
    // }
  },
};
</script>

<style scoped></style>
