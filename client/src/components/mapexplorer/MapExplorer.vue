<template>
  <b-container fluid class="mt-3 map-explorer">
    <b-row>
      <!-- Sidebar: same filter panel as Search2, minus the geo facet -->
      <b-col md="4" lg="3" class="sidebar">
        <div class="mb-3">
          <label for="mapTextSearch" class="form-label fw-bold">Search</label>
          <b-input-group>
            <b-form-input
              id="mapTextSearch"
              v-model="textQuery"
              placeholder="Enter search terms..."
              :debounce="500"
            />
            <b-input-group-append>
              <b-button
                variant="outline-secondary"
                :disabled="!textQuery"
                @click="textQuery = ''"
              >
                <i class="fas fa-times"></i>
              </b-button>
            </b-input-group-append>
          </b-input-group>
          <div class="mt-2">
            <b-form-checkbox v-model="searchExactMatch" class="small">
              Exact match
            </b-form-checkbox>
          </div>
        </div>

        <div v-if="hasActiveFilters" class="mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">Active Filters ({{ filterCount }})</small>
            <b-button size="sm" variant="outline-danger" @click="clearAllFilters">
              Clear All
            </b-button>
          </div>
        </div>

        <Facets2 :facets="mapFacets" />

        <b-button
          variant="outline-primary"
          block
          class="mt-3"
          :to="{ path: '/search2/', query: $route.query }"
        >
          View as list
        </b-button>
      </b-col>

      <!-- Map -->
      <b-col md="8" lg="9">
        <div class="d-flex justify-content-between align-items-baseline mb-2 flex-wrap">
          <div>
            <strong>{{ results.length }}</strong> location{{
              results.length === 1 ? "" : "s"
            }} shown
            <b-spinner v-if="isLoading" small class="ml-2" />
            <b-badge v-if="atLimit" variant="warning" class="ml-2">
              showing first {{ limit }} — zoom in or add filters
            </b-badge>
          </div>
          <small class="text-muted">
            Only datasets with point coordinates appear on the map.
          </small>
        </div>

        <b-alert v-if="error" variant="danger" show>
          <strong>Search Error:</strong> {{ error }}
        </b-alert>

        <div ref="mapElement" class="explorer-map"></div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import _ from 'lodash';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

// Same bundler workaround as datasetLocation.vue: Leaflet's default icon
// resolves image paths at runtime, which breaks under Vite.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
import { useSearch } from '@/composables/useSearch.js';
import { useConfig } from '@/composables/useConfig.js';
import { addOceanBasemap } from '@/utils/oceanBasemap.js';
import { viewportToGeoBounds, geoBoundsKey } from '@/utils/mapBounds.js';
import Facets2 from '@/components/facetsearch/Facets2.vue';

const MAP_LIMIT = 1000;
const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;

export default {
  name: 'MapExplorer',
  components: { Facets2 },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { config, facets } = useConfig();

    const search = useSearch(config, { mode: 'locations' });
    provide('searchComposable', search);

    // The viewport IS the spatial filter here, so hide the geo facet;
    // resourceType stays out too (locations are dataset points).
    const mapFacets = computed(() =>
      (facets.value || []).filter(
        (f) => f.type !== 'geo' && f.field !== 'resourceType'
      )
    );

    const geoField = computed(
      () => (facets.value || []).find((f) => f.type === 'geo')?.field || 'spatialCoverage'
    );

    const mapElement = ref(null);
    let map = null;
    let clusterGroup = null;

    // Guards against fitBounds → moveend → setFilter → fitBounds loops:
    // suppress handling while the view is set programmatically, and remember
    // the bounds the map itself last wrote so the filter watcher skips them.
    let suppressMoveEvents = false;
    let lastMapDrivenKey = '';

    const applyViewportAsFilter = () => {
      if (!map) return;
      const bounds = viewportToGeoBounds(map.getBounds());
      if (!bounds) return;
      lastMapDrivenKey = geoBoundsKey(bounds);
      search.setFilter(geoField.value, { bounds });
    };
    const debouncedApplyViewport = _.debounce(applyViewportAsFilter, 500);

    const onMoveEnd = () => {
      if (suppressMoveEvents) {
        suppressMoveEvents = false;
        return;
      }
      debouncedApplyViewport();
    };

    const fitToBounds = (bounds) => {
      if (!map || !bounds) return;
      suppressMoveEvents = true;
      map.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { animate: false }
      );
    };

    const activeGeoBounds = () => {
      const value = search.activeFilters.value?.[geoField.value];
      return value?.bounds || null;
    };

    const renderMarkers = (rows) => {
      if (!map) return;
      if (clusterGroup) {
        clusterGroup.clearLayers();
      } else {
        clusterGroup = L.markerClusterGroup({ chunkedLoading: true });
        map.addLayer(clusterGroup);
      }
      const markers = (rows || []).map((row) => {
        const marker = L.marker([row.lat, row.lon], {
          title: row.name || row.id,
        });
        const href = router.resolve({
          name: 'dataset',
          params: { d: String(row.id || row.subj || '') },
        }).href;
        const label = String(row.name || row.id || 'Dataset')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;');
        marker.bindPopup(
          `<strong>${label}</strong><br/><a href="${href}">View dataset</a>`
        );
        return marker;
      });
      clusterGroup.addLayers(markers);
    };

    watch(search.results, (rows) => renderMarkers(rows));

    onMounted(async () => {
      if (route.name === 'MapExplorer' && route.query) {
        search.updateFromUrl(route.query);
      }
      await nextTick();
      map = L.map(mapElement.value, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        worldCopyJump: true,
      });
      addOceanBasemap(L, map);
      map.on('moveend', onMoveEnd);
      const initial = activeGeoBounds();
      if (initial) fitToBounds(initial);
      setTimeout(() => map && map.invalidateSize(true), 100);
      renderMarkers(search.results.value);
    });

    onBeforeUnmount(() => {
      debouncedApplyViewport.cancel();
      if (map) {
        map.off('moveend', onMoveEnd);
        map.remove();
        map = null;
        clusterGroup = null;
      }
    });

    // Back/forward navigation and shared links: hydrate state from the URL,
    // and move the map only for bounds this map did not itself produce.
    watch(
      () => route.query,
      (newQuery) => {
        if (route.name === 'MapExplorer') {
          search.updateFromUrl(newQuery);
        }
      }
    );
    watch(
      () => search.activeFilters.value?.[geoField.value],
      (value) => {
        const bounds = value?.bounds;
        if (!bounds) return;
        if (geoBoundsKey(bounds) === lastMapDrivenKey) return;
        fitToBounds(bounds);
      },
      { deep: true }
    );

    const atLimit = computed(() => search.results.value.length >= MAP_LIMIT);

    return {
      ...search,
      mapFacets,
      mapElement,
      atLimit,
      limit: MAP_LIMIT,
    };
  },
};
</script>

<style scoped>
.sidebar {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
}

.explorer-map {
  width: 100%;
  height: 75vh;
  min-height: 420px;
  border-radius: 0.375rem;
  z-index: 0;
}

.form-label {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
</style>
