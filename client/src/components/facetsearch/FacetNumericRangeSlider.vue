<template>
  <div class="filter_card">
    <b-button block squared v-b-toggle="'accordion_slider'+ facetSetting.field">
      {{ facetSetting.title }}
      <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>
      <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>
    </b-button>

<!--    <span>startDate: {{startYear}}</span>-->
<!--    <span>startDate: {{startMonth}}</span>-->
<!--    <span>startDate: {{startDay}}</span>-->
<!--    <span>endDate: {{endYear}}</span>-->
<!--    <span>range: {{sliderrange}}</span>-->

    <b-collapse
        :id="'accordion_slider'+ facetSetting.field"
        :visible="facetSetting.open"
    >
<!--      <div>-->
<!--        <HistRangeSlider :startDate="startDate" :end-date="endDate"> </HistRangeSlider>-->
<!--      </div>-->

      <HistogramSlider
          style="margin: 200px auto"
          :data="mydata"
          :width="200"
          :bar-height="50"
          :prettify="prettify"
          :drag-interval="true"
          :force-edges="false"
          :colors="['#4facfe', '#00f2fe']"
          :min="new Date(1950,1,1).valueOf()"
          :max="new Date(2050,1,1).valueOf()"
          @finish="sliderChanged"
      >
      </HistogramSlider>

      <span v-if="rangeShow=='yes'" >Range startDate: {{rangeStartDate}}  to  </span>
      <span v-if="rangeShow=='yes'" >Range endDate: {{rangeEndDate}}</span>

<!--      <span-->
<!--          class="text-h2 font-weight-light"-->
<!--          v-text="daterange.startDate"-->
<!--      ></span>-->
<!--      <span class="subheading font-weight-light mr-1">  to  </span>-->
<!--      <span-->
<!--          class="text-h2 font-weight-light"-->
<!--          v-text="daterange.endDate"-->
<!--      ></span>-->
<!--      <span class="subheading font-weight-light mr-1"> year</span>-->
    </b-collapse>

  </div>


</template>
<script>

// import 'vue-range-component/dist/vue-range-slider.css'
// import VueRangeSlider from 'vue-range-component'
// import HistRangeSlider from './HistRangeSlider.vue'

import datafile from "./data.json";
import HistogramSlider from 'vue-histogram-slider';
import 'vue-histogram-slider/dist/histogram-slider.css';
import {mapState} from "vuex";


export default {
  name: "FacetRange",
  props: {
    startYear: {
      type: String
    },
    startMonth: {
      type: String
    },
    startDay: {
      type: String
    },
    endYear: {
      type: String
    },
    endMonth: {
      type: String
    },
    endDay: {
      type: String
    },
    // startDate: {
    //   year: "numeric",
    //   month: "short",
    //   day: "numeric",
    //   required: true
    // },
    // endDate: {
    //   year: "numeric",
    //   month: "short",
    //   day: "numeric",
    //   required: true
    // },
    sliderrange: Array,
    binSize: {
      default: 1,
      type: Number
    },
    "facetSetting": Object,
    "facetStore": Object,
    "state": Object,
  },
  data() {
    return {
      myself: "this",
      // mydata:[],
      mydata: datafile.map(d => new Date(d).valueOf()),
      rangeShow: "no",
      rangeStartDate: "",
      rangeEndDate: "",
      facetItems: this.facetStore[this.facetSetting.field],
      prettify: function(ts) {
        var newDate = new Date(ts).toLocaleDateString("en", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
        return newDate;
      }
    }
  },
  components: {
    // VueRangeSlider,
    HistogramSlider
  },
  computed: {
    ...mapState(['results']),
    //...mapGetters(['q',])
  },
  watch: {
    results: 'calculateYearHistorgram',
  },
  mounted() {
    console.log(this.sliderrange)
  },
  methods: {
    sliderChanged(values) {
      console.log(values)
      // this.rangeShow = "yes"
      // this.rangeStartDate = new Date(values.from).toISOString().slice(0,10).replace(/-/g,"-")
      // this.rangeEndDate = new Date(values.to).toISOString().slice(0,10).replace(/-/g,"-")
      // console.log("drag: " + this.rangeStartDate + ", to " + this.rangeEndDate)
    }
    ,
    calculateYearHistorgram(){
      console.log(this.results)
      // calculate the sliderrange
      // this.sliderrange = [ "1985-01-01T06:00:00.000Z", "2008-01-01T06:00:00.000Z", "2008-01-01T06:00:00.000Z",  "2008-01-01T06:00:00.000Z", "2020-01-01T06:00:00.000Z" ]
      // for (let date in datafile.map(d => new Date(d).valueOf())) {
      //   this.mydata.push(date)
      // }

      // not fully sure this will work... but just the idea of a map fuction to get values.
      // need to trim to first 4 charaters... and trap missing value.

      // eslint-disable-next-line no-unused-vars
      var years = this.facetItems.reduce(function (freqs, val, i) {
        var bin = (this.binSize * val);
        freqs[bin] ? freqs[bin]++ : freqs[bin] = 1;
        return freqs;
      }, {})
      return years
    }
  },
}
</script>
<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';


.filter_card {
  background: {
    color: #f5f5f5;
  }

  border: 1px solid rgba(0,0,0, .125);

  & + .filter_card {
    margin: {
      top: $spacer / 2;
    }
  }

  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:not(:hover) {
      color: $gray-700;
      background: {
        color: $gray-300;
      }
    }

    border: 0px;
  }

  .list-group {
    overflow: {
      y: auto;
    }

    max: {
      height: 170px;
    }
  }
}

//make flat color
.btn-secondary,
.btn-secondary:hover {
  background: {
    image: none;
  }
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

</style>
