 <template>
  <div>
    <div v-for="facetSetting in facets" :key="facetSetting.title">
      <FacetText
        v-if="facetSetting.type == 'text'"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
      ></FacetText>

      <FacetNumericRangeSlider
        v-if="facetSetting.type == 'rangeyear'"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
      ></FacetNumericRangeSlider>

      <RangeSliderDepth
        v-if="facetSetting.type == 'rangedepth'"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
          :key="filtersResetToken()"
      ></RangeSliderDepth>

      <RangeSliderYear
        v-if="facetSetting.type == 'rangeyeartemporal'"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
        :key="filtersResetToken()"
      ></RangeSliderYear>

      <GeoBoundingBoxPicker
        v-if="facetSetting.type == 'geo'"
        :facet-setting="facetSetting"
        :facet-store="facetStore"
      ></GeoBoundingBoxPicker>
    </div>
  </div>
</template>

<script>
import FacetText from "@/components/facetsearch/FacetText.vue";
import FacetNumericRangeSlider from "@/components/facetsearch/FacetNumericRangeSlider.vue";
import RangeSliderDepth from "@/components/facetsearch/RangeSliderDepth.vue";
import RangeSliderYear from "@/components/facetsearch/RangeSliderYear.vue";
import GeoBoundingBoxPicker from "@/components/facetsearch/GeoBoundingBoxPicker.vue";

export default {
  inject: ["filtersResetToken", "filtersState", "facetStore", "toggleFilter", "clearFilters"],
  name: "Facets",
  components: {
    FacetText,
    FacetNumericRangeSlider,
    RangeSliderDepth,
    RangeSliderYear,
    GeoBoundingBoxPicker,
  },
  props: {
    facets: {
      type: Array,
      required: true,
    },
    facetStore: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
/* Add any styles you need here */
</style>