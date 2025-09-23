<template>
  <div class="geo-bounding-box">
    <div class="facet-header" @click="toggleOpen">
      <h6 class="facet-title mb-0">
        <i :class="isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="me-2"></i>
        {{ facetConfig.title }}
        <b-badge v-if="hasActiveBounds" variant="primary" class="ms-2">
          Active
        </b-badge>
      </h6>
    </div>

    <b-collapse :visible="isOpen">
      <div class="facet-body">
        <!-- Map Container -->
        <div id="map" class="map-container mb-3"></div>

        <!-- Bounds Display -->
        <div v-if="hasActiveBounds" class="bounds-display mb-2">
          <small class="text-muted">
            <strong>Bounds:</strong><br>
            N: {{ activeBounds.bounds.north.toFixed(3) }},
            S: {{ activeBounds.bounds.south.toFixed(3) }}<br>
            E: {{ activeBounds.bounds.east.toFixed(3) }},
            W: {{ activeBounds.bounds.west.toFixed(3) }}
          </small>
        </div>

        <!-- Controls -->
        <div class="geo-controls">
          <b-button
            v-if="hasActiveBounds"
            variant="outline-secondary"
            size="sm"
            @click="clearBounds"
            class="me-2"
          >
            Clear
          </b-button>

          <b-button
            variant="outline-primary"
            size="sm"
            @click="resetMap"
          >
            Reset Map
          </b-button>
        </div>
      </div>
    </b-collapse>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, inject, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeoFacet } from '@/composables/useSearch.js';

export default {
  name: "GeoBoundingBoxPicker2",

  props: {
    facetConfig: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    // Get search composable from parent
    const searchComposable = inject('searchComposable');

    // Use geo facet composable
    const geoFacet = useGeoFacet(props.facetConfig, searchComposable);

    // Local state
    const isOpen = ref(props.facetConfig.open !== false);
    let map = null;
    let drawnItems = null;
    let drawControl = null;

    // Methods
    const toggleOpen = async () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        await nextTick();
        initMap();
      }
    };

    const initMap = () => {
      if (map) return; // Already initialized

      // Initialize map
      map = L.map('map').setView([39.8283, -98.5795], 4); // Center on USA

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Initialize draw controls
      drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      // Draw control
      drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          rectangle: {
            shapeOptions: {
              clickable: false
            }
          },
          polyline: false,
          polygon: false,
          circle: false,
          marker: false,
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });

      map.addControl(drawControl);

      // Event handlers
      map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);

        const bounds = layer.getBounds();
        geoFacet.setBounds({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
      });

      map.on(L.Draw.Event.DELETED, () => {
        geoFacet.clearBounds();
      });

      // Load existing bounds if any
      if (geoFacet.hasActiveBounds.value) {
        loadExistingBounds();
      }
    };

    const loadExistingBounds = () => {
      if (!map || !geoFacet.activeBounds.value) return;

      const bounds = geoFacet.activeBounds.value.bounds;
      const rectangle = L.rectangle([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ]);

      drawnItems.addLayer(rectangle);
      map.fitBounds(rectangle.getBounds());
    };

    const resetMap = () => {
      if (map) {
        map.setView([39.8283, -98.5795], 4);
      }
    };

    // Watch for bounds changes from outside
    watch(() => geoFacet.activeBounds.value, (newBounds) => {
      if (!map) return;

      // Clear existing drawings
      drawnItems.clearLayers();

      // Add new bounds if they exist
      if (newBounds) {
        loadExistingBounds();
      }
    });

    // Cleanup
    onUnmounted(() => {
      if (map) {
        map.remove();
        map = null;
      }
    });

    return {
      ...geoFacet,
      isOpen,
      toggleOpen,
      resetMap
    };
  }
};
</script>

<style scoped>
.geo-bounding-box {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
}

.facet-header {
  padding: 0.75rem;
  cursor: pointer;
  background: #f8f9fa;
  border-radius: 0.375rem 0.375rem 0 0;
}

.facet-header:hover {
  background: #e9ecef;
}

.facet-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
}

.facet-body {
  padding: 0.75rem;
}

.map-container {
  height: 300px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
}

.bounds-display {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.geo-controls {
  display: flex;
  gap: 0.5rem;
}
</style>