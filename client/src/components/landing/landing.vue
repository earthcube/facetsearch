<template>
  <b-container fluid="md" class="mt-5">
    <!-- allow logo to size according to container. fill with primary color from bootstrap variables -->
    <b-container class="col-md-5 pt-5">
      <logoGeoCodes fill="#18598b" width="100%" />
    </b-container>

    <b-container class="col-md-5 mt-4">
      <b-form @submit="onSubmit" @reset="onReset">
        <b-input-group>
          <b-form-input
            id="q"
            v-model="q"
            name="q"
            placeholder="Search"
            aria-label="Search"
          ></b-form-input>

          <b-input-group-append>
            <b-button variant="primary" type="submit" class="mr-2"
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-search"
                viewBox="0 0 16 16"
              >
                <path
                  d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"
                /></svg
            ></b-button>
            <VueToggles
              id="checkbox"
              :value="searchExactMatchBUtton"
              :height="35"
              :width="75"
              checked-text="AND"
              unchecked-text="OR"
              checked-bg="#777"
              :disabled="false"
              @click="searchExactMatchBUtton = !searchExactMatchBUtton"
            />
            <b-tooltip target="checkbox1" placement="right" triggers="hover">
              {{
                searchExactMatchBUtton
                  ? "Unselect to match any of the search terms"
                  : "Select to match all of the search terms"
              }}
            </b-tooltip>
          </b-input-group-append>
        </b-input-group>

        <!--TODO: work on the radio buttons and show them -->
        <b-form-group v-show="false" class="mt-2">
          <b-form-radio-group
            id="resourceType"
            v-model="toolOptionsSelected"
            :options="toolOptions"
            name="resourceType"
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
          an interdisciplinary geoscience data
          <span class="text-nowrap">and tool search engine</span>
        </b-carousel-slide>
        <b-carousel-slide> a schema.org/Dataset search </b-carousel-slide>
        <b-carousel-slide>
          Geoscience Cyberinfrastructure
          <span class="text-nowrap">for Open Discovery</span>
          <span class="text-nowrap">in the Earth Sciences</span>
        </b-carousel-slide>
      </b-carousel>
    </b-container>
  </b-container>
</template>

<script>
//import VueRouter from 'vue-router'
import logoGeoCodes from "@/components/logos/logoGeoCodes.vue";
import { mapMutations } from "vuex";
import VueToggles from "vue-toggles";


export default {
  name: "Landing",
  components: { logoGeoCodes, VueToggles },
  data() {
    return {
      q: "",
      searchExactMatchBUtton: false,
      toolOptionsSelected: "all",
      toolOptions: [
        { value: "all", text: "All" },
        { value: "tool", text: "Tool" },
        { value: "data", text: "Data" },
      ],
      slide: 0,
    };
  },
  methods: {
    ...mapMutations(["setTextQuery", "setResourceTypeQuery"]),
    onSubmit() {
      var query = this.q;
      var resourceType = this.toolOptionsSelected;
      this.$router.push({
        name: "Search",
        query: {
          q: query,
          searchExactMatch: this.searchExactMatchBUtton,
          resourceType: resourceType,
        },
      });
    },
    onReset() {
      this.setTextQuery("");
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

//use v-deep to style the inner carousel components
.carousel:deep(.carousel-inner) {
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
</style>
