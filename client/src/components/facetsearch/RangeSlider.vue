<template>
  <div>
    <div>
      <vue-range-slider
        ref="slider"
        v-model="value.range"
        class="mx-2"
        :tooltip="false"
        :min="parseInt(startDate)"
        :max="parseInt(endDate)"
        :disabled="disableDrag"
        @drag-end="updateRange"
      ></vue-range-slider>
    </div>
    <div>
      <span
        v-if="filterDates.length > 0"
        class="text-h2 font-weight-light"
        v-text="value.range[0]"
      ></span>
      <span
        v-if="filterDates.length > 0"
        class="subheading font-weight-light mr-1"
      >
        year to
      </span>
      <span
        v-if="filterDates.length > 0"
        class="text-h2 font-weight-light"
        v-text="value.range[1]"
      ></span>
      <span
        v-if="filterDates.length > 0"
        class="subheading font-weight-light mr-1"
      >
        year</span
      >
    </div>
  </div>
</template>
<script>
import "vue-range-component/dist/vue-range-slider.css";
import VueRangeSlider from "vue-range-component-fixed";
import {Range} from '@/components/facetsearch/range'
export default {
  components: {
    VueRangeSlider,
  },
  // provide: function () {
  //   return {
  //     updateRange: this.updateRange,
  //   }
  // },
  inject: ["toggleFilter"],
  props: {
    fieldname: {
      type: String,
    },
    startDate: {
      required: true,
    },
    endDate: {
      required: true,
    },
    filterDates: [],
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
        this.value = new Range(newRangeStartDate, newRangeEndDateRange);
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
