<template>
  <div>
    <div>
      <vue-range-slider
          ref="slider" class="mx-2" v-model="value" :tooltip="false"
          :min=parseInt(startDate) :max=parseInt(endDate) @drag-end="updateRange"></vue-range-slider>
    </div>
    <div>
    <span
        class="text-h2 font-weight-light"
        v-text="value[0]"
    ></span>
      <span class="subheading font-weight-light mr-1"> year to </span>
      <span
          class="text-h2 font-weight-light"
          v-text="value[1]"
      ></span>
      <span class="subheading font-weight-light mr-1"> year</span>
    </div>
  </div>

</template>
<script>
import 'vue-range-component/dist/vue-range-slider.css'
import VueRangeSlider from 'vue-range-component-fixed'
export default {
  // provide: function () {
  //   return {
  //     updateRange: this.updateRange,
  //   }
  // },
  inject: ["toggleFilter"],
  props: {
    startDate: {
      required: true
    },
    endDate: {
      required: true
    },
    filterDates : []
  },
  data() {
    return {
      value: [0, 2050],
      olderFilters: [],
      sliderInit: true,
      myfilterDates : []
    }
  },
  components: {
    VueRangeSlider
  },
  mounted() {
    this.$root.$on('refresh slider range', (action, start, end, mydata) => {
      this.updateRange(action, start, end, mydata);
    });
  },
  methods: {
    updateRange (action, start, end, mydata) {
      console.log(this.filterDates)
      var newRangeStartDate = this.value[0]
      var newRangeEndDate = this.value[1]
      if (action === 'clear') {
        newRangeStartDate = this.startDate
        newRangeEndDate = this.endDate
        this.value = [newRangeStartDate, newRangeEndDate]
        this.olderFilters = []
        return

      } else if(action == 'init') {
        this.sliderInit = true
        newRangeStartDate = start
        newRangeEndDate = end
        this.value = [newRangeStartDate, newRangeEndDate]
        this.myfilterDates = []
        console.log(mydata)
      } else if(this.startDate == this.value[0] && this.endDate == this.value[1]) {
        console.log("empty the filter")
        this.myfilterDates = []
      } else {
        this.myfilterDates = this.filterDates
      }

      console.log(newRangeStartDate + ", " + newRangeEndDate)

      var filteredDates = this.myfilterDates.filter(date => new Date(date.toString()) >= new Date(newRangeStartDate.toString())
          && new Date(date.toString()) <= new Date(newRangeEndDate.toString()))
      console.log(filteredDates)

      // send difference filters between olderFilters and filteredDates
      var difference1 = this.olderFilters.filter(x => !filteredDates.includes(x));
      var difference2 = filteredDates.filter(x => !this.olderFilters.includes(x));
      var difference = difference1.concat(difference2)
      console.log(difference)
      this.olderFilters = filteredDates

      for (let i = 0; i < difference.length; i++) {
        this.toggleFilter('datep', difference[i]);
      }
    }
  },
}
</script>
