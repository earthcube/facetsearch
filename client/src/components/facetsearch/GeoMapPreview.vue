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
import { addOceanBasemap } from '@/utils/oceanBasemap.js';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;

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
    let rectangles = [];

    const normalizeLongitude = (lng) => {
      const value = Number(lng);
      if (!Number.isFinite(value)) return null;
      return ((value + 180) % 360 + 360) % 360 - 180;
    };

    const toDisplaySegments = (bounds) => {
      if (!bounds) return [];
      const north = Number(bounds.north);
      const south = Number(bounds.south);
      const east = normalizeLongitude(bounds.east);
      const west = normalizeLongitude(bounds.west);
      if (
        !Number.isFinite(north) ||
        !Number.isFinite(south) ||
        east === null ||
        west === null
      ) {
        return [];
      }
      if (west <= east) {
        return [{ north, south, east, west }];
      }
      return [
        { north, south, west, east: 180 },
        { north, south, west: -180, east },
      ];
    };

    const clearRectangle = () => {
      if (!map) return;
      rectangles.forEach((rectangle) => map.removeLayer(rectangle));
      rectangles = [];
    };

    const addRectangle = (segment) =>
      L.rectangle(
        L.latLngBounds(
          L.latLng(segment.south, segment.west),
          L.latLng(segment.north, segment.east)
        ),
        {
          color: '#dc3545',
          weight: 2,
          fillOpacity: 0.08,
        }
      );

    const fitPreviewBounds = (segments) => {
      if (!map || !segments.length) return;
      // Crossing boxes produce two segments, one at each map edge. Keep a world
      // overview for those cases so both sides remain visible in preview.
      if (segments.length > 1) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        return;
      }
      const only = segments[0];
      const bounds = L.latLngBounds(
        L.latLng(only.south, only.west),
        L.latLng(only.north, only.east)
      );
      map.fitBounds(bounds, { padding: [8, 8] });
    };

    const renderBounds = async () => {
      if (!map) return;
      clearRectangle();
      if (props.bounds) {
        const segments = toDisplaySegments(props.bounds);
        rectangles = segments.map((segment) => addRectangle(segment).addTo(map));
        fitPreviewBounds(segments);
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

      addOceanBasemap(L, map);

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
