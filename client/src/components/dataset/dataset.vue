<template>
    <b-container fluid="md">
        <b-row class="title_row">
            <b-col md="12">
                <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>

                <h4 class="page_title"><b>Mulder, F.G. (1965).</b> Paleomagnetic investigation in the Vanern district (Sweden). <i>Geologie en Mijnbouw, Netherlands Journal of Geosciences 44: 307-312.</i> (Dataset)</h4>
            </b-col>
        </b-row>

        <b-row>
            <b-col md="8">
                <div class="metadata">
                    <div class="label">Type</div>
                    <div class="value">
                        <b-icon font-scale="2" class="mr-1" shift-v="-2"
                            :icon="('data' == 'data') ? 'server' : 'tools'" 
                            :variant="('data' == 'data') ? 'data' : 'tool'" 
                        ></b-icon>
                        <b-badge variant="data" class="mr-1 mb-1">Data</b-badge>
                    </div>
                </div>

                <div class="metadata">
                    <div class="label">Abstract</div>
                    <div class="value">Paleomagnetic, rock magnetic, or geomagnetic data found in the MagIC data repository from a paper titled: <b>Mulder, F.G. (1965).</b> Paleomagnetic investigation in the Vanern district (Sweden). <i>Geologie en Mijnbouw, Netherlands Journal of Geosciences 44: 307-312.</i></div>
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

                <div class="metadata mt-4">
                    <div class="label"></div>
                    <div class="value buttons">
<!--                    <b-button variant="outline-secondary">Website</b-button>-->
                        <b-button variant="outline-secondary">Cite</b-button>
                        <b-button variant="outline-secondary">Metadata</b-button>
                    </div>
                </div>

<!-- TODO remove this or change to new structure -->
                <Metadata style="display: none;"></Metadata>
            </b-col>

            <b-col md="4">
                <b-card variant="secondary">
                    <b-card-title>Location</b-card-title>
                    <DatasetLocation></DatasetLocation>
                </b-card>

                <b-card>
                    <b-card-title>Downloads</b-card-title>
                    <downloadfiles></downloadfiles>
                </b-card>
            </b-col>
        </b-row>

        <connected-tools :d="d"></connected-tools>

        <b-row>
            <b-col md="12">
                <h5>Related Data</h5>
                <div>[[ TODO: replace this with real data ]]</div>
                <div>Coral densities and extension rates from scientific literature collected in the field or in laboratories</div>
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
    </b-container>
</template>

<script>
import Metadata from "./metadata.vue";
import DatasetLocation from "./datasetLocation.vue";
import ConnectedTools from "./connectedTools.vue";
import Downloadfiles from "./downloadfiles.vue"
//import {getJsonLD} from '../../api/jsonldObject.js'
//import axios from "axios";
import { mapState,mapActions} from 'vuex'

export default {
name: "dataset",
  components: {ConnectedTools, DatasetLocation, Metadata, Downloadfiles},
  props:{
   d: String,
  },
  data(){ return {
    //jsonLdobj: {},
    //jsonLoaded: true,
  }},
  async mounted() {

    this.$store.dispatch('fetchJsonLd', this.d)
  },
  // watch: {
  //   // call again the method if the route changes
  //   '$route': 'fetchJsonLD'
  // },
  computed: { ...mapState (['jsonLdObj', 'jsonLdCompact'])

  },
  methods: {...mapActions([
      'fetchJsonLd',]),

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

.card {
    background: {
        color: $gray-100;
    }

    & + .card {
        margin: {
            top: $spacer;
        }
    }

    .card-title {
        font: {
            size: 100%;
        }
    }

    //on smaller screens, remove the border and expand to fill
    @include media-breakpoint-down(md) {
        background: none;

        margin: {
            top: $spacer * 2;
        }

        border: 0px;

        & + .card {
            margin: {
                top: $spacer * 2;
            }
        }

        .card-title {
        }

        .card-body {
            padding: 0px;
        }
    }
}

.row {
    padding: {
        bottom: $spacer;
    }

    &.title_row {
        background: {
            color: rgba($white, .95);
        }

        padding: {
            top: $spacer;
        }

        &.is_sticky {
            position: sticky;
            top: 0px;
            z-index: 1010;
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
