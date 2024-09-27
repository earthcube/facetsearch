<template>
  <div>
    <div>
      <VueSlider
        ref="slider"
        v-model="value"
        size="medium"
        thumb-size="large"
        class="w-full py1"

        :tooltips="false"
        :min="parseInt(startDate)"
        :max="parseInt(endDate)"
        :disabled="disableDrag"
        @dragEnd="updateRange"
      ></VueSlider>
    </div>
    <div>
      <span
        v-if="filterDates.length > 0"
        class="text-h2 font-weight-light"
        v-text="value[0]"
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
        v-text="value[1]"
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

import VueSlider from "vue-3-slider-component";
export default {
  components: {
    VueSlider,
  },
  // provide: function () {
  //   return {
  //     updateRange: this.updateRange,
  //   }
  // },
  inject: ["toggleFilter"],
  props: {
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
      value: [0, 2050],
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
      var newRangeStartDate = this.value[0];
      var newRangeEndDate = this.value[1];
      if (action === "clear") {
        newRangeStartDate = this.startDate;
        newRangeEndDate = this.endDate;
        this.value[0] = newRangeStartDate
        this.value[1] =newRangeEndDate;
        this.olderFilters = [];
        return;
      } else if (action == "init") {
        this.sliderInit = true;
        newRangeStartDate = start;
        newRangeEndDate = end;
        this.value[0] = newRangeStartDate
        this.value[1] =newRangeEndDate;
        if (start === 0 && end === 0) {
          this.disableDrag = true;
        } else {
          this.disableDrag = false;
        }
        this.myfilterDates = new Array(0,0)
        console.log(mydata);
      } else {
        this.myfilterDates = this.filterDates;
      }

      console.log(newRangeStartDate + ", " + newRangeEndDate);

      var filteredDates = this.myfilterDates.filter(
        (date) =>
          new Date(date.toString()) >= new Date(newRangeStartDate.toString()) &&
          new Date(date.toString()) <= new Date(newRangeEndDate.toString())
      );
      console.log(filteredDates);

      // send difference filters between olderFilters and filteredDates
      var difference1 = this.olderFilters.filter(
        (x) => !filteredDates.includes(x)
      );
      var difference2 = filteredDates.filter(
        (x) => !this.olderFilters.includes(x)
      );
      var difference = difference1.concat(difference2);
      console.log(difference);
      this.olderFilters = filteredDates;

      for (let i = 0; i < difference.length; i++) {
        this.toggleFilter("datep", difference[i]);
      }
    },
  },
};
</script>
