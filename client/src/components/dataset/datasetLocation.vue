<template>
    <div style="width: 100%; height: 320px;">
        <div ref="myMap" id="myMap" style="width: 100%; height: 320px;" v-show="hasSpatial"></div>

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
    </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import {
 // LMap,
  //LTileLayer,
  // LMarker,
} from 'vue2-leaflet';
import {mapState} from "vuex";
import {schemaItem, getGeoCoordinates, geoplacename, getFirstGeoShape} from '../../api/jsonldObject'
import { Icon } from 'leaflet';

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
export default {
  name: 'datasetLocation',
  components: {
   // LMap,
    //   LTileLayer,
//    LMarker,

  }, watch: {
    jsonLdCompact: 'toMap'
  },
  props: {},
  data() {
    return {
      hasSpatial: false,
      mapboxurl: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
      attribution: `Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`,
      center: [46.8832566, -114.0870563],
      zoom: 8,
      maxZoom: 6,
      myMap:{}

    }
  },
  mounted() {
    this.hasSpatial = false;
    this.$nextTick(() => {
      //this.$refs.myMap.mapObject.setView(this.center, 13);
      this.mymap = L.map(this.$refs.myMap.id).setView(this.center, 13);
      L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 8,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
      }).addTo(this.mymap);
    });
  },
  computed: {
    ...mapState(['jsonLdObj', 'jsonLdCompact'])

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
      var obj = this.jsonLdCompact
      var self = this;
      this.$nextTick(() => {
            let name = schemaItem('name', obj);
            let s_spatialCoverage = schemaItem('spatialCoverage', obj)
        if (s_spatialCoverage) {
           this.hasSpatial = true

            let placename = geoplacename(s_spatialCoverage)
            let box = getFirstGeoShape(s_spatialCoverage, 'box')
            let poly = getFirstGeoShape(s_spatialCoverage, 'polygon')
            let points = getGeoCoordinates(s_spatialCoverage)
            console.info(`placename:${placename} box:${box} poly:${poly} points:${points}`)
            //this.s_identifier_doi= ""

            // let detail = {
            //   name: this.s_name,
            //   points: points,
            //   poly: poly,
            //   box: box,
            //   placename: placename
            // }

            // this.$refs.myMap.mapObject.ANY_LEAFLET_MAP_METHOD();
            self.center = [46.8832566, -114.0870563]; // original centerpoint hell, montanta
            if (!(box || points || poly)) {
              return;
            }
            if (points && points.length > 0) {

              self.center = points[0] // first one
              console.log(`firstpoint ${self.center}`)
            } else if (box) {
              // calc centerpoint of box
              //var points = e.detail.box.split(" ")

              var northing = (box[0][0] + box[1][0]) / 2
              var easting = (box[0][1] + box[1][1]) / 2
              console.log(`box ${northing} ${easting}`)
              self.center = [northing, easting]
            } else {
              // do polygon here
            }

        this.mymap.setView(self.center, 10);

            if (points && points.length > 1) {

              for (var p = 1; p < points.length; p++) {
                L.marker(points[p]).addTo(this.mymap);
              }
            }
            if (poly) {
              L.polygon(poly).addTo(this.mymap);
              //     L.polygon(e.detail.poly).addTo(mymap)
            }

            if (box) {
              L.rectangle(box).addTo(this.mymap);
              //      L.rectangle(e.detail.box).addTo(mymap)
            }
            // reactive... set
            // var mymap = L.map('mapid').setView(centerpoint, 13);
            if (name) {
              L.marker(self.center).addTo(this.mymap)
                  .bindPopup(name).openPopup();
            } else {
              L.marker(self.center).addTo(this.mymap);
            }

          }
          }
      )
    }
  }

};


</script>

<style scoped>

</style>
