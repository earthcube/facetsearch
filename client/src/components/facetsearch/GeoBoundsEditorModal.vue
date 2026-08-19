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
            Dateline-crossing boxes are preserved; for major shape changes,
            redraw with "Draw Box" and confirm to apply.
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
    let firstCornerPoint = null;
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

    const normalizeLongitude = (lng) => {
      const value = Number(lng);
      if (!Number.isFinite(value)) return null;
      return ((value + 180) % 360 + 360) % 360 - 180;
    };

    const isDatelineCrossing = (bounds) =>
      !!bounds && Number(bounds.west) > Number(bounds.east);

    const buildBoundsFromCorners = (a, b, aPoint = null, bPoint = null) => {
      if (!a || !b) return null;
      const north = Math.max(a.lat, b.lat);
      const south = Math.min(a.lat, b.lat);
      const aLng = normalizeLongitude(a.lng);
      const bLng = normalizeLongitude(b.lng);
      if (aLng === null || bLng === null) return null;

      const span = Math.abs(aLng - bLng);
      const mapWidth = map?.getSize?.().x || 0;
      const crossingByPixelDistance =
        mapWidth > 0 &&
        aPoint &&
        bPoint &&
        Math.abs(Number(aPoint.x) - Number(bPoint.x)) > mapWidth / 2;
      const crossing = span > 180 || crossingByPixelDistance;
      const west = crossing ? Math.max(aLng, bLng) : Math.min(aLng, bLng);
      const east = crossing ? Math.min(aLng, bLng) : Math.max(aLng, bLng);

      if (north === south || east === west) return null;
      return { north, south, east, west };
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

    const getBoundsFromEditedLayers = (layers) => {
      if (!layers?.length) return null;
      const segments = layers
        .filter((layer) => !!layer?.getBounds)
        .map((layer) => {
          const b = layer.getBounds();
          return {
            north: b.getNorth(),
            south: b.getSouth(),
            east: normalizeLongitude(b.getEast()),
            west: normalizeLongitude(b.getWest()),
          };
        })
        .filter((s) => s.east !== null && s.west !== null);

      if (!segments.length) return null;
      if (segments.length === 1) {
        const seg = segments[0];
        return {
          north: seg.north,
          south: seg.south,
          east: seg.east,
          west: seg.west,
        };
      }

      const nearDateLine = 10;
      const right = segments.find((s) => s.east > 180 - nearDateLine);
      const left = segments.find((s) => s.west < -180 + nearDateLine);
      if (right && left) {
        return {
          north: Math.max(...segments.map((s) => s.north)),
          south: Math.min(...segments.map((s) => s.south)),
          west: Math.min(right.west, right.east),
          east: Math.max(left.west, left.east),
        };
      }

      return {
        north: Math.max(...segments.map((s) => s.north)),
        south: Math.min(...segments.map((s) => s.south)),
        west: Math.min(...segments.map((s) => s.west)),
        east: Math.max(...segments.map((s) => s.east)),
      };
    };

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

      const segments = toDisplaySegments(bounds);
      let combinedBounds = null;
      segments.forEach((segment) => {
        const rectangle = L.rectangle(
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
        drawnItems.addLayer(rectangle);
        combinedBounds = combinedBounds
          ? combinedBounds.extend(rectangle.getBounds())
          : rectangle.getBounds();
      });
      if (combinedBounds) {
        map.fitBounds(combinedBounds, { padding: [20, 20] });
      }
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
        draftBounds = getBoundsFromEditedLayers([layer]);
      });

      map.on(L.Draw.Event.EDITED, (event) => {
        const layers = event.layers.getLayers();
        if (!layers.length) return;
        const editedBounds = getBoundsFromEditedLayers(layers);
        if (editedBounds) {
          draftBounds = editedBounds;
          replaceWithRectangle(draftBounds);
        }
      });

      map.on(L.Draw.Event.DELETED, () => {
        draftBounds = null;
      });

      map.on('click', (event) => {
        if (!isTwoClickDrawActive) return;

        if (!firstCorner) {
          firstCorner = event.latlng;
          firstCornerPoint = event.containerPoint;
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

        draftBounds = buildBoundsFromCorners(
          firstCorner,
          event.latlng,
          firstCornerPoint,
          event.containerPoint
        );
        replaceWithRectangle(draftBounds);
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
      firstCornerPoint = null;
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
      // Keep draftBounds as source-of-truth so antimeridian crossing survives
      // without collapsing through Leaflet bounds normalization.
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
