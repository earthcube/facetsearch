<template>
  <div ref="rootElement" class="map-explorer" :style="{ height: explorerHeight }">
    <!-- Map fills the viewport; everything else floats on top -->
    <div ref="mapElement" class="explorer-map"></div>

    <!-- One dock, two panes, switched by the edge tab strip -->
    <div ref="panelElement" class="dock">
      <div class="dock__panel">
        <div class="dock__header">
          <span class="dock__title">{{ paneHeading }}</span>
          <b-spinner v-if="isLoading" small />
          <b-button
            v-if="activePane === 'filters' && hasActiveFilters"
            size="sm"
            variant="outline-danger"
            @click="clearAllFilters"
          >
            Clear All
          </b-button>
          <b-button
            v-if="activePane === 'results' && focusRows"
            size="sm"
            variant="outline-secondary"
            @click="clearFocus"
          >
            Show all
          </b-button>
        </div>

        <!-- One scroll region per pane; v-show keeps facet state alive -->
        <div v-show="activePane === 'filters'" class="dock__body">
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

          <Facets2 :facets="mapFacets" />
        </div>

        <div v-show="activePane === 'results'" class="dock__body">
          <b-alert v-if="error" variant="danger" show class="small mb-2">
            <strong>Search error:</strong> {{ error }}
          </b-alert>

          <b-badge v-if="atLimit" variant="warning" class="d-block mb-2 text-wrap">
            Showing first {{ limit }} — zoom in or add filters
          </b-badge>

          <p v-if="!visibleRows.length" class="text-muted small mb-0">
            No datasets with point coordinates in view.
          </p>

          <ul v-else class="result-list">
            <li
              v-for="row in visibleRows"
              :key="row.key"
              class="result-list__item"
              @mouseenter="previewRow(row, $event)"
              @mouseleave="scheduleSummaryClose"
              @focusin="previewRow(row, $event)"
            >
              <router-link
                v-if="isMobile"
                :to="row.to"
                class="result-list__link"
              >
                {{ row.name }}
              </router-link>
              <a
                v-else
                :href="row.href"
                target="_blank"
                rel="noopener"
                class="result-list__link"
                title="Open dataset in a new tab"
              >
                {{ row.name }} <span class="result-list__ext" aria-hidden="true">&#8599;</span>
              </a>
              <button
                type="button"
                class="result-list__action"
                title="Zoom to this location"
                aria-label="Zoom to this location"
                @click="flyTo(row)"
              >
                <span aria-hidden="true">&#8982;</span>
              </button>
            </li>
          </ul>

          <p v-if="truncated" class="text-muted small mt-2 mb-0">
            Showing the first {{ resultListMax }} of {{ activeRows.length }}.
          </p>

          <p class="text-muted result-list__note">
            Only datasets with point coordinates appear on the map.
          </p>
        </div>

        <div class="dock__footer">
          <b-button
            variant="outline-primary"
            size="sm"
            block
            :to="{ path: '/search2/', query: $route.query }"
          >
            View as list
          </b-button>
        </div>
      </div>

      <div class="dock__tabs" role="tablist" aria-orientation="vertical">
        <button
          v-for="pane in panes"
          :key="pane.id"
          type="button"
          role="tab"
          class="dock__tab"
          :class="{ 'dock__tab--active': activePane === pane.id }"
          :aria-selected="String(activePane === pane.id)"
          @click="activePane = pane.id"
        >
          <span class="dock__tab-label">{{ pane.label }}</span>
          <b-badge v-if="pane.count" :variant="pane.variant" pill>
            {{ pane.count }}
          </b-badge>
        </button>
      </div>
    </div>

    <!-- Hover card: dataset detail pulled from the graph store on demand -->
    <div
      v-if="summaryCard && !isMobile"
      ref="summaryElement"
      class="summary-card"
      :style="summaryCardStyle"
      @mouseenter="cancelSummaryClose"
      @mouseleave="scheduleSummaryClose"
    >
      <div class="summary-card__name">{{ summaryCard.name }}</div>

      <div v-if="summaryCard.loading" class="summary-card__meta">
        <b-spinner small /> Loading details…
      </div>

      <template v-else>
        <p v-if="summaryCard.description" class="summary-card__description">
          {{ summaryCard.description }}
        </p>
        <p v-else class="summary-card__meta">No description available.</p>

        <div v-if="summaryCard.publisher" class="summary-card__meta">
          {{ summaryCard.publisher }}
          <span v-if="summaryCard.datePublished"> · {{ summaryCard.datePublished }}</span>
        </div>
      </template>

      <div class="summary-card__actions">
        <router-link v-if="isMobile" :to="summaryCard.to">View dataset</router-link>
        <a v-else :href="summaryCard.href" target="_blank" rel="noopener">
          Open in new tab <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </div>

  </div>
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

/**
 * Some sources put citation HTML in schema:name and schema:description
 * ("<b>Author (2025).</b> Title. <i>Zenodo.</i>"), which renders as escaped
 * tag soup in a list. Strip tags first, then decode entities in a textarea,
 * which holds its content as text and never instantiates elements.
 */
function stripMarkup(value) {
  const raw = String(value ?? '');
  if (!raw) return '';
  if (!raw.includes('<') && !raw.includes('&')) return raw;
  const decoder = document.createElement('textarea');
  decoder.innerHTML = raw.replace(/<[^>]*>/g, ' ');
  return decoder.value.replace(/\s+/g, ' ').trim();
}

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
    const rootElement = ref(null);
    const panelElement = ref(null);
    const activePane = ref('filters');

    // New tabs are awkward on touch devices (no visible tab strip to return
    // through), so those navigate in-app instead. Coarse pointer OR a phone
    // -width viewport counts, matching the stylesheet's breakpoint.
    const MOBILE_QUERY = '(pointer: coarse), (max-width: 767.98px)';
    const isMobile = ref(false);
    let mobileMedia = null;
    const onMobileChange = (event) => {
      isMobile.value = event.matches;
    };


    // The nav header is sticky and its height varies (logos, mobile collapse),
    // so measure where this component actually starts rather than guessing.
    const explorerHeight = ref('80vh');
    let resizeObserver = null;

    const measureHeight = () => {
      if (!rootElement.value) return;
      const top = rootElement.value.getBoundingClientRect().top;
      explorerHeight.value = `${Math.max(360, window.innerHeight - top)}px`;
      if (map) map.invalidateSize(true);
    };

    // Hovering a cluster "focuses" the results dock on just that cluster's
    // datasets. The focus is sticky rather than tied to mouseout: releasing on
    // mouseout would make the list flicker away as the pointer travels to it.
    const RESULT_LIST_MAX = 200;
    const focusRows = ref(null);

    const clearFocus = () => {
      focusRows.value = null;
    };

    const closeSummary = () => {
      cancelSummaryFetch();
      summaryGeneration += 1;
      summaryCard.value = null;
    };

    const datasetRoute = (row) => ({
      name: 'dataset',
      params: { d: String(row.id || row.subj || '') },
    });

    const activeRows = computed(() => focusRows.value || search.results.value || []);

    const visibleRows = computed(() =>
      activeRows.value.slice(0, RESULT_LIST_MAX).map((row, index) => ({
        key: `${row.id || row.subj || index}-${index}`,
        name: stripMarkup(row.name) || String(row.id || 'Untitled dataset'),
        to: datasetRoute(row),
        href: router.resolve(datasetRoute(row)).href,
        subj: row.subj || row.id,
        lat: row.lat,
        lon: row.lon,
      }))
    );

    const truncated = computed(() => activeRows.value.length > RESULT_LIST_MAX);

    const paneHeading = computed(() =>
      activePane.value === 'filters' ? 'Filters' : focusHeading.value
    );

    const panes = computed(() => [
      {
        id: 'filters',
        label: 'Filters',
        count: search.filterCount.value,
        variant: 'primary',
      },
      {
        id: 'results',
        label: 'Results',
        count: search.results.value.length,
        variant: 'secondary',
      },
    ]);

    const focusHeading = computed(() => {
      const count = activeRows.value.length;
      const noun = `dataset${count === 1 ? '' : 's'}`;
      return focusRows.value
        ? `${count} ${noun} at this cluster`
        : `${count} ${noun} in view`;
    });

    const focusOnCluster = (rows) => {
      if (!rows.length) return;
      focusRows.value = rows;
      // Surface what was hovered even if the filters pane was showing.
      activePane.value = 'results';
    };

    let map = null;
    let clusterGroup = null;

    // Guards against fitBounds → moveend → setFilter → fitBounds loops:
    // suppress handling while the view is set programmatically, and remember
    // the bounds the map itself last wrote so the filter watcher skips them.
    let suppressMoveEvents = false;
    let lastMapDrivenKey = '';

    // Hover card. The summary is fetched lazily per row and cached in the
    // service, so re-hovering the same list costs nothing.
    const summaryElement = ref(null);
    const summaryCard = ref(null);
    const summaryCardStyle = ref({});
    let summaryCloseTimer = null;
    let summaryFetchTimer = null;
    let summaryGeneration = 0;

    const cancelSummaryFetch = () => {
      if (summaryFetchTimer) {
        clearTimeout(summaryFetchTimer);
        summaryFetchTimer = null;
      }
    };

    const cancelSummaryClose = () => {
      if (summaryCloseTimer) {
        clearTimeout(summaryCloseTimer);
        summaryCloseTimer = null;
      }
    };

    const scheduleSummaryClose = () => {
      cancelSummaryClose();
      // Long enough for the pointer to cross the gap onto the card itself.
      summaryCloseTimer = setTimeout(() => {
        cancelSummaryFetch();
        summaryGeneration += 1;
        summaryCard.value = null;
        summaryCloseTimer = null;
      }, 200);
    };

    const previewRow = (row, event) => {
      cancelSummaryClose();
      cancelSummaryFetch();
      const generation = ++summaryGeneration;

      // Vertically align the card with the hovered row, to the dock's right.
      const rootRect = rootElement.value?.getBoundingClientRect();
      const rowRect = event?.currentTarget?.getBoundingClientRect();
      if (rootRect && rowRect) {
        summaryCardStyle.value = {
          top: `${Math.max(8, Math.min(rowRect.top - rootRect.top - 8, rootRect.height - 220))}px`,
        };
      }

      // Show name immediately; fill in graph-store detail when it lands.
      summaryCard.value = {
        name: row.name,
        to: row.to,
        href: row.href,
        loading: true,
      };

      if (!row.subj) {
        summaryCard.value.loading = false;
        return;
      }

      // Hold off on the query: scanning down the list would otherwise fire one
      // request per row and trip the triplestore's rate limit.
      summaryFetchTimer = setTimeout(async () => {
        summaryFetchTimer = null;
        try {
          const summary = await search.searchService.getDatasetSummary(row.subj);
          // A later hover already replaced this card.
          if (generation !== summaryGeneration) return;
          summaryCard.value = {
            name: stripMarkup(summary?.name) || row.name,
            description: stripMarkup(summary?.description),
            publisher: stripMarkup(summary?.publisher),
            datePublished: (summary?.datePublished || '').slice(0, 10),
            to: row.to,
            href: row.href,
            loading: false,
          };
        } catch {
          if (generation !== summaryGeneration) return;
          summaryCard.value = { ...summaryCard.value, loading: false };
        }
      }, 300);
    };

    const flyTo = (row) => {
      if (!map || !Number.isFinite(row.lat) || !Number.isFinite(row.lon)) return;
      map.setView([row.lat, row.lon], Math.max(map.getZoom(), 10));
    };

    const applyViewportAsFilter = () => {
      if (!map) return;
      const bounds = viewportToGeoBounds(map.getBounds());
      if (!bounds) return;
      lastMapDrivenKey = geoBoundsKey(bounds);
      search.setFilter(geoField.value, { bounds });
    };
    const debouncedApplyViewport = _.debounce(applyViewportAsFilter, 500);

    const onMoveStart = () => {
      clearFocus();
    };

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
      const fitEast = bounds.west > bounds.east ? bounds.east + 360 : bounds.east;
      map.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, fitEast],
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
        clusterGroup.on('clustermouseover', (event) => {
          const cluster = event.propagatedFrom || event.layer;
          if (!cluster) return;
          focusOnCluster(
            cluster
              .getAllChildMarkers()
              .map((child) => child.options.rowData)
              .filter(Boolean)
          );
        });
        clusterGroup.on('mouseover', (event) => {
          const row = (event.propagatedFrom || event.layer)?.options?.rowData;
          if (row) focusOnCluster([row]);
        });
        map.addLayer(clusterGroup);
      }
      const markers = (rows || []).map((row) => {
        const marker = L.marker([row.lat, row.lon], {
          title: row.name || row.id,
          // Carried so cluster hover can list what is inside without a lookup.
          rowData: row,
        });
        const href = router.resolve(datasetRoute(row)).href;
        const label = (stripMarkup(row.name) || String(row.id || 'Dataset'))
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;');
        const linkAttrs = isMobile.value
          ? ''
          : ' target="_blank" rel="noopener"';
        marker.bindPopup(
          `<strong>${label}</strong><br/><a href="${href}"${linkAttrs}>View dataset</a>`
        );
        return marker;
      });
      clusterGroup.addLayers(markers);
    };

    watch(activePane, closeSummary);

    watch(search.results, (rows) => {
      // The focused subset refers to markers that no longer exist.
      clearFocus();
      renderMarkers(rows);
    });

    onMounted(async () => {
      if (route.name === 'MapExplorer' && route.query) {
        search.updateFromUrl(route.query);
      }
      await nextTick();
      map = L.map(mapElement.value, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        worldCopyJump: true,
        // Default top-left would sit under the facet dock.
        zoomControl: false,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      addOceanBasemap(L, map);

      // Floating overlays sit inside the map container's event space: without
      // this, scrolling the facet list zooms the map and dragging selects it.
      [panelElement.value, summaryElement.value].forEach((el) => {
        if (!el) return;
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
      });

      if (typeof window.matchMedia === 'function') {
        mobileMedia = window.matchMedia(MOBILE_QUERY);
        isMobile.value = mobileMedia.matches;
        mobileMedia.addEventListener('change', onMobileChange);
      }

      measureHeight();
      window.addEventListener('resize', measureHeight);
      if (typeof ResizeObserver !== 'undefined') {
        // Catches header reflow (mobile nav collapse) that no resize event fires for.
        resizeObserver = new ResizeObserver(measureHeight);
        const header = document.querySelector('.navbar');
        if (header) resizeObserver.observe(header);
      }

      map.on('movestart', onMoveStart);
      map.on('moveend', onMoveEnd);
      const initial = activeGeoBounds();
      if (initial) fitToBounds(initial);
      setTimeout(() => map && map.invalidateSize(true), 100);
      renderMarkers(search.results.value);
    });

    onBeforeUnmount(() => {
      debouncedApplyViewport.cancel();
      cancelSummaryClose();
      cancelSummaryFetch();
      if (mobileMedia) {
        mobileMedia.removeEventListener('change', onMobileChange);
        mobileMedia = null;
      }
      window.removeEventListener('resize', measureHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (map) {
        map.off('movestart', onMoveStart);
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
      rootElement,
      explorerHeight,
      panelElement,
      activePane,
      isMobile,
      panes,
      paneHeading,
      focusRows,
      focusHeading,
      activeRows,
      visibleRows,
      truncated,
      clearFocus,
      flyTo,
      summaryElement,
      summaryCard,
      summaryCardStyle,
      previewRow,
      cancelSummaryClose,
      scheduleSummaryClose,
      resultListMax: RESULT_LIST_MAX,
      atLimit,
      limit: MAP_LIMIT,
    };
  },
};
</script>

<style scoped>
.map-explorer {
  position: relative;
  width: 100%;
  min-height: 360px;
  /* z-index on a positioned element makes this a stacking context, so the
     overlays below (which must clear Leaflet's own 1000-level controls)
     cannot paint over the sticky nav header at z-index 1020. */
  z-index: 0;
}

.explorer-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* Leaflet's own controls sit at z-index 1000; the dock must clear that.
   Flex row of [panel][vertical tab strip], pinned to the left edge. */
.dock {
  --panel-width: 22rem;
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1100;
  display: flex;
  max-height: calc(100% - 2rem);
}

.dock__panel {
  width: var(--panel-width);
  max-width: calc(100vw - 6rem);
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.97);
  border-radius: 0.5rem 0 0 0.5rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.dock__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
  flex: 0 0 auto;
}

.dock__title {
  flex: 1 1 auto;
  font-weight: 600;
  font-size: 0.95rem;
}

/* The scrolling region. flex:1 + min-height:0 is what lets it shrink
   inside the flex column instead of overflowing the panel. */
.dock__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 0.75rem;
}

.dock__footer {
  flex: 0 0 auto;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.dock__tabs {
  flex: 0 0 auto;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dock__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 0.5rem;
  border: 0;
  border-radius: 0 0.5rem 0.5rem 0;
  background-color: #e9ecef;
  color: #495057;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
}

.dock__tab:hover {
  background-color: #f1f3f5;
}

/* The active tab reads as continuous with the panel it fronts. */
.dock__tab--active {
  background-color: rgba(255, 255, 255, 0.97);
  color: #212529;
  box-shadow: 0.25rem 0.25rem 0.75rem rgba(0, 0, 0, 0.2);
}

/* Vertical label keeps the strip a slim edge handle. */
.dock__tab-label {
  writing-mode: vertical-rl;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.result-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.85rem;
}

.result-list__item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid #f1f3f5;
}

/* Long titles must wrap inside the panel, never widen it. */
.result-list__link {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  /* Citation-style names run very long; keep every row scannable. */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-list__item:hover {
  background-color: #f8f9fa;
}

.result-list__ext {
  color: #6c757d;
}

.result-list__action {
  flex: 0 0 auto;
  min-width: 1.5rem;
  font-size: 1rem;
  border: 0;
  background: transparent;
  color: #6c757d;
  padding: 0.15rem 0.25rem;
  cursor: pointer;
}

.result-list__action:hover {
  color: #212529;
}

.result-list__note {
  margin: 0.75rem 0 0;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f3f5;
  font-size: 0.75rem;
}

/* Sits just outside the dock's right edge, aligned to the hovered row. */
.summary-card {
  position: absolute;
  left: calc(1rem + var(--panel-width, 22rem) + 3rem);
  z-index: 1200;
  width: 20rem;
  max-width: calc(100vw - 2rem);
  padding: 0.65rem 0.8rem;
  background-color: rgba(255, 255, 255, 0.98);
  border-radius: 0.375rem;
  box-shadow: 0 0.375rem 1.25rem rgba(0, 0, 0, 0.3);
  font-size: 0.85rem;
}

.summary-card__name {
  font-weight: 600;
  margin-bottom: 0.35rem;
}

/* Descriptions run long; clamp rather than let the card grow unbounded. */
.summary-card__description {
  margin: 0 0 0.4rem;
  color: #343a40;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary-card__meta {
  margin: 0 0 0.4rem;
  color: #6c757d;
  font-size: 0.78rem;
}

.summary-card__actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.4rem;
  border-top: 1px solid #f1f3f5;
  font-size: 0.8rem;
}

.form-label {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 767.98px) {
  /* Phone: the dock becomes a bottom sheet with a horizontal tab strip.
     column-reverse puts the tabs (last in DOM) above the panel. */
  .dock {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    flex-direction: column-reverse;
    max-height: 60%;
  }

  .dock__panel {
    width: 100%;
    max-width: none;
    border-radius: 0;
  }

  .dock__tabs {
    align-self: stretch;
    flex-direction: row;
  }

  .dock__tab {
    flex: 1 1 0;
    flex-direction: row;
    justify-content: center;
    padding: 0.6rem 0.5rem;
    border-radius: 0.5rem 0.5rem 0 0;
  }

  .dock__tab--active {
    box-shadow: 0 -0.25rem 0.75rem rgba(0, 0, 0, 0.2);
  }

  .dock__tab-label {
    writing-mode: horizontal-tb;
  }

  /* App.vue pins a fixed-bottom version banner; keep the footer button
     clear of it while the sheet itself stays flush to the edge. */
  .dock__footer {
    padding-bottom: 1.5rem;
  }

}
</style>
