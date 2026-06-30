<template>
  <div
    class="geo-map-preview"
    role="button"
    tabindex="0"
    aria-label="Open spatial bounds editor"
    @click="$emit('open')"
    @keydown.enter.prevent="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <div ref="mapElement" class="preview-map"></div>
    <div class="preview-overlay">
      <small class="preview-hint">Click to edit bounds</small>
    </div>
  </div>
</template>

<script>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

export default {
  name: 'GeoMapPreview',
  emits: ['open'],
  props: {
    bounds: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const mapElement = ref(null);
    let map = null;
    let rectangle = null;

    const getLatLngBounds = (bounds) =>
      L.latLngBounds(
        L.latLng(bounds.south, bounds.west),
        L.latLng(bounds.north, bounds.east)
      );

    const clearRectangle = () => {
      if (rectangle && map) {
        map.removeLayer(rectangle);
        rectangle = null;
      }
    };

    const renderBounds = async () => {
      if (!map) return;
      clearRectangle();
      if (props.bounds) {
        rectangle = L.rectangle(getLatLngBounds(props.bounds), {
          color: '#dc3545',
          weight: 2,
          fillOpacity: 0.08,
        }).addTo(map);
        map.fitBounds(rectangle.getBounds(), { padding: [8, 8] });
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }
      await nextTick();
      map.invalidateSize();
    };

    onMounted(async () => {
      if (!mapElement.value) return;
      map = L.map(mapElement.value, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        touchZoom: false,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      await renderBounds();
    });

    watch(
      () => props.bounds,
      async () => {
        await renderBounds();
      },
      { deep: true }
    );

    onBeforeUnmount(() => {
      if (map) {
        map.remove();
        map = null;
      }
    });

    return {
      mapElement,
    };
  },
};
</script>

<style scoped>
.geo-map-preview {
  position: relative;
  height: 160px;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  outline: none;
}

.geo-map-preview:focus-visible {
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.preview-map {
  height: 100%;
  width: 100%;
}

.preview-overlay {
  position: absolute;
  left: 0.5rem;
  bottom: 0.5rem;
  pointer-events: none;
}

.preview-hint {
  display: inline-block;
  background: rgba(255, 255, 255, 0.9);
  color: #495057;
  border-radius: 0.25rem;
  padding: 0.2rem 0.4rem;
}
</style>
