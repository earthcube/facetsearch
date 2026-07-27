<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="geo-modal-backdrop"
    >
      <div class="geo-modal-window" tabindex="-1" ref="dialogElement">
        <div class="geo-modal-header">
          <h5 class="mb-0">Spatial Search</h5>
          <b-button
            variant="link"
            class="p-0 text-muted"
            aria-label="Close spatial bounds editor"
            @click="handleCancel"
          >
            <i class="fas fa-times"></i>
          </b-button>
        </div>

        <div class="geo-modal-body">
          <p class="text-muted mb-2">
            Click "Draw Box", then click two corners on the map.
            Use Edit/Delete tools to adjust, then confirm to apply.
          </p>
          <div ref="mapElement" class="geo-editor-map"></div>
        </div>

        <div class="geo-modal-footer">
          <b-button variant="outline-primary" size="sm" @click="startTwoClickDraw">
            Draw Box (2-click)
          </b-button>
          <b-button variant="outline-secondary" size="sm" @click="clearDraft">
            Clear
          </b-button>
          <div class="geo-modal-actions">
            <b-button variant="outline-secondary" size="sm" @click="handleCancel">
              Cancel
            </b-button>
            <b-button variant="primary" size="sm" @click="handleConfirm">
              Confirm
            </b-button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { addOceanBasemap } from '@/utils/oceanBasemap.js';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;

export default {
  name: 'GeoBoundsEditorModal',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    initialBounds: {
      type: Object,
      default: null,
    },
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const mapElement = ref(null);
    const dialogElement = ref(null);

    let map = null;
    let drawnItems = null;
    let drawControl = null;
    let draftBounds = null;
    let tempRectangle = null;
    let firstCorner = null;
    let isTwoClickDrawActive = false;

    const cloneBounds = (bounds) => {
      if (!bounds) return null;
      return {
        north: Number(bounds.north),
        south: Number(bounds.south),
        east: Number(bounds.east),
        west: Number(bounds.west),
      };
    };

    const setDraftFromLayer = (layer) => {
      const bounds = layer.getBounds();
      draftBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
    };

    const getCurrentBoundsFromMap = () => {
      if (!drawnItems) return null;
      const layers = drawnItems.getLayers();
      if (!layers.length) return null;

      const layer = layers[0];
      if (!layer?.getBounds) return null;

      const bounds = layer.getBounds();
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
    };

    const getLatLngBounds = (bounds) =>
      L.latLngBounds(
        L.latLng(bounds.south, bounds.west),
        L.latLng(bounds.north, bounds.east)
      );

    const replaceWithRectangle = (bounds) => {
      if (!map || !drawnItems) return;
      drawnItems.clearLayers();
      if (tempRectangle) {
        map.removeLayer(tempRectangle);
        tempRectangle = null;
      }
      if (!bounds) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        return;
      }

      const rectangle = L.rectangle(getLatLngBounds(bounds), {
        color: '#dc3545',
        weight: 2,
        fillOpacity: 0.08,
      });
      drawnItems.addLayer(rectangle);
      map.fitBounds(rectangle.getBounds(), { padding: [20, 20] });
    };

    const initMap = () => {
      if (!mapElement.value || map) return;

      map = L.map(mapElement.value).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      addOceanBasemap(L, map);

      drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          rectangle: false,
          polyline: false,
          polygon: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (event) => {
        stopTwoClickDraw();
        drawnItems.clearLayers();
        const layer = event.layer;
        drawnItems.addLayer(layer);
        setDraftFromLayer(layer);
      });

      map.on(L.Draw.Event.EDITED, (event) => {
        const layers = event.layers.getLayers();
        if (!layers.length) return;
        setDraftFromLayer(layers[0]);
      });

      map.on(L.Draw.Event.DELETED, () => {
        draftBounds = null;
      });

      map.on('click', (event) => {
        if (!isTwoClickDrawActive) return;

        if (!firstCorner) {
          firstCorner = event.latlng;
          if (tempRectangle) {
            map.removeLayer(tempRectangle);
          }
          tempRectangle = L.rectangle(L.latLngBounds(firstCorner, firstCorner), {
            color: '#dc3545',
            weight: 2,
            fillOpacity: 0.08,
            dashArray: '4,4',
          }).addTo(map);
          return;
        }

        const finalBounds = L.latLngBounds(firstCorner, event.latlng);
        const finalRect = L.rectangle(finalBounds, {
          color: '#dc3545',
          weight: 2,
          fillOpacity: 0.08,
        });
        drawnItems.clearLayers();
        drawnItems.addLayer(finalRect);
        setDraftFromLayer(finalRect);
        stopTwoClickDraw();
      });

      map.on('mousemove', (event) => {
        if (!isTwoClickDrawActive || !firstCorner || !tempRectangle) return;
        tempRectangle.setBounds(L.latLngBounds(firstCorner, event.latlng));
      });
    };

    const destroyMap = () => {
      stopTwoClickDraw();
      if (map) {
        map.remove();
      }
      map = null;
      drawnItems = null;
      drawControl = null;
      tempRectangle = null;
    };

    const stopTwoClickDraw = () => {
      isTwoClickDrawActive = false;
      firstCorner = null;
      if (tempRectangle && map) {
        map.removeLayer(tempRectangle);
        tempRectangle = null;
      }
      if (map) {
        map.getContainer().style.cursor = '';
      }
    };

    const startTwoClickDraw = () => {
      if (!map) return;
      stopTwoClickDraw();
      isTwoClickDrawActive = true;
      map.getContainer().style.cursor = 'crosshair';
    };

    const waitForMapPaint = async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    };

    const refreshFromInitialBounds = async () => {
      draftBounds = cloneBounds(props.initialBounds);
      await nextTick();
      if (!map) return;

      // Leaflet maps inside modals can render blank when reopened unless size
      // is invalidated after the modal becomes visible.
      map.invalidateSize(true);
      await waitForMapPaint();
      replaceWithRectangle(draftBounds);
      map.invalidateSize(true);
    };

    const handleConfirm = () => {
      // Leaflet Draw "EDITED" event only fires after clicking the mini "Save"
      // button in the draw toolbar. Read bounds directly from the map layer so
      // modal Confirm always commits the latest visual rectangle position/size.
      const currentBounds = getCurrentBoundsFromMap();
      draftBounds = currentBounds ? cloneBounds(currentBounds) : null;
      emit('confirm', cloneBounds(draftBounds));
    };

    const handleCancel = () => {
      emit('cancel');
    };

    const clearDraft = () => {
      stopTwoClickDraw();
      draftBounds = null;
      if (drawnItems) {
        drawnItems.clearLayers();
      }
      replaceWithRectangle(null);
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && props.visible) {
        handleCancel();
      }
    };

    watch(
      () => props.visible,
      async (visible) => {
        if (!visible) return;
        await nextTick();
        initMap();
        await refreshFromInitialBounds();
        if (!props.initialBounds) {
          startTwoClickDraw();
        }
        if (dialogElement.value) dialogElement.value.focus();
        window.addEventListener('keydown', handleEscapeKey);
      }
    );

    watch(
      () => props.visible,
      (visible) => {
        if (visible) return;
        destroyMap();
        window.removeEventListener('keydown', handleEscapeKey);
      }
    );

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleEscapeKey);
      destroyMap();
    });

    return {
      mapElement,
      dialogElement,
      clearDraft,
      startTwoClickDraw,
      handleCancel,
      handleConfirm,
    };
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.geo-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.geo-modal-window {
  width: min(980px, 100%);
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
  outline: none;
}

.geo-modal-header,
.geo-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
}

.geo-modal-footer {
  border-bottom: 0;
  border-top: 1px solid #dee2e6;
}

.geo-modal-body {
  padding: 1rem;
}

.geo-editor-map {
  height: 560px;
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
}

.geo-modal-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
