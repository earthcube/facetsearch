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

import {mapActions, mapState} from "vuex";

import { Icon } from 'leaflet';
import FacetsConfig from "../../config";
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
    results: 'toMap'
  },
  props: {  textQuery: String, // this needs to be here route passes as a prop
    resourceType: String},
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
      myRecordsMap:{},
      o: 0,
      n: FacetsConfig.LIMIT_DEFAULT,
      searchExactMatch: true
    }
  },
  mounted() {
    const o = 0;
    this.queryRunning = true;
    this.$store.state.q = this.textQuery
    let lastItems = this.$store.getters.getLastQueryResults(this.textQuery)
    if (lastItems){
      this.$store.commit('setResults',lastItems)
      //this.queryRunning = false;
      this.search()
    } else {
      this.$store.dispatch('getResults', {
            textQuery: this.textQuery,
            limit: this.n,
            offset: o,
            searchExactMatch: this.searchExactMatch,
            resourceType: this.resourceType
          }
      )
    }
  //  this.hasSpatial = false;
    //this.toMap()
  },
  computed: {
    ...mapState(['results'])

  },
  methods: {
    ...mapActions([
      'getResults', 'getQueryTemplate']),
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
      console.log(this.results.length)

      if (this.results.length <= 0) return

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

        var my_draw_boxes = []
        var my_draw_points = []
        for (const item of this.results) {
          if ('bbox' in item) {
            var tempboxes = item['bbox'].replaceAll(", ", ",").split(" ")
            var tempbox1 = tempboxes[0].split(",")
            var tempbox2 = tempboxes[1].split(",")
            my_draw_boxes.push([[tempbox1[0], tempbox1[1]], [tempbox2[0], tempbox2[1]]])
            // my_draw_boxes.push(item['bbox'])
          } else {
            if('maxlon' in item && 'minlon' in item && 'maxlat' in item && 'maxlon' in item) {
              if (item['maxlat'] === item['minlat'] && item['maxlon'] === item['minlon']) {
                my_draw_points.push([item['maxlat'], item['maxlon']])
              } else {
                my_draw_boxes.push([[item['maxlat'], item['maxlon']], [item['minlat'], item['minlon']]])
              }
            }
          }
        }
        var maxlat = 0.0
        var maxlon = 0.0
        var minlat = 0.0
        var minlon = 0.0
        var box = [[maxlat, maxlon],
          [minlat, minlon]]

        for (let i = 0; i < my_draw_points.length; i++) {
          maxlat += my_draw_points[i][0]
          maxlon += my_draw_points[i][1]
          minlat += my_draw_points[i][0]
          minlon += my_draw_points[i][1]
          L.marker(my_draw_points[i]).addTo(this.myRecordsMap);
        }

        for (let i = 0; i < my_draw_boxes.length; i++) {
          box = my_draw_boxes[i]
          maxlat += box[0][0]
          maxlon += box[0][1]
          minlat += box[1][0]
          minlon += box[1][1]

          var corner1 = L.latLng(box[0][0], box[0][1]),
              corner2 = L.latLng(box[1][0], box[1][1]),
              bounds = L.latLngBounds(corner1, corner2);
          console.log('bounds valid ' + bounds.isValid())
          // not always correct order.
          let padding = Math.abs(box[0][0] - box[0][1])/2
          this.myRecordsMap.fitBounds(bounds, {padding: [padding,padding], maxZoom: 12});
          L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(this.myRecordsMap);
          //      L.rectangle(e.detail.box).addTo(mymap)
        }

        maxlat = maxlat/my_draw_boxes.length
        maxlon = maxlon/my_draw_boxes.length
        minlat = minlat/my_draw_boxes.length
        minlon = minlon/my_draw_boxes.length
        box = [[maxlat, maxlon],
          [minlat, minlon]]
        //box
        /*
          maxlat, maxlon
          minlat, minlon
         */
        var northing = (box[0][0] + box[1][0]) / 2
        var easting = (box[0][1] + box[1][1]) / 2
        self.center = [northing, easting]
        L.marker(self.center).addTo(this.myRecordsMap);


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
