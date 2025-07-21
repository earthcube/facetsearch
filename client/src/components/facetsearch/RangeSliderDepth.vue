<template>
  <div class="filter_card">
    <b-button
      v-b-toggle="'accordion_depthrange_' + facetSetting.field"
      block
      squared
    >
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
    <b-collapse :id="'accordion_depthrange_' + facetSetting.field" @shown="onCollapseShown">
      <vue-range-slider
        v-model="value.range"
        ref="rangeSlider"
        :key="sliderKey"
        class="mx-2 py-2"
        :tooltip="false"
        :min="parseInt(minDepth)"
        :max="parseInt(maxDepth)"
        :disabled="disableDrag"
        @drag-end="filtered"
      ></vue-range-slider>
      <div v-if="value.range.length === 2" class="mt-0 px-2 py-0">
        <span class="text-h2 font-weight-light">{{ value.range[0] }}</span>
        <span class="subheading font-weight-light mx-1">to</span>
        <span class="text-h2 font-weight-light">{{ value.range[1] }}</span>
        <span class="subheading font-weight-light ml-1">m</span>
      </div>
    </b-collapse>
  </div>
</template>

<script>
import "vue-range-component/dist/vue-range-slider.css";
import VueRangeSlider from "vue-range-component-fixed";
import {mapState} from "vuex";
import {NumericRange} from '@/components/facetsearch/range'

export default {
  components: {
    VueRangeSlider,
  },
  inject: ["toggleFilter", "filtersState"],
  props: {
    facetSetting: {
      type: Object,
      required: true,
    },
    facetStore: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      mydata: [],
      minDepth: null,
      maxDepth: null,
      value: new NumericRange(-5000,0),
      sliderKey: 0,
      disableDrag: false,
    };
  },
  computed: {
    ...mapState(["results"]),
  },
  watch: {
    results: {
      handler(newResults) {
        const minDepthField = this.facetSetting.range_fields[0]
        const maxDepthFeild = this.facetSetting.range_fields[1]
        const validMinDepths = newResults
          .map(d => parseFloat(d[minDepthField]))
          .filter(d => !isNaN(d));

        const validMaxDepths = newResults
          .map(d => parseFloat(d[maxDepthFeild]))
          .filter(d => !isNaN(d));

        const min = validMinDepths.length > 0 ? Math.min(...validMinDepths) : -10000;
        const max = validMaxDepths.length > 0 ? Math.max(...validMaxDepths) : 10000;

        this.minDepth = min;
        this.maxDepth = max;
        this.value.range[1] = max;
        this.value.range[0] = min;
        this.value.minField = minDepthField;
        this.value.maxField = maxDepthFeild;
        //this.value = ;
      },
      immediate: true // <-- run immediately if `results` already exists
    }
  },
  methods: {
    filtered() {
      //const [selectedMin, selectedMax] = this.value;
      const selectedMin =this.value.range[0];
      const selectedMax =this.value.range[1];
      // pass values to toggleFilter
     // this.toggleFilter("minDepth", selectedMin, true);
    //  this.toggleFilter("maxDepth", selectedMax, true);
   //   this.toggleFilter(this.facetSetting.field, this.value , true);

      // pass in a field name... the numericRange has the field names
      this.toggleFilter(this.facetSetting.field, this.value , false);
    },
    onCollapseShown() {
      // Option A: if the slider instance has a .refresh() API
      if (this.$refs.rangeSlider && this.$refs.rangeSlider.refresh) {
        this.$nextTick(() => this.$refs.rangeSlider.refresh());
        return;
      }
      // Option B: force a remount via key
      this.sliderKey++;
   }
  }


};
</script>
<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";  // your custom Bootstrap overrides

.filter_card {
  background-color: #f5f5f5;
  border: 1px solid rgba(0, 0, 0, 0.125);

  & + .filter_card {
    margin-top: $spacer / 2;
  }

  /* this targets the b-button inside filter_card */
  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;

    &:not(:hover) {
      color: $gray-700;
      background-color: $gray-300;
    }
  }

  .list-group {
    overflow-y: auto;
    max-height: 170px;
  }
}

/* hide/show icons based on collapsed state */
.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

/* if you need flat secondary buttons everywhere */
.btn-secondary,
.btn-secondary:hover {
  background-image: none !important;
}
</style>

