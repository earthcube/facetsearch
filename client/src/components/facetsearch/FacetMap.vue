<template>
  <div class="filter_card">
    <b-button block squared v-b-toggle="'accordion_range_'+ facetSetting.field">
      {{ facetSetting.title }}
      <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true"></b-icon>
      <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"></b-icon>
    </b-button>


    <b-collapse
        :id="'accordion_range_'+ facetSetting.field"
        :visible="facetSetting.open"
    >
      <b-card variant="secondary" v-show="hasSpatial">
        <div ref="myMap" id="myMap" style="width: 100%; height: 320px;" ></div>
      </b-card>
    </b-collapse>

    <label>North:</label>
    <vue-numeric-input v-bind:precision="6" v-model="north"></vue-numeric-input>
    <label>South:</label>
    <vue-numeric-input v-bind:precision="6" v-model="south"></vue-numeric-input>
    <label>West:</label>
    <vue-numeric-input v-bind:precision="6" v-model="west"></vue-numeric-input>
    <label>East:</label>
    <vue-numeric-input v-bind:precision="6" v-model="east"></vue-numeric-input>

    <b-input-group size="sm">
      <b-button v-on:click="filterBB"> Filter Bounding Box</b-button>
    </b-input-group>

  </div>


</template>

<script>
import VueNumericInput from 'vue-numeric-input';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import {
  // LMap,
  //LTileLayer,
  // LMarker,
} from 'vue2-leaflet';
import {mapState} from "vuex";
// import {schemaItem, getGeoCoordinates, geoplacename, getFirstGeoShape} from '../../api/jsonldObject'
import { Icon } from 'leaflet';

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
export default {
  name: 'FacetMap',
  components: {
    VueNumericInput,
    // LMap,
    //   LTileLayer,
//    LMarker,

  }, watch: {
    results: 'toMap',
    north: 'toMap',
    south: 'toMap',
    east: 'toMap',
    west: 'toMap'
  },
  props: {
    "facetSetting": Object,
    "facetStore": Object,
    "state": Object,
  },
  data() {
    return {
      hasSpatial: false,
      mapboxurl: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
      attribution: `Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`,
      center: [46.8832566, -114.0870563],
      zoom: 8,
      maxZoom: 12,
      north: '20.123456',
      south: '20.123456',
      west: '20.123456',
      east: '20.123456',
      prev_bounding_box: undefined,
      prev_marker: undefined,
    }
  },
  mounted() {
    this.hasSpatial = true;
  },
  computed: {
    ...mapState(['results', 'north', 'south', 'west', 'east'])
  },
  methods: {
    filterBB: function () {
      console.log("filter in bounding box")
      // this.toMap()
    },
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
      this.$nextTick(() => {

        //this.$refs.myMap.mapObject.setView(this.center, 13);
        if(this.mymap === undefined) {
          this.mymap = L.map(this.$refs.myMap.id).setView(this.center, 8);
        }
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
          maxZoom: 13,
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
              'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: 'mapbox/streets-v11',
          tileSize: 512,
          zoomOffset: -1
        }).addTo(this.mymap);
        // reactive... set
        // var mymap = L.map('mapid').setView(centerpoint, 13);
        // if (name) {
        //   L.marker(self.center).addTo(this.mymap)
        //       .bindPopup(name).openPopup();
        // } else {
        //   L.marker(self.center).addTo(this.mymap);
        // }

        var box = [[this.north, this.east],
          [this.south, this.west]]
        var corner1 = L.latLng(box[0][0], box[0][1]),
            corner2 = L.latLng(box[1][0], box[1][1]),
            bounds = L.latLngBounds(corner1, corner2);
        console.log('bounds valid ' + bounds.isValid())
        // not always correct order.
        let padding = Math.abs(box[0][0] - box[0][1])/2
        this.mymap.fitBounds(bounds, {padding: [padding,padding], maxZoom: 12});
        if (this.prev_bounding_box!==undefined) {
          console.log("remove prev bounding box and marker")
          this.mymap.removeLayer(this.prev_bounding_box)
        }
        if (this.prev_marker !== undefined) {
          console.log("remove prev marker")
          this.mymap.removeLayer(this.prev_marker)
        }
        this.prev_bounding_box = L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(this.mymap);
        // move bounding box center
        var northing = (box[0][0] + box[1][0]) / 2
        var easting = (box[0][1] + box[1][1]) / 2
        self.center = [northing, easting]
        this.prev_marker = L.marker(self.center).addTo(this.mymap);

        setTimeout(() => {
          this.mymap.panTo(self.center);
          this.mymap.invalidateSize()
        }, 100)
      })
    },

  }

};
</script>

<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';

.filter_card {
  background: {
    color: #f5f5f5;
  }

  border: 1px solid rgba(0,0,0, .125);

  & + .filter_card {
    margin: {
      top: $spacer / 2;
    }
  }

  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:not(:hover) {
      color: $gray-700;
      background: {
        color: $gray-300;
      }
    }

    border: 0px;
  }

  .list-group {
    overflow: {
      y: auto;
    }

    max: {
      height: 170px;
    }
  }
}

//make flat color
.btn-secondary,
.btn-secondary:hover {
  background: {
    image: none;
  }
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

</style>
