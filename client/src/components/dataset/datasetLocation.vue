<template>
  <b-card v-show="hasSpatial" variant="secondary">
    <b-card-title>Location</b-card-title>

    <div id="myMap" ref="myMap" style="width: 100%; height: 320px"></div>

    <!--      <l-map ref="myMap" id="myMap" :zoom="zoom"-->
    <!--             :center="center"-->
    <!--             style="height: 400px; width:400px"-->
    <!--      >-->
    <!--        &lt;!&ndash;          <l-tile-layer&ndash;&gt;-->
    <!--        &lt;!&ndash;              :url="mapboxurl"&ndash;&gt;-->
    <!--        &lt;!&ndash;              :attribution="attribution"&ndash;&gt;-->

    <!--        &lt;!&ndash;          />&ndash;&gt;-->
    <!--        &lt;!&ndash;          <l-marker :lat-lng="withTooltip">&ndash;&gt;-->
    <!--        &lt;!&ndash;            <l-tooltip :options="{ permanent: true, interactive: true }">&ndash;&gt;-->
    <!--        &lt;!&ndash;              <div @click="innerClick">&ndash;&gt;-->
    <!--        &lt;!&ndash;                I am a tooltip&ndash;&gt;-->
    <!--        &lt;!&ndash;                <p v-show="showParagraph">&ndash;&gt;-->
    <!--        &lt;!&ndash;                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque&ndash;&gt;-->
    <!--        &lt;!&ndash;                  sed pretium nisl, ut sagittis sapien. Sed vel sollicitudin nisi.&ndash;&gt;-->
    <!--        &lt;!&ndash;                  Donec finibus semper metus id malesuada.&ndash;&gt;-->
    <!--        &lt;!&ndash;                </p>&ndash;&gt;-->
    <!--        &lt;!&ndash;              </div>&ndash;&gt;-->
    <!--        &lt;!&ndash;            </l-tooltip>&ndash;&gt;-->
    <!--        &lt;!&ndash;          </l-marker>&ndash;&gt;-->

    <!--      </l-map>-->
  </b-card>
</template>

<script>
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  LMap,
  LIcon,
  LTileLayer,
  LMarker,
  LControlLayers,
  LTooltip,
  LPopup,
  LPolyline,
  LPolygon,
  LRectangle,
} from "@vue-leaflet/vue-leaflet";
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url'
import iconUrl from 'leaflet/dist/images/marker-icon.png?url'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url'
import { mapState } from "vuex";
import {
  schemaItem,
  getGeoCoordinates,
  geoplacename,
  getFirstGeoShape,
  frameJsonLD,
} from "@/api/jsonldObject";
import { Icon } from "leaflet";
//import jsonld from "jsonld";

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl, //'leaflet/dist/images/marker-icon-2x.png',// iconRetinaUrl ,// require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: iconUrl, //'leaflet/dist/images/marker-icon-2x.png', // require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: shadowUrl //'leaflet/dist/images/marker-icon-2x.png', // require('leaflet/dist/images/marker-shadow.png'),
});
export default {
  name: "DatasetLocation",
  components: {
    LMap,
    LIcon,
    LTileLayer,
    LMarker,
    LControlLayers,
    LTooltip,
    LPopup,
    LPolyline,
    LPolygon,
    LRectangle,
  },
  props: { m: Object },
  data() {
    return {
      hasSpatial: false,
      mapboxurl: "",
      attribution: `Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`,
      center: [46.8832566, -114.0870563],
      zoom: 8,
      maxZoom: 12,
      myMap: {},
    };
  },
  watch: {
    jsonLdCompact: "toMap",
  },
  mounted() {
    this.hasSpatial = false;
    this.mapboxurl = `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${this.FacetsConfig.MAPBOX_API_KEY}`;
    // this.$nextTick(() => {
    //   //this.$refs.myMap.mapObject.setView(this.center, 13);
    //   this.mymap = L.map(this.$refs.myMap.id).setView(this.center, 13);
    //   L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    //     maxZoom: 12,
    //     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
    //         'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    //     id: 'mapbox/streets-v11',
    //     tileSize: 512,
    //     zoomOffset: -1
    //   }).addTo(this.mymap);
    //
    // });
  },
  computed: {
    ...mapState(["jsonLdObj", "jsonLdCompact", "FacetsConfig"]),
  },
  methods: {
    zoomUpdated(zoom) {
      this.zoom = zoom;
    },
    centerUpdated(center) {
      this.center = center;
    },
    boundsUpdated(bounds) {
      this.bounds = bounds;
    },
    toMap: function () {
      var obj = this.jsonLdObj;
      var self = this;
      // move all the caluations out of nextTick
      //       let datasetFrame = JSON.parse(`
      // {
      //   "@context": {
      //     "@vocab": "https://schema.org/",
      //         "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      //         "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      //         "schema": "https://schema.org/",
      //         "xsd": "http://www.w3.org/2001/XMLSchema#"
      //   },
      //   "@type": "schema:Dataset"
      // }`)
      //       jsonld.frame(obj, datasetFrame).then(
      frameJsonLD(obj, "Dataset").then((obj) => {
        let name = schemaItem("name", obj);
        let s_spatialCoverage = schemaItem("spatialCoverage", obj);
        if (s_spatialCoverage) {
          this.hasSpatial = true;

          let placename = geoplacename(s_spatialCoverage);
          let box = getFirstGeoShape(s_spatialCoverage, "box");
          let poly = getFirstGeoShape(s_spatialCoverage, "polygon");
          let line = getFirstGeoShape(s_spatialCoverage, "line");
          let points = getGeoCoordinates(s_spatialCoverage);
          console.info(
            `placename:${placename} box:${box} poly:${poly} line:${line} points:${points}`
          );
          //this.s_identifier_doi= ""

          // let detail = {
          //   name: this.name,
          //   points: points,
          //   poly: poly,
          //   box: box,
          //   placename: placename
          // }

          // this.$refs.myMap.mapObject.ANY_LEAFLET_MAP_METHOD();
          self.center = [46.8832566, -114.0870563]; // original centerpoint hell, montanta
          if (!(box || points || poly || line)) {
            return;
          }
          // this needs to be cleaned up, and probably set a
          // standard geomentry objects and simplify the adding
          // of the objects to leaflet.
          // if (points && points.length > 0) {
          //
          //   self.center = points[0] // first one
          //   console.log(`firstpoint will be center ${self.center}`)
          // } else if (box) {
          //   // calc centerpoint of box
          //   //var points = e.detail.box.split(" ")
          //
          //   var northing = (box[0][0] + box[1][0]) / 2
          //   var easting = (box[0][1] + box[1][1]) / 2
          //   console.log(`box center: ${northing} ${easting}`)
          //   self.center = [northing, easting]
          // } else if (line) {
          //   self.center(L.polyline(line).getCenter())
          //   // do polygon here
          // } else if (poly){
          //   self.center(L.polygon(poly).getCenter())
          // } else {
          //   // can do anything, so let's turn off
          //   console.log("unrecognized spatial object. Disabling location")
          //   this.hasSpatial = false
          // }

          // move all the caluations out of nextTick
          this.$nextTick(() => {
            //this.$refs.myMap.mapObject.setView(this.center, 13);
            this.mymap = L.map(self.$refs.myMap.id).setView(self.center, 8);
            let mb_url = self.mapboxurl;
            L.tileLayer(mb_url, {
              maxZoom: 13,
              attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
              id: "mapbox/streets-v11",
              tileSize: 512,
              zoomOffset: -1,
            }).addTo(self.mymap);
            // reactive... set
            // var mymap = L.map('mapid').setView(centerpoint, 13);

            if (points && points.length > 0) {
              self.center = points[0]; // first one
              // console.log(`first point will be center ${self.center}`);
              for (var p = 0; p < points.length; p++) {
                L.marker(points[p]).addTo(self.mymap);
              }
            }

            if (poly) {
              const newgeo = L.polygon(poly).addTo(self.mymap);
              self.center = newgeo.getCenter();
            }

            if (line) {
              const newgeo = L.polyline(line).addTo(self.mymap);
              self.center = newgeo.getCenter();
            }

            if (box) {
              let bounds = L.latLngBounds(box[0], box[1]);
              console.log("bounds valid " + bounds.isValid());
              // not always correct order.
              let padding = Math.abs(box[0][0] - box[0][1]) / 2;
              this.mymap.fitBounds(bounds, {
                padding: [padding, padding],
                maxZoom: 12,
              });
              const newgeo = L.rectangle(bounds, {
                color: "#ff7800",
                weight: 1,
              }).addTo(this.mymap);
              self.center = newgeo.getCenter();
            }

            // If none of the objects exist, disable spatial features
            if (!points && !poly && !line && !box) {
              console.log("unrecognized spatial object. Disabling location");
              this.hasSpatial = false;
            }

            if (name) {
              L.marker(self.center)
                .addTo(self.mymap)
                .bindPopup(name)
                .openPopup();
            } else {
              L.marker(self.center).addTo(self.mymap);
            }
            // v-show... causing issues, solution https://stackoverflow.com/questions/36246815/data-toggle-tab-does-not-download-leaflet-map/36257493#36257493
            setTimeout(() => {
              this.mymap.panTo(self.center);
              this.mymap.invalidateSize();
            }, 100);
          });
        }
      });
    },
  },
};
</script>

<style scoped>

</style>
