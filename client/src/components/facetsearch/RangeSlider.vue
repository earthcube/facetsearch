<template>
  <div>
    <div>
      <vue-range-slider ref="slider" v-model="value" :min=parseInt(yearMin) :max=parseInt(yearMax) @drag-end="callbackRange"></vue-range-slider>
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
  props: {
    yearMin: {
      required: true
    },
    yearMax: {
      required: true
    },
  },
  data() {
    return {
      value: [1980, 2030],
    }
  },
  components: {
    VueRangeSlider
  },
  methods: {
    callbackRange () {
      console.log(this.value)
    }
  },
}
</script>