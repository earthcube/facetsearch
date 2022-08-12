<template>
  <b-container>
    <b-row class="title_row">
    <b-col md="12">
      <b-btn variant="outline-primary" v-on:click="$router.back()"><b-icon icon="arrow-left" /></b-btn>
    </b-col>
   </b-row>
   <div ref="sparqlyasgui" />
  </b-container>
</template>

<script>
import Yasgui from "@triply/yasgui";
import "@triply/yasgui/build/yasgui.min.css";

export default {
  name: "sparqlgui",
  data(){
    return {
      yasgui: {}
    }
  },
  async mounted( ){
    let s = this.$refs.sparqlyasgui

    this.yasgui = new Yasgui(s,
        {
          tabName: "EC Query",
          requestConfig: {endpoint: "https://graph.geodex.org/blazegraph/namespace/earthcube/sparql"},
          // Allow resizing of the Yasqe editor
          resizeable: true,

          // Whether to autofocus on Yasqe on page load
          autofocus: true,

          copyEndpointOnNewTab: true,
          endpointCatalogueOptions: {
            getData: () => {
              return [
                //List of objects should contain the endpoint field
                //Feel free to include any other fields (e.g. a description or icon
                //that you'd like to use when rendering)
                {
                  endpoint: "https://graph.geodex.org/blazegraph/namespace/earthcube/sparql"
                },
                {
                  endpoint: "https://graph.geocodes.earthcube.org/blazegraph/namespace/earthcube/sparql"
                },
                {
                  endpoint: "https://graph.geocodes-dev.earthcube.org/blazegraph/namespace/earthcube/sparql"
                }
                // ...
              ];
            },
            keys: [],
            renderItem: (data, source) => {
              const contentDiv = document.createElement("div");

              contentDiv.style.display = "flex";
              contentDiv.style.flexDirection = "column";
              const endpointSpan = document.createElement("span");
              endpointSpan.innerHTML =
                  data.matches.endpoint?.reduce(
                      (current, object) => (object.highlight ? current + object.text.bold() : current + object.text),
                      ""
                  ) || "";
              contentDiv.appendChild(endpointSpan);
              source.appendChild(contentDiv);
            },
          }
        }
        ) ;
  }

}
</script>

<style scoped>

</style>


