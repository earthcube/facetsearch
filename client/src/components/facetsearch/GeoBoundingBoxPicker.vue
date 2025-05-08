<template>
  <div class="map-bbox-selector">
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'

export default {
  name: 'MapBoundingBoxSelector',
  props: {
    // optional initial values
    initialLatRange: {
      type: Array,
      default: () => [-90, 90]
    },
    initialLonRange: {
      type: Array,
      default: () => [-180, 180]
    }
  },
  emits: ['update:latRange', 'update:lonRange', 'bbox-changed'],
  data() {
    return {
      map: null,
      drawControl: null,
      drawLayer: null
    }
  },
  mounted() {
    // 1. init map
    this.map = L.map(this.$refs.mapContainer).setView([0, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map)

    // 2. layer to hold the drawn box
    this.drawLayer = new L.FeatureGroup().addTo(this.map)

    // 3. draw control (only rectangle)
    this.drawControl = new L.Control.Draw({
      edit:   { featureGroup: this.drawLayer },
      draw:   {
        marker: false,
        circle: false,
        polyline: false,
        polygon: false,
        circlemarker: false,
        rectangle: {
          shapeOptions: { color: '#3388ff' }
        }
      }
    })
    this.map.addControl(this.drawControl)

    // 4. listen for draw events
    this.map.on(L.Draw.Event.CREATED,  this.onBoxDrawn)
    this.map.on(L.Draw.Event.EDITED,   this.onBoxEdited)
    this.map.on(L.Draw.Event.DELETED,  this.onBoxDeleted)
  },
  methods: {
    onBoxDrawn(e) {
      // clear old, add new
      this.drawLayer.clearLayers()
      this.drawLayer.addLayer(e.layer)
      this.emitBounds(e.layer.getBounds())
    },
    onBoxEdited(e) {
      e.layers.eachLayer(layer => {
        this.emitBounds(layer.getBounds())
      })
    },
    onBoxDeleted() {
      this.drawLayer.clearLayers()
      // emit empty to indicate cleared
      this.$emit('update:latRange', [])
      this.$emit('update:lonRange', [])
      this.$emit('bbox-changed', null)
    },
    emitBounds(bounds) {
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      const latRange = [sw.lat, ne.lat]
      const lonRange = [sw.lng, ne.lng]

      this.$emit('update:latRange', latRange)
      this.$emit('update:lonRange', lonRange)
      this.$emit('bbox-changed', { latRange, lonRange })
    }
  },
  beforeUnmount() {
    this.map.off()
    this.map.remove()
  }
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 300px; /* adjust as needed */
  border: 1px solid #ccc;
}
</style>
