<template>
  <div class="filter_card">
    <b-button
      v-b-toggle="'accordion_' + facetSetting.field"
      block
      squared
    >
      {{ facetSetting.title }}
      <b-icon icon="square"      class="when-open"  scale="0.8" aria-hidden="true"/>
      <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true"/>
    </b-button>

    <b-collapse
      :id="'accordion_' + facetSetting.field"
      @shown="initMap"
    >
      <!-- always show the map -->
      <div ref="mapContainer" class="map-container mx-2 mb-2"></div>
    </b-collapse>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'   // must come after leaflet

export default {
  name: 'FacetSpatialCoverage',
  inject: ['toggleFilter'],
  props: {
    facetSetting: { type: Object, required: true },
    facetStore:   { type: Object, required: true },
  },
  data() {
    return {
      map:        null,
      drawLayer:  null,
      drawControl:null,
    }
  },
  methods: {
    initMap() {
      // if map already exists, just resize it
      if (this.map) {
        this.map.invalidateSize()
        return
      }

      // 1) build the map
      this.map = L.map(this.$refs.mapContainer).setView([0,0], 2)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map)

      // 2) layer for drawing
      this.drawLayer = new L.FeatureGroup().addTo(this.map)

      // 3) only rectangle
      this.drawControl = new L.Control.Draw({
        edit: { featureGroup: this.drawLayer },
        draw: {
          rectangle: { shapeOptions: { color: '#3388ff' } },
          polygon: false,
          polyline: false,
          circle: false,
          marker: false,
          circlemarker: false
        }
      })
      this.map.addControl(this.drawControl)

      // 4) events
      this.map.on(L.Draw.Event.CREATED, this.onBoxDrawn)
      this.map.on(L.Draw.Event.EDITED,  this.onBoxEdited)
      this.map.on(L.Draw.Event.DELETED, this.onBoxDeleted)
    },
    onBoxDrawn(e) {
      this.drawLayer.clearLayers()
      this.drawLayer.addLayer(e.layer)
      this.applyBBox(e.layer.getBounds())
    },
    onBoxEdited(e) {
      e.layers.eachLayer(layer => this.applyBBox(layer.getBounds()))
    },
    onBoxDeleted() {
      this.drawLayer.clearLayers()
      // clear filters
      this.toggleFilter('minLat', null, true)
      this.toggleFilter('maxLat', null, true)
      this.toggleFilter('minLon', null, true)
      this.toggleFilter('maxLon', null, true)
    },
    applyBBox(bounds) {
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      this.toggleFilter('minLat', sw.lat, true)
      this.toggleFilter('maxLat', ne.lat, true)
      this.toggleFilter('minLon', sw.lng, true)
      this.toggleFilter('maxLon', ne.lng, true)
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.filter_card {
  background: #f5f5f5;
  border: 1px solid rgba(0,0,0,0.125);
  & + .filter_card { margin-top: $spacer/2; }

  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;
    &:not(:hover) {
      color: $gray-700;
      background-color: $gray-300;
    }
  }

  .map-container {
    width: 100%;
    height: 200px;  /* adjust your desired height */
    border: 1px solid #ccc;
  }
}

/* icon toggle */
.collapsed  > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

/* flat secondary */
.btn-secondary,
.btn-secondary:hover {
  background-image: none !important;
}
</style>
