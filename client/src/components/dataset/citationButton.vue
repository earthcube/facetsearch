<template>
  <div v-show="hasCitation">
    <b-button v-b-toggle.collapse-cite variant="outline-secondary">
      <!--      <b-icon icon="chat-square-quote" class="mr-1"></b-icon>-->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-chat-square-quote"
        viewBox="0 0 16 16"
      >
        <path
          d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"
        />
        <path
          d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z"
        />
      </svg>
      Cite
    </b-button>

    <b-collapse id="collapse-cite" class="mt-2">
      <b-card>
        <!-- TODO remove inline style attributes -->
        <div class="text-left" :show-line="true" :deep="2" v-html="citation" />
      </b-card>
    </b-collapse>

    <!--                        <b-button v-b-modal.feedback-modal variant="outline-secondary" @click="showModal">Feedback</b-button>-->
    <!--                        <feedback v-show="isFeedbackVisible" @close="closeModal" subject = 'dataset' :name="mapping.name" :urn="d"> </feedback>-->

    <!--                        <b-button v-b-toggle.collapse_json variant="outline-secondary">Feedback</b-button>-->
    <!--                        <div id="app">-->
  </div>
</template>

<script>
import { mapState } from "vuex";
import _ from "lodash";
import axios from "axios";
import { frameJsonLD, schemaItem } from "@/api/jsonldObject";

export default {
  name: "CitationButton",
  data() {
    return {
      citation: "",
      hasCitation: false,
    };
  },
  watch: {
    jsonLdObj: "toCitation",
  },
  computed: {
    ...mapState(["jsonLdObj", "jsonLdCompact"]),
  },
  methods: {
    async getDoiService(doi) {
      // is DOI a url, or just a DOI?
      // if not a url... make is a doi url
      // `http://doi.org/${doi}
      if (_.isString(doi)) {
        if (doi === "") Promise.reject("cannot call doi service empty");
        var url = doi;
        if (url.indexOf("http") < 0) {
          url = `http://doi.org/${doi}`;
        }
        const config = {
          url: url,
          method: "get",
          headers: {
            Accept:
              "text/x-bibliography, application/vnd.citationstyles.csl+json, application/rdf+xml",
          },
        };
        return axios
          .request(config)
          .then(function (response) {
            // will need chech... will not always return an text/x-bibliography
            return response.data;
          })
          .catch((err) => console.log(err));
      } else {
        Promise.reject("cannot call doi service not a string");
      }
    },

    async toCitation() {
      var self = this;
      var jp = this.jsonLdObj;
      let doiPropertyValues = [
        "https://registry.identifiers.org/registry/doi",
        "https://registry.identifiers.org/registry/doi",
        "DOI",
        "http://purl.org/spar/datacite/doi",
      ];
      //var jo = this.jsonLdObj; // good case for jsonpath

      // get DOI logic

      // citation... is there a citation. Is the citation a URL, is url a DOI.
      // if has a citation, and is not DOI, then return that.
      // if is a DOI, the use that.
      // not a citation, is there a DOI somewhere
      // present use cases
      //https://docs.google.com/spreadsheets/d/1joF6Gat6Wch3ZvIlvbuIXHFazk4AnVuSceho8Mxn-eg/edit#gid=0
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
      frameJsonLD(jp, "Dataset").then((jp) => {
        var s_citation = schemaItem("citation", jp);
        // check if there is citation string.
        if (
          !s_citation.startsWith("http") &&
          s_citation.indexOf("doi.org") < 0 &&
          s_citation !== ""
        ) {
          this.citation = s_citation;
          this.hasCitation = true;
        } else if (s_citation) {
          self
            .getDoiService(s_citation)
            .then((data) => {
              this.citation = data;
              this.hasCitation = true;
            })
            .catch((err) => console.log(err));
        }

        // ok, is there an identifier that is a DOI.
        var ident = schemaItem("identifier", jp); //self.getDOIUrl()
        // console.log('ident: ' + ident)
        if (_.isString(ident)) {
          if (ident.indexOf("doi") >= 0) {
            self
              .getDoiService(ident)
              .then((data) => {
                this.citation = data;
                this.hasCitation = true;
              })
              .catch((err) => console.log(err));
          }
        } else if (Array.isArray(ident)) {
          var doi = _.find(ident, (i) =>
            _.includes(doiPropertyValues, i["https://schema.org/propertyID"])
          );
          if (doi !== undefined) {
            var doi_url = doi["https://schema.org/url"];
            self
              .getDoiService(doi_url)
              .then((data) => {
                this.citation = data;
                this.hasCitation = true;
              })
              .catch((err) => console.log(err));
          }
        }
        var propertyType = schemaItem("propertyID", ident);
        if (propertyType !== undefined && propertyType === "DOI") {
          let value = schemaItem("value", ident);
          self
            .getDoiService(value)
            .then((data) => {
              this.citation = data;
              this.hasCitation = true;
            })
            .catch((err) => console.log(err));
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
      });
    },
  },
};
</script>

<style scoped></style>
