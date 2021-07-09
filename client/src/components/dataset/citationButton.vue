<template>
  <div :visible="hasCitation">
  <b-button v-b-toggle.collapse-cite variant="outline-secondary">
    <b-icon icon="chat-square-quote" class="mr-1"></b-icon>Cite</b-button>



  <b-collapse id="collapse-cite" class="mt-2">
    <b-card>
      <!-- TODO remove inline style attributes -->
      <div class="text-left " :show-line="true" :deep="2" v-html="citation"/>
    </b-card>
  </b-collapse>

  <!--                        <b-button v-b-modal.feedback-modal variant="outline-secondary" @click="showModal">Feedback</b-button>-->
  <!--                        <feedback v-show="isFeedbackVisible" @close="closeModal" subject = 'dataset' :name="mapping.name" :urn="d"> </feedback>-->



  <!--                        <b-button v-b-toggle.collapse_json variant="outline-secondary">Feedback</b-button>-->
  <!--                        <div id="app">-->
  </div>

</template>

<script>
import {mapState} from "vuex";
import _ from "lodash";
import axios from "axios";
import {schemaItem} from "@/api/jsonldObject";

export default {
  name: "citationButton",
  data() {
    return {
      citation:"",
      hasCitation: false
    }
  },
  watch: {
    jsonLdCompact: "toCitation",
  },
  computed: { ...mapState (['jsonLdObj', 'jsonLdCompact'])

  },
  methods:{
     async getDoiService(doi ){

      // is DOI a url, or just a DOI?
      // if not a url... make is a doi url
      // `http://doi.org/${doi}
      if (_.isString(doi)){
        if (doi === '') Promise.reject('cannot call doi service empty')
        var url = doi
        if (url.indexOf('http')<0) {
          url = `http://doi.org/${doi}`
        }
        const config = {
          url: url,
          method: 'get',
          headers: {
            'Accept': 'text/x-bibliography, application/vnd.citationstyles.csl+json, application/rdf+xml'
          },
        }
         return axios.request(config).then(function (response) {
           // will need chech... will not always return an text/x-bibliography
          return response.data
        }).catch((err)=> console.log(err))
      } else {
        Promise.reject('cannot call doi service not a string')
      }

    },

    async toCitation(){
      var self = this;
      var jp = this.jsonLdCompact;
      //var jo = this.jsonLdObj; // good case for jsonpath


        // get DOI logic
        // citation... is there a citation. Is the citation a URL, is url a DOI.
        // if has a citation, and is not DOI, then return that.
        // if is a DOI, the use that.
        // not a citation, is there a DOI somewhere
        // look in identifier for a property 'DOI'
        // "https://schema.org/identifier":
        // {
        //   "@id":
        //   "doi:10.1594/IEDA/111473" ,
        //       "@type":
        //   "https://schema.org/PropertyValue" ,
        //       "https://schema.org/additionalType":
        //   [
        //     "http://schema.geolink.org/1.0/base/main#Identifier" ,
        //     "http://purl.org/spar/datacite/Identifier"
        //   ] ,
        //       "https://schema.org/propertyID":
        //   "http://purl.org/spar/datacite/doi" ,
        //       "https://schema.org/url":
        //   "http://dx.doi.org/10.1594/IEDA/111473" ,
        //       "https://schema.org/value":
        //   "10.1594/IEDA/111473"
        // } ,

        // being real method

        var s_citation = schemaItem('citation', jp);
        if (s_citation.indexOf('doi')<0 && s_citation !== "") {
          this.citation=  s_citation
        } else if (s_citation) {
          self.getDoiService(s_citation).then((data) => this.citation=data)
        }
        // ok, is there an identifier that is a DOI.
        var ident = schemaItem('identifier', jp);//self.getDOIUrl()
        if (_.isString(ident) ){
          if (ident.indexOf('doi') >=0){
            self.getDoiService(ident).then((data) => this.citation=data)
          }
        }
        var propertyType = schemaItem('propertyID', ident)
        if (propertyType !== undefined && propertyType === 'DOI') {
          let value = schemaItem('value', ident)
          self.getDoiService(value).then((data) => this.citation=data)
        }
        // if (ident) {
        //   if (Array.isArray(ident)) {
        //     ident.forEach(function (item) {
        //       if (item["@id"]) {
        //         mapping.s_doiurl = item["@id"]
        //       }
        //     })
        //     // need check is it is a DOI, DOI url,
        //     if (mapping.s_doiurl) {
        //       const config = {
        //         url: mapping.s_doiurl,
        //         method: 'get',
        //         headers: {
        //           'Accept': 'text/x-bibliography'
        //         },
        //       }
        //       axios.request(config).then(function (response) {
        //         mapping.doi_citation = response.data
        //       }).catch((err)=> console.log(err))
        //     }
        //   } else if (_.isString(ident) ) {
        //     // need check is it is a DOI.
        //     const config = {
        //       url: ident,
        //       method: 'get',
        //       headers: {
        //         'Accept': 'text/x-bibliography'
        //       },
        //     }
        //     axios.request(config).then(function (response) {
        //       mapping.doi_citation = response.data
        //     }).catch((err)=> console.log(err))
        //   }
        // }

      }
    }
  }

</script>

<style scoped>

</style>
