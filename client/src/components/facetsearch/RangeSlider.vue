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
      var newRangeStartDate = this.value[0]
      var newRangeEndDate = this.value[1]
      console.log(newRangeStartDate + ", " + newRangeEndDate)
      this.toggleFilter('datep', newRangeStartDate.toString());
      // this.toggleFilter('datep', newRangeEndDate);
    }
  },
}
</script>
