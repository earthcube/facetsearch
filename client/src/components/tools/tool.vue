<template>
    <b-container fluid="md">
        <b-row class="title_row">
            <b-col md="12">
                <b-btn variant="outline-info" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>

                <h4 class="page_title">[[page title]]</h4>
            </b-col>
        </b-row>

        <b-row>
            <b-col md="12">
                <ToolMetadata></ToolMetadata>
            </b-col>
        </b-row>

        <b-row>
            <b-col md="12">
                <ToolDatasetLink v-if='d' :d="d"></ToolDatasetLink>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import ToolMetadata from "./toolMetadata";
import ToolDatasetLink from "./toolDatasetLink";

//import {getJsonLD} from '../../api/jsonldObject.js'
//import axios from "axios";
import { mapState,mapActions} from 'vuex'

export default {
name: "dataset",
  components: {ToolMetadata, ToolDatasetLink},
  props:{
   t: String,
    d: String,
  },
  data(){ return {
    //jsonLdobj: {},
    //jsonLoaded: true,
  }},
  async mounted() {

    this.$store.dispatch('fetchToolJsonLd', this.t)
  },
  // watch: {
  //   // call again the method if the route changes
  //   '$route': 'fetchJsonLD'
  // },
  computed: { ...mapState (['toolLdObj','toolLdObjCompact'])

  },
  methods: {...mapActions([
      'fetchToolJsonLd',]),

    // getJsonLD(this.o).then(
    //     function(response) {
    //       self.jsonLdobj= response
    //     // self.$set( self.jsonLdobj , response)
    //       self.jsonLoaded = true
    //     }).catch(
    //         function(err){
    //           console.log("cannot fetch resource"+ err.toString())
    //           self.jsonLoaded = false
    //         }
    // )

  }



}
</script>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

.row {
    padding: {
        bottom: $spacer;
    }

    &.title_row {
        position: sticky;
        top: 0px;
        z-index: 1010;

        background: {
            color: rgba($white, .95); //rgba($gray-300, .95);
        }

        padding: {
            top: $spacer;
        }
    }

    //add a border between rows
    & + .row {
        padding: {
            top: $spacer * 1.5;
        }

        border: {
            top: 1px solid $gray-300;
        }
    }

    .page_title {
        color: $primary;

        margin: {
            top: $spacer;
        }
    }

    @include media-breakpoint-down(md) {
        &.title_row {
            background: {
                color: rgba($gray-300, .95);
            }
        }

        &:not(.title_row) {
            padding: {
                bottom: $spacer * 2.5;
            }
        }

        & + .row {
            padding: {
                top: $spacer * 2;
            }

            border: {
                width: 10px;
            }
        }

        .page_title {
            margin: {
                top: $spacer * 2;
                bottom: $spacer;
            }

            font: {
                size: 130%;
            }
        }
    }
}

</style>
