<template>
  <b-card v-show="hasSpatial" variant="secondary">
    <b-card-title>Location</b-card-title>

    <div id="myMap" ref="myMap" style="width: 100%; height: 320px"></div>
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

      frameJsonLD(obj, "Dataset").then((obj) => {
        let name = schemaItem("name", obj);
        let s_spatialCoverage = schemaItem("spatialCoverage", obj);

        if (
          s_spatialCoverage &&
          typeof s_spatialCoverage === 'object' &&
          s_spatialCoverage.geo
        ) {
          this.hasSpatial = true;

          let placename = geoplacename(s_spatialCoverage);
          let box = getFirstGeoShape(s_spatialCoverage, "box");
          let poly = getFirstGeoShape(s_spatialCoverage, "polygon");
          let line = getFirstGeoShape(s_spatialCoverage, "line");
          let points = getGeoCoordinates(s_spatialCoverage);

          self.center = [46.8832566, -114.0870563]; // original centerpoint hell, montanta
          if (!(box || points || poly || line)) {
            return;
          }

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
