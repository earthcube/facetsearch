<template>
    <b-container fluid="md" class="mt-5">
        <!-- allow logo to size according to container. fill with primary color from bootstrap variables -->
        <b-container class="col-md-5 pt-5">
            <logoGeoCodes fill="#18598b" width="100%" />
        </b-container>

        <b-container class="col-md-5 mt-4">
            <b-form @submit="onSubmit" @reset="onReset">
                <b-input-group>
                    <b-form-input v-model="q" id="q" name="q" placeholder="Search" aria-label="Search"></b-form-input>

                    <b-input-group-append>
                        <b-button variant="primary" type="submit"><b-icon icon="search" /></b-button>
                    </b-input-group-append>
                </b-input-group>

                <b-form-group class="mt-2">
                    <b-form-radio-group
                        v-model="toolOptionsSelected"
                        :options="toolOptions"
                        name="resourceType"
                        id="resourceType"
                    ></b-form-radio-group>
                </b-form-group>
            </b-form>
        </b-container>

        <b-container fluid="md" class="mt-5">
            <b-carousel
                id="carousel-landing"
                v-model="slide"
                :interval="4000"
                fade
                indicators
            >
                <b-carousel-slide>
                    an interdisciplinary geoscience data <span class="text-nowrap">and tool search engine</span>
                </b-carousel-slide>
                <b-carousel-slide>
                    a schema.org/Dataset search
                </b-carousel-slide>
                <b-carousel-slide>
                    Geoscience Cyberinfrastructure <span class="text-nowrap">for Open Discovery</span> <span class="text-nowrap">in the Earth Sciences</span>
                </b-carousel-slide>
            </b-carousel>
        </b-container>
    </b-container>
</template>

<script>
//import VueRouter from 'vue-router'
import logoGeoCodes from "@/components/logos/logoGeoCodes";

export default {
  name: "landing",
  components: {logoGeoCodes},
  data() {
    return {
      q: '',
      toolOptionsSelected: 'all',
      toolOptions: [
        {value: 'all', text: "All"},
        {value: 'tool', text: "Tool"},
        {value: 'data', text: "Data"}
      ]
,slide: 0,

    }
  },
  methods: {
    onSubmit() {
      var query = this.q;
      var resourceType = this.toolOptionsSelected
      this.$router.push({name: 'Search', query: {q: query, resourceType: resourceType}})
    },
    onReset() {
      this.q = ''
    }
  }
}
</script>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

//use v-deep to style the inner carousel components
.carousel::v-deep {
    .carousel-inner {
        .carousel-item {
            height: 240px;

            background: {
                color: $white;
            }

            .carousel-caption {
                top: 0px;
                left: 0px !important;
                right: 0px !important;
                bottom: auto !important;

                color: $gray-500;

                padding: 0px;

                font: {
                    size: 140%;
                }
                line: {
                    height: 140%;
                }

//                @include translate(0%, 50%); //set top: 50% and activate this line if you want vertically centered text

                @include media-breakpoint-down(md) {
                    font: {
                        size: 120%;
                    }
                    
                    .text-nowrap {
                        //remove no wrap on small screens
                        white-space: normal !important;
                    }
                }
            }
        }
    }
}

</style>
