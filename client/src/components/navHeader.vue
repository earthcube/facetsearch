<template>
  <b-navbar toggleable="lg" type="dark" variant="primary" sticky>
    <!-- keep nav centered on wide screens -->
    <b-container fluid="md">
      <!-- only show the back arrow on certain pages and ONLY on small or medium sized devices -->
      <b-navbar-nav v-show="showBackButton()" class="d-lg-none">
        <b-nav-item class="mr-2" @click="$router.back()"
          ><b-btn variant="outline-primary"><b-icon icon="arrow-left" /></b-btn
        ></b-nav-item>
      </b-navbar-nav>

      <!-- can use the :disabled attribute to trigger hidding the logo...but only hiding on small screens (see css below) -->
      <b-navbar-brand
        href="https://www.earthcube.org/geocodes"
        target="_blank"
        class="mr-0"
        ><logoEarthcube width="120px"
      /></b-navbar-brand>
      <b-navbar-brand
        :to="{ name: 'landing' }"
        class="border-left border-light pl-2 ml-2 mr-auto"
        :disabled="showBackButton()"
        >
        <logoGeoCodes v-if="!this.tenantData" width="100px"/>
        <img v-if="this.tenantData" :src="this.tenantData.tenant[0].logo" alt="this.tenantData.tenant[0].community" class="logo" />
      </b-navbar-brand>

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
          <b-nav-form
            v-show="$route.name.toLowerCase() != 'landing'"
            @submit.prevent="onSubmitNavbar"
          >
            <b-input-group size="sm">
              <b-form-input
                v-model="textQuery"
                type="search"
                placeholder="Search"
                @keydown.enter.exact.prevent="onSubmitNavbar"
              ></b-form-input>

              <b-input-group-append>
                <b-button type="submit" variant="secondary" class="mr-2"
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
              </b-input-group-append>
              <VueToggles
                :value="exact"
                :height="30"
                :width="75"
                checked-text="AND"
                unchecked-text="OR"
                checked-bg="#777"
                :disabled="false"
                @click="exact = !exact"
              />
              <b-tooltip target="checkbox" placement="right" triggers="hover">
                {{
                  this.searchExactMatch
                    ? "Unselect to match any of the search terms"
                    : "Select to match all of the search terms"
                }}
              </b-tooltip>
            </b-input-group>
          </b-nav-form>
          <!--                <div class="badges mt-2">-->
          <!--                  <b-button variant="link" size="sm" class="ml2-auto" v-on:click="addToCollection">Store Query</b-button>-->
          <!--                </div>-->
          <b-nav-item :to="{ name: 'collection' }" class="mr-0"
            >Saved Items</b-nav-item
          >

          <b-dropdown text="SPARQL" variant="primary">
            <b-dropdown-item target="_blank" @click.stop="showSparqlGui"
              >SPARQL UI</b-dropdown-item
            >
            <b-dropdown-item target="_blank" @click.stop="showSparqlNb"
              >SPARQL Notebook</b-dropdown-item
            >
          </b-dropdown>

          <b-nav-item :to="{ name: 'about' }" class="mr-0">About</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-container>
  </b-navbar>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import logoEarthcube from "@/components/logos/logoEarthcube.vue";
import logoGeoCodes from "@/components/logos/logoGeoCodes.vue";
import { stringify } from "query-string";
import _ from "lodash";
import VueToggles from "vue-toggles";
//import FacetsConfig from "../config";

export default {
  configureCompat: { ATTR_FALSE_VALUE: false },
  name: "NavHeader",
  components: { logoEarthcube, logoGeoCodes, VueToggles },
  computed: {
    ...mapState([
      "results",
      "searchExactMatch",
      "q",
      "rt",
      "SpaqlQuery",
      "esTemplateOptions",
      "TRIPLESTORE_URL",
      "FacetsConfig",
      "resourceTypeList",
      "tenantData"
    ]),
    tenantData() {
      return this.$store.getters.getTenantData;
    }
  },
  watch: {
    q: "qUpdated",
    rt: "rtUpdated",
    searchExactMatch: "exactUpdated"
  },
  data() {
    return {
      textQuery: "",
      exact: false,
      resourceType: "All",
    };
  },
  methods: {
    ...mapMutations([
      "setTextQuery",
      "setResourceTypeQuery",
      "setSearchExactMatch",
    ]),
    showBackButton() {
      return false;
      //        return (['dataset', 'tool'].includes(this.$route.name.toLowerCase())) ? true : false;
    },
    qUpdated() {
      this.textQuery = this.q;
    },
    rtUpdated() {
      this.resourceType = this.rt;
    },
    exactUpdated() {
      this.exact = this.searchExactMatch;
    },
    onSubmitNavbar() {
      //  this.$store.state.q = this.textQuery;
      //  this.$store.state.rt = 'all' // for now
      this.setTextQuery(this.textQuery);
      this.setResourceTypeQuery("all"); // for now
      this.setSearchExactMatch(this.exact);
      this.$router
        .push({
          name: "Search",
          query: {
            q: this.q,
            searchExactMatch: this.searchExactMatch,
            resourceType: "all",
          },
        })
        .catch((err) => {
          console.log("ignore" + err);
        });
    },
    showSparqlGui() {
      // need to add all the parameters as query parameters
      let basepath = this.FacetsConfig.SPARQL_YASGUI;
      // need to add
      //window.open("https://graph.geodex.org/blazegraph/#query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0APREFIX%20bds%3A%20%3Chttp%3A%2F%2Fwww.bigdata.com%2Frdf%2Fsearch%23%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20%20%20%3Fdatep%20%20%20%3Fscore%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%20%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Asearch%20%22" +this.q+ "%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3AmatchAllTerms%20%22false%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Arelevance%20%3Fscore%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20%3Fp%20%3Flit%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%20%20%20%20%20%20%20%20%20%20%20%20filter(%20%3Fscore%20%3E%200.04).%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(%20!%20isBlank(%3Fsubj)%20)%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22no%3AdatePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22no%3Apublisher.name%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22no%3AspatialCoverage.name%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fdatep%20%3Fpubname%20%3Fname%20%3Fdescription%20%3Fscore%20%3FresourceType%20%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)&endpoint=https%3A%2F%2Fgraph.geodex.org%2Fblazegraph%2Fnamespace%2Fnabu%2Fsparql&requestMethod=POST&tabTitle=Query&headers=%7B%7D&contentTypeConstruct=application%2Fn-triples%2C*%2F*%3Bq%3D0.9&contentTypeSelect=application%2Fsparql-results%2Bjson%2C*%2F*%3Bq%3D0.9&outputFormat=table")
      // this needs to be unencoded and split. hell just import the actual query template.
      //let query= "PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0APREFIX%20bds%3A%20%3Chttp%3A%2F%2Fwww.bigdata.com%2Frdf%2Fsearch%23%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20%20%20%3Fdatep%20%20%20%3Fscore%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%20%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Asearch%20%22" +this.q+ "%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3AmatchAllTerms%20%22false%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Arelevance%20%3Fscore%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20%3Fp%20%3Flit%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%20%20%20%20%20%20%20%20%20%20%20%20filter(%20%3Fscore%20%3E%200.04).%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(%20!%20isBlank(%3Fsubj)%20)%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22no%3AdatePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22no%3Apublisher.name%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22no%3AspatialCoverage.name%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fdatep%20%3Fpubname%20%3Fname%20%3Fdescription%20%3Fscore%20%3FresourceType%20%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)"
      let filterText = this.q ? this.q : "Ridgecrest";
      let querytemplate = _.template(this.SpaqlQuery, this.esTemplateOptions);
      //let rt = Array.from(this.$store.state.resourceTypeList.values()).join(" UNION ")
      let rt = Array.from(this.resourceTypeList.values()).join(" UNION ");
      let query = querytemplate({
        q: filterText,
        o: 0,
        n: 20,
        rt: rt,
        exact: false,
      });
      let paramData = {
        query: query,
        endpoint: this.TRIPLESTORE_URL,
        requestMethod: "POST",
        tabTitle: this.q ? this.q : "Ridgecrest 2019",

        //        headers:"%7B%7D" ,
        //       contentTypeConstruct:"application/n-triples%2C*%2F*%3Bq%3D0.9",
        //     contentTypeSelect:"application/sparql-results%2Bjson%2C*%2F*%3Bq%3D0.9",
        //outputFormat:"table"
        outputFormat: "rawResponse",
      };
      let route = stringify(paramData);
      let acutalUrl = basepath + route;

      window.open(acutalUrl, "_blank");
    },
    showSparqlNb() {
      // need to add all the parameters as query parameters
      let basepath = this.FacetsConfig.SPARQL_NB;
      // need to add
      //window.open("https://graph.geodex.org/blazegraph/#query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0APREFIX%20bds%3A%20%3Chttp%3A%2F%2Fwww.bigdata.com%2Frdf%2Fsearch%23%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20%20%20%3Fdatep%20%20%20%3Fscore%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%20%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Asearch%20%22" +this.q+ "%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3AmatchAllTerms%20%22false%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Arelevance%20%3Fscore%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20%3Fp%20%3Flit%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%20%20%20%20%20%20%20%20%20%20%20%20filter(%20%3Fscore%20%3E%200.04).%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(%20!%20isBlank(%3Fsubj)%20)%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22no%3AdatePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22no%3Apublisher.name%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22no%3AspatialCoverage.name%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fdatep%20%3Fpubname%20%3Fname%20%3Fdescription%20%3Fscore%20%3FresourceType%20%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)&endpoint=https%3A%2F%2Fgraph.geodex.org%2Fblazegraph%2Fnamespace%2Fnabu%2Fsparql&requestMethod=POST&tabTitle=Query&headers=%7B%7D&contentTypeConstruct=application%2Fn-triples%2C*%2F*%3Bq%3D0.9&contentTypeSelect=application%2Fsparql-results%2Bjson%2C*%2F*%3Bq%3D0.9&outputFormat=table")
      // this needs to be unencoded and split. hell just import the actual query template.
      //let query= "PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aprefix%20schema%3A%20%3Chttp%3A%2F%2Fschema.org%2F%3E%0Aprefix%20sschema%3A%20%3Chttps%3A%2F%2Fschema.org%2F%3E%0APREFIX%20bds%3A%20%3Chttp%3A%2F%2Fwww.bigdata.com%2Frdf%2Fsearch%23%3E%0ASELECT%20distinct%20%3Fsubj%20%3Fpubname%20%20%20%3Fdatep%20%20%20%3Fscore%20%20%3Fname%20%3Fdescription%20%3FresourceType%20%20%0A%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Asearch%20%22" +this.q+ "%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3AmatchAllTerms%20%22false%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Flit%20bds%3Arelevance%20%3Fscore%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20%3Fp%20%3Flit%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(IF%20(exists%20%7B%3Fsubj%20a%20schema%3ADataset%20.%7D%20%7C%7Cexists%7B%3Fsubj%20a%20sschema%3ADataset%20.%7D%20%2C%20%22data%22%2C%20%22tool%22)%20AS%20%3FresourceType).%0A%20%20%20%20%20%20%20%20%20%20%20%20filter(%20%3Fscore%20%3E%200.04).%0A%20%20%20%20%20%20%20%20%20%20%20%20FILTER%20(%20!%20isBlank(%3Fsubj)%20)%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Aname%7Csschema%3Aname%20%3Fname%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Fsubj%20schema%3Adescription%7Csschema%3Adescription%20%3Fdescription%20.%20%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3AdatePublished%7Csschema%3AdatePublished%20%3Fdate_p%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Fsubj%20schema%3Apublisher%2Fschema%3Aname%7Csschema%3Apublisher%2Fsschema%3Aname%20%3Fpub_name%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fdate_p)%2C%20%3Fdate_p%2C%20%22no%3AdatePublished%22)%20as%20%3Fdatep%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fpub_name)%2C%20%3Fpub_name%2C%20%22no%3Apublisher.name%22)%20as%20%3Fpubname%20)%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20BIND%20(%20IF%20(%20BOUND(%3Fplace_name)%2C%20%3Fplace_name%2C%20%22no%3AspatialCoverage.name%22)%20as%20%3Fplacename%20)%20.%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20GROUP%20BY%20%3Fsubj%20%3Fdatep%20%3Fpubname%20%3Fname%20%3Fdescription%20%3Fscore%20%3FresourceType%20%0A%20%20%20%20%20%20%20%20ORDER%20BY%20DESC(%3Fscore)"
      let filterText = this.q ? this.q : "Ridgecrest";
      let urltemplate = _.template(basepath, this.esTemplateOptions);

      let nbProxy = urltemplate({ q: filterText });

      window.open(nbProxy, "_blank");
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.navbar {
  //make flat color
  &.bg-primary {
    background: {
      color: #0c3c60 !important;
      image: none;
    }
  }
  .logo {
    max-width: 50px;     /* Maximum width */
    max-height: 30px;    /* Maximum height */
    width: auto;          /* Maintain aspect ratio */
    height: auto;         /* Maintain aspect ratio */
    display: block;       /* Block display for layout control */
  }

  .btn-secondary,
  .btn-secondary:hover {
    background: {
      image: none;
    }
  }
  .match-checkbox {
    display: flex;
    justify-content: left;
    text-align: right;
    color: white;
    width: 4em;
    border-width: 2px;
    background: #005cbf;
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
