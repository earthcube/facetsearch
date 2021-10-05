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
        <b-card-title>Location</b-card-title>
        <div ref="myMap" id="myMap" style="width: 100%; height: 320px;" ></div>

      </b-card>
    </b-collapse>

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
    // LMap,
    //   LTileLayer,
//    LMarker,

  }, watch: {
    jsonLdCompact: 'toMap'
  },
  props: {
    "facetSetting": Object,
    "facetStore": Object,
    "state": Object,
  },
  data() {
    return {
      hasSpatial: true,
      mapboxurl: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
      attribution: `Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`,
      center: [46.8832566, -114.0870563],
      zoom: 8,
      maxZoom: 12,
      myMap:{}

    }
  },
  mounted() {
    this.hasSpatial = true;
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
      console.log(this.results.length)
      if (this.results.length <= 0) return
      this.$nextTick(() => {

        //this.$refs.myMap.mapObject.setView(this.center, 13);
        this.mymap = L.map(this.$refs.myMap.id).setView(this.center, 8);
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
        if (name) {
          L.marker(self.center).addTo(this.mymap)
              .bindPopup(name).openPopup();
        } else {
          L.marker(self.center).addTo(this.mymap);
        }

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
