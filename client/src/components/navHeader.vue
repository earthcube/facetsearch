<template>
    <b-navbar toggleable="lg" type="dark" variant="primary" sticky>
        <!-- keep nav centered on wide screens -->
        <b-container fluid="md">
            <!-- only show the back arrow on certain pages and ONLY on small or medium sized devices -->
            <b-navbar-nav class="d-lg-none" v-show="showBackButton()">
                <b-nav-item v-on:click="$router.back()" class="mr-2"><b-btn variant="outline-primary"><b-icon icon="arrow-left" /></b-btn></b-nav-item>
            </b-navbar-nav>

            <!-- can use the :disabled attribute to trigger hidding the logo...but only hiding on small screens (see css below) -->
            <b-navbar-brand href="https://www.earthcube.org/" target="_blank" class="mr-0"><logoEarthcube width="120px" /></b-navbar-brand>
            <b-navbar-brand :to="{name: 'landing'}" class="border-left border-light pl-2 ml-2 mr-auto"
                :disabled="showBackButton()"
            ><logoGeoCodes width="100px" /></b-navbar-brand>

            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

            <b-collapse id="nav-collapse" is-nav>
<!--
              <b-navbar-nav>
                <b-nav-item  :to="{ name: 'landing'}">Home</b-nav-item>
                <b-nav-item  :to="{ name: 'Search', query:{q:q}}">Search</b-nav-item>
              </b-navbar-nav>
-->

              <!-- Right aligned nav items -->
              <b-navbar-nav class="ml-auto menu_nav">
                <b-nav-form v-on:submit.prevent="onSubmitNavbar" v-show="$route.name.toLowerCase() != 'landing'">
                    <b-input-group size="sm">
                        <b-form-input type="search" placeholder="Search"
                            v-model="textQuery"
                            v-on:keydown.enter.exact.prevent="onSubmitNavbar"
                        ></b-form-input>
                        <b-input-group-append>
                            <b-button type="submit" variant="secondary"><b-icon icon="search"></b-icon></b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-nav-form>

                <b-nav-item v-on:click.stop="showSparqlGui"  class="text-nowrap" target="_blank">SPARQL</b-nav-item>
                <b-nav-item :to="{name: 'about'}" class="mr-0" >About</b-nav-item>

              </b-navbar-nav>
            </b-collapse>
        </b-container>
    </b-navbar>
</template>

<script>
import {mapState} from "vuex";
import logoEarthcube from "@/components/logos/logoEarthcube";
import logoGeoCodes from "@/components/logos/logoGeoCodes";
import {stringify} from "query-string"
import _ from "lodash"

export default {
name: "navHeader",
  components: {logoEarthcube, logoGeoCodes},
  computed: {
    ...mapState(['results','searchExactMatch', 'q','rt', 'SpaqlQuery','esTemplateOptions','TRIPLESTORE_URL']),

  },
  watch:{
  q: 'qUpdated',
    rt: 'rtUpdated'
  },
  data() {
  return {
    textQuery:'',
    resourceType:'All'
  }
  },
  methods:{
    showBackButton() {
    return false;
//        return (['dataset', 'tool'].includes(this.$route.name.toLowerCase())) ? true : false;
    },
    qUpdated() {
        this.textQuery = this.q
    },
    rtUpdated() {
      this.resourceType = this.rt
    },
    onSubmitNavbar(){
      this.$store.state.q = this.textQuery;
      this.$store.state.rt = 'all' // for now
      this.$router.push({name: 'Search', query:{q:this.q, resourceType: 'all'} }).catch(err => {console.log('ignore'+err)})
    },
    showSparqlGui(){
      // need to add all the parameters as query parameters
      let basepath =  'http://alpha.geocodes.earthcube.org/sparqlgui#';
      // need to add
      //window.open("https://graph.geodex.org/blazegraph/#query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0APREFIX%20bds%3A%20%3Chttp%3A%2F%2Fwww.bigdata.com%2Frdf%2Fsearch%23%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20%20%20%3Fdatep%20%20%20%3Fscore%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%20%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Asearch%20%22" +this.q+ "%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3AmatchAllTerms%20%22false%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Arelevance%20%3Fscore%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20%3Fp%20%3Flit%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%20%20%20%20%20%20%20%20%20%20%20%20filter(%20%3Fscore%20%3E%200.04).%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(%20!%20isBlank(%3Fsubj)%20)%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22no%3AdatePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22no%3Apublisher.name%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22no%3AspatialCoverage.name%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fdatep%20%3Fpubname%20%3Fname%20%3Fdescription%20%3Fscore%20%3FresourceType%20%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)&endpoint=https%3A%2F%2Fgraph.geodex.org%2Fblazegraph%2Fnamespace%2Fnabu%2Fsparql&requestMethod=POST&tabTitle=Query&headers=%7B%7D&contentTypeConstruct=application%2Fn-triples%2C*%2F*%3Bq%3D0.9&contentTypeSelect=application%2Fsparql-results%2Bjson%2C*%2F*%3Bq%3D0.9&outputFormat=table")
      // this needs to be unencoded and split. hell just import the actual query template.
      //let query= "PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0APREFIX%20bds%3A%20%3Chttp%3A%2F%2Fwww.bigdata.com%2Frdf%2Fsearch%23%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20%20%20%3Fdatep%20%20%20%3Fscore%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%20%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Asearch%20%22" +this.q+ "%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3AmatchAllTerms%20%22false%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Arelevance%20%3Fscore%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20%3Fp%20%3Flit%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%20%20%20%20%20%20%20%20%20%20%20%20filter(%20%3Fscore%20%3E%200.04).%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(%20!%20isBlank(%3Fsubj)%20)%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22no%3AdatePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22no%3Apublisher.name%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22no%3AspatialCoverage.name%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fdatep%20%3Fpubname%20%3Fname%20%3Fdescription%20%3Fscore%20%3FresourceType%20%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)"
      let filterText = this.q? this.q: 'Ridgecrest'
      let querytemplate = _.template(this.SpaqlQuery,this.esTemplateOptions)
      let rt = Array.from(this.$store.state.resourceTypeList.values()).join(" UNION ")
      let query = querytemplate({q:filterText,o:0,n:20, rt:rt, exact:false})
      let paramData = {
        query:query,
        endpoint:this.TRIPLESTORE_URL,
        requestMethod:"POST",
        tabTitle:this.q? this.q: 'Ridgecrest 2019' ,

//        headers:"%7B%7D" ,
 //       contentTypeConstruct:"application/n-triples%2C*%2F*%3Bq%3D0.9",
 //     contentTypeSelect:"application/sparql-results%2Bjson%2C*%2F*%3Bq%3D0.9",
      //outputFormat:"table"
        outputFormat:"rawResponse"

      }
      let route = stringify(paramData)
      let acutalUrl = basepath +route

      window.open(acutalUrl, '_blank')
    }
  }
}
</script>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

.navbar {
    //make flat color
    &.bg-primary {
        background: {
            color: #0C3C60 !important;
            image: none;
        }
    }

    .btn-secondary,
    .btn-secondary:hover {
        background: {
            image: none;
        }
    }

    //on smaller screens, force search box full width
    @include media-breakpoint-down(md) {
        .menu_nav {
            padding: {
                top: $spacer;
                bottom: $spacer * 2;
            }

            form {
                width: 100%;

                margin: {
                    top: $spacer;
                    bottom: $spacer;
                }
            }
        }
    }

    //on larger screens, add margins to the search form
    @include media-breakpoint-up(lg) {
        .form-inline {
            margin: {
                right: $spacer / 4;
                left: $spacer / 4;
            }
        }
    }
}

.navbar-brand {
    //only hide the logo when on smaller screens
    @include media-breakpoint-down(md) {
        &.disabled {
            display: none;
        }
    }
}

</style>
