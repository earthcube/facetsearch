<template>
  <div>
    <div>
      <vue-range-slider ref="slider" v-model="value" :min=parseInt(startDate) :max=parseInt(endDate) @drag-end="callbackRange"></vue-range-slider>
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
import VueRangeSlider from 'vue-range-component'
export default {
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
    }
  },
  components: {
    VueRangeSlider
  },
  methods: {
    callbackRange () {
      console.log(this.filterDates)
      var newRangeStartDate = this.value[0]
      var newRangeEndDate = this.value[1]
      console.log(newRangeStartDate + ", " + newRangeEndDate)

      var filteredDates = this.filterDates.filter(date => new Date(date.toString()) >= new Date(newRangeStartDate.toString())
          && new Date(date.toString()) <= new Date(newRangeEndDate.toString()))
      console.log(filteredDates)
      for (let i = 0; i < filteredDates.length; i++) {
        this.toggleFilter('datep', filteredDates[i]);
      }
    }
  },
}
</script>
