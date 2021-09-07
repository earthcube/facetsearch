<template>
<!--  <div class="buttons mt-3">-->
<!--    <b-button variant="outline-primary" v-on:click.stop="showMap">Records Map</b-button>-->
<!--  </div>-->
<!--    <b-card variant="secondary" v-show="hasSpatial">-->
<!--      <b-card-title>Location</b-card-title>-->


      <div ref="myRecordsMap" id="myRecordsMap" style="width: 100%; height: 600px;" > </div>

</template>

<script>
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

import {mapState} from "vuex";

import { Icon } from 'leaflet';
// import { latLng } from "leaflet";
// import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from "vue2-leaflet";


delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
  name: 'myRecordsMap',
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
      mapboxurl: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
      attribution: `Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`,
      center: [46.8832566, -114.0870563],
      zoom: 8,
      maxZoom: 12,
      mapOptions: {
        zoomSnap: 0.5
      },
      myRecordsMap:{}

    }
  },
  mounted() {
    this.hasSpatial = false;
    this.toMap()
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
      var self = this;

      var maxlat = 63.35
      var maxlon = 9.55
      var minlat = 63.35
      var minlon = 9.55
      var box = [[maxlat, maxlon],
                 [minlat, minlon]]

      this.center = [(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2]; // original centerpoint hell, montanta
      this.$nextTick(() => {
        this.myRecordsMap = L.map(this.$refs.myRecordsMap.id, {fullscreenControl: true,
          fullscreenControlOptions: {
            position: 'topleft'
          }}).setView(this.center, 8);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
          maxZoom: 13,
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
              'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: 'mapbox/streets-v11',
          tileSize: 512,
          zoomOffset: -1
        }).addTo(this.myRecordsMap);
        //box
        /*
          maxlat, maxlon
          minlat, minlon
         */
        L.marker(self.center).addTo(this.myRecordsMap);

        let bounds = L.latLngBounds(box[0], box[1]);
        console.log('bounds valid ' + bounds.isValid())
        // not always correct order.
        let padding = Math.abs(box[0][0] - box[0][1])/2
        this.myRecordsMap.fitBounds(bounds, {padding: [padding,padding], maxZoom: 12});
        L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(this.myRecordsMap);

          setTimeout(() => {
            this.myRecordsMap.panTo(self.center);
            this.myRecordsMap.invalidateSize()
          }, 100)
      })
    },
  }

};
</script>

<style scoped>

</style>