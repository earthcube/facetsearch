<template>
  <div id="facets2">
    <div v-for="facetSetting in facets" :key="facetSetting.field" class="mb-3">
      <!-- Text Facets -->
      <FacetText2
        v-if="facetSetting.type === 'text'"
        :facet-config="facetSetting"
      />

      <!-- Range Facets -->
      <RangeSliderYear2
        v-else-if="facetSetting.type === 'range' || facetSetting.type === 'rangeyear'"
        :facet-config="facetSetting"
      />

      <!-- Depth Range -->
      <RangeSliderDepth2
        v-else-if="facetSetting.type === 'rangedepth'"
        :facet-config="facetSetting"
      />

      <!-- Geo Bounding Box -->
      <GeoBoundingBoxPicker2
        v-else-if="facetSetting.type === 'geo'"
        :facet-config="facetSetting"
      />
    </div>
  </div>
</template>

<script>
import FacetText2 from './FacetText2.vue';
import RangeSliderYear2 from './RangeSliderYear2.vue';
import RangeSliderDepth2 from './RangeSliderDepth2.vue';
import GeoBoundingBoxPicker2 from './GeoBoundingBoxPicker2.vue';

export default {
  name: "Facets2",

  components: {
    FacetText2,
    RangeSliderYear2,
    RangeSliderDepth2,
    GeoBoundingBoxPicker2,
  },

  props: {
    facets: {
      type: Array,
      required: true
    }
  }
};
</script>