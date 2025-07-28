<template>
  <div>
    <div>
      <VueformSlider
        ref="slider"
        v-model="value.range"
        class="mx-2"
        :tooltip="false"
        :min="parseInt(startDate)"
        :max="parseInt(endDate)"
        :disabled="disableDrag"
        @drag-end="updateRange"
      ></VueformSlider>
    </div>
    <div>
      <span
        v-if="filterDates?.length > 0"
        class="text-h2 font-weight-light"
        v-text="value.range[0]"
      ></span>
      <span
        v-if="filterDates?.length > 0"
        class="subheading font-weight-light mr-1"
      >
        year to
      </span>
      <span
        v-if="filterDates?.length > 0"
        class="text-h2 font-weight-light"
        v-text="value.range[1]"
      ></span>
      <span
        v-if="filterDates?.length > 0"
        class="subheading font-weight-light mr-1"
      >
        year</span
      >
    </div>
  </div>
</template>
<script>
import VueformSlider from '@vueform/slider'
import { useStore } from 'vuex'
import { Range } from '@/components/facetsearch/range'
import { computed, ref, watch, inject, nextTick, getCurrentInstance, onUnmounted } from 'vue'
import '@vueform/slider/themes/default.css'
export default {
  components: {
    VueformSlider,
  },
  // provide: function () {
  //   return {
  //     updateRange: this.updateRange,
  //   }
  // },
  inject: ["toggleFilter"],
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
      value: new Range(0,2500),
      olderFilters: [],
      sliderInit: true,
      myfilterDates: [],
      disableDrag: false,
    };
  },
  mounted() {
    this.$root.$on("refresh slider range", (action, start, end, mydata) => {
      this.updateRange(action, start, end, mydata);
    });
  },
  methods: {
    updateRange(action, start, end, mydata) {
      if (this.disableDrag && action != "init") {
        return;
      }
      // if(this.myfilterDates.length === 0) {
      //   return
      // }
      console.log(this.filterDates);
      var newRangeStartDate = this.value.range[0];
      var newRangeEndDate = this.value.range[1];
      if (action === "clear") {
        newRangeStartDate = this.startDate;
        newRangeEndDate = this.endDate;
        //this.value = [newRangeStartDate, newRangeEndDate];
        this.value = new Range(newRangeStartDate, newRangeEndDate);
        this.olderFilters = [];
        return;
      } else if (action === "init") {
        this.sliderInit = true;
        newRangeStartDate = start;
        newRangeEndDate = end;
        this.value = new Range(newRangeStartDate, newRangeEndDate);
        if (start === 0 && end === 0) {
          this.disableDrag = true;
        } else {
          this.disableDrag = false;
        }
        this.myfilterDates = [];
        console.log(mydata);
      } else {
        this.myfilterDates = this.filterDates;
      }

      console.log(newRangeStartDate + ", " + newRangeEndDate);
      // pass the range object
      this.toggleFilter(this.fieldname, this.value);
// original method just created a list
      // var filteredDates = this.myfilterDates.filter(
      //   (date) =>
      //     new Date(date.toString()) >= new Date(newRangeStartDate.toString()) &&
      //     new Date(date.toString()) <= new Date(newRangeEndDate.toString())
      // );
      // console.log(filteredDates);
      //
      // // send difference filters between olderFilters and filteredDates
      // var difference1 = this.olderFilters.filter(
      //   (x) => !filteredDates.includes(x)
      // );
      // var difference2 = filteredDates.filter(
      //   (x) => !this.olderFilters.includes(x)
      // );
      // var difference = difference1.concat(difference2);
      // console.log(difference);
      // this.olderFilters = filteredDates;

      // for (let i = 0; i < difference.length; i++) {
      //   this.toggleFilter(this.fieldname, difference[i]);
      // }
    },
  },
};
</script>
<style scoped lang="scss">
@import "@/assets/bootstrapcss/_variables.scss";
@import "@/assets/bootstrapcss/custom"; // your custom Bootstrap overrides
@import '@vueform/slider/themes/tailwind.scss';

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
/* Custom styles for @vueform/slider */
.slider {
  --slider-handle-bg: #18598b;
  --slider-connect-bg: #18598b;
  --slider-tooltip-bg: #18598b;
  --slider-tooltip-color: white;
  --slider-height: 6px;
  --slider-handle-width: 16px;
  --slider-handle-height: 16px;
  --slider-handle-border-radius: 50%;
  --slider-handle-border: none;
  --slider-handle-shadow: 0 1px 3px rgba(0,0,0,0.3);
  --slider-handle-ring-color: #18598b;
  margin: 20px 10px;
}
</style>
