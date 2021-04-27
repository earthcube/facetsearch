<template>
    <b-container fluid="md">
        <b-row class="title_row">
            <b-col md="12">
                <b-btn variant="outline-info" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
                <h4 class="page_title">[[ tool name ]]</h4>
            </b-col>
        </b-row>

        <b-row>
            <b-col md="8">
                <div class="metadata">
                    <div class="label">Type</div>
                    <div class="value">
                        <b-badge variant="secondary" class="mr-1 mb-1">CreativeWork</b-badge>
                        <b-badge variant="secondary" class="mr-1 mb-1">Product</b-badge>
                        <b-badge variant="secondary" class="mr-1 mb-1">SoftwareApplication</b-badge>
                    </div>
                </div>

                <div class="metadata">
                    <div class="label">Abstract</div>
                    <div class="value">Software package to help convert existing paleoclimate observations into LiPD files that can be shared and analyzed. LiPD files are the data standard for storing and exchanging data amongst paleoclimate scientists. Core functions are implemented in MatLab, Python, and R. The function names, parameters and returned data are the same in the different language implementations.<br><br>
                    Functions include:
                    <ul>
                        <li><b>readLipd</b> - Read LiPD files from your computer into your workspace;</li>
                        <li><b>writeLipd</b> - Write LiPD data from your workspace onto your computer;</li>
                        <li><b>extractTs</b> - Extract a time series from one or more datasets in the workspace. Your hierarchical LiPD data structure is extracted into a flattened time series structure;</li>
                        <li><b>collapseTs</b> - Collapse a time series back into LiPD dataset form in the workspace. Your flattened time series structure is condensed back into a hierarchical LiPD data structure;</li>
                        <li><b>filterTs</b> - Retrieve time series objects that match a specific criteria. This filters out the data that you don't want, and returns a new time series of data that you do want;</li>
                        <li><b>queryTs</b> - Retrieve the index numbers of time series objects that match a specific criteria. This filters out the data that you don't want, and returns a list of index numbers of the data that you do want.</li>
                    </ul>

                        Additionally, while the core functions remain the same, we chose to take advantage of the strengths of each language. The Python utilities have additional functions for converting and validating data. The R and Matlab utilities are better suited for data analyzation. The language-specific documentation linked below will go into detail about all the functions included in each language.
                    </div>
                </div>

                <div class="metadata" v-if="true">
                    <div class="label">Creator</div>
                    <div class="value">- [use v-if to hide if no value]</div>
                </div>

                <div class="metadata" v-if="true">
                    <div class="label">Publisher</div>
                    <div class="value">-</div>
                </div>

                <div class="metadata" v-if="true">
                    <div class="label">Date</div>
                    <div class="value">-</div>
                </div>

                <div class="metadata" v-if="true">
                    <div class="label">Citation</div>
                    <div class="value"><a href="https://dx.doi.org/10.1016/J.PALAEO.2004.07.018">https://dx.doi.org/10.1016/J.PALAEO.2004.07.018</a></div>
                </div>

                <div class="metadata" v-if="true">
                    <div class="label">Links</div>
                    <div class="value">
                        <div style="font-weight:600;">Object URL text/plain; application=magic-tsv</div>

                        <div><a href="#">https://earthref.org/MagIC/3484</a></div>
                        <div><a href="#">https://earthref.org/MagIC/download/3484/magic_contribution_348415032.txt</a></div>
                        <div><a href="#">https://earthref.org/MagIC/download/9843/magic_contribution_176534821.txt</a></div>
                    </div>
                </div>
            </b-col>
            <b-col md="4">
            </b-col>
        </b-row>

<!-- TODO move this into a component if keeping for final public view -->
        <b-row>
            <b-col md="12">
                <h5>JSON tree</h5>

                <b-button v-b-toggle.collapse_json variant="outline-secondary">Toggle JSON</b-button>

                <b-collapse id="collapse_json" class="mt-2">
                    <b-card>
<!-- TODO remove inline style attributes -->
                        <b-card-text style="min-height: 300px;">Collapse JSON contents Here</b-card-text>
                    </b-card>
                </b-collapse>
            </b-col>
        </b-row>

        <b-row>
            <b-col md="12">

<h5 class="text-warning">[[TODO determine what info needs to be displayed from below this line and reformat to the above structure]]</h5>
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
console.error('-----');
console.log(this.t);
console.log(this.d);
console.error('=======');
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


.metadata {
    display: flex;
    align-items: baseline;

    font: {
        size: 90%;
    }

    & + .metadata {
        margin: {
            top: $spacer * .4;
        }
    }

    .label {
        flex-shrink: 0;

        width: 140px;

        margin: {
            right: $spacer;
        }

        font: {
            weight: bold;
            size: 80%;
        }
        text: {
            align: right;
            transform: uppercase;
        }
    }

    .value {
        flex-grow: 1;

        @include word-wrap();

        &.buttons {
            .btn {
                margin: {
                    right: $spacer / 4;
                    bottom: $spacer / 4;
                }

                border: 1px solid $secondary;

                &:hover {
                }

                & + .btn {
                }
            }

            @include media-breakpoint-down(md) {
                text: {
                    align: center;
                }

                .btn {
                    padding: ($spacer * .8) ($spacer * 2);
                }
            }
        }

        ul,
        ol {
            margin: {
                top: $spacer;
            }
        }

        b {
            font: {
                weight: 600; //semi-bold
            }
        }
    }

    @include media-breakpoint-down(md) {
        display: block;

        & + .metadata {
            margin: {
                top: $spacer;
            }
        }

        .label {
            width: auto;

            text: {
                align: left;
            }
        }
    }
}

i {
    color: $gray-600;

    font: {
        weight: 300;
    }
}

</style>