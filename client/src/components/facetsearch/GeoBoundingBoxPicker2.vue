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
        <GeoMapPreview
          class="mb-2"
          :bounds="committedBounds"
          @open="openEditor"
        />

        <small class="text-muted d-block mb-2">
          Click the preview map to choose or update a bounding box.
        </small>

        <!-- Bounds Display -->
        <div v-if="hasActiveBounds" class="bounds-display mb-2">
          <small class="text-muted bounds-grid">
            <strong class="bounds-label">Bounds:</strong>
            <span class="bounds-north">N: {{ committedBounds.north.toFixed(3) }}</span>
            <span class="bounds-west">W: {{ committedBounds.west.toFixed(3) }}</span>
            <span class="bounds-east">E: {{ committedBounds.east.toFixed(3) }}</span>
            <span class="bounds-south">S: {{ committedBounds.south.toFixed(3) }}</span>
          </small>
        </div>

        <!-- Controls -->
        <div class="geo-controls">
          <b-button
            v-if="hasActiveBounds"
            variant="outline-secondary"
            size="sm"
            @click="clearBounds"
          >
            Clear
          </b-button>

          <b-button
            variant="outline-primary"
            size="sm"
            @click="openEditor"
          >
            Edit Bounds
          </b-button>
        </div>
      </div>
    </b-collapse>

    <GeoBoundsEditorModal
      :visible="isEditorOpen"
      :initial-bounds="draftBounds"
      @confirm="confirmDraftBounds"
      @cancel="cancelDraftBounds"
    />
  </div>
</template>

<script>
import { computed, inject, ref } from 'vue';
import { useGeoFacet } from '@/composables/useSearch.js';
import GeoMapPreview from './GeoMapPreview.vue';
import GeoBoundsEditorModal from './GeoBoundsEditorModal.vue';

export default {
  name: 'GeoBoundingBoxPicker2',
  components: {
    GeoMapPreview,
    GeoBoundsEditorModal,
  },

  props: {
    facetConfig: {
      type: Object,
      required: true,
    },
  },

  setup(props) {
    // Get search composable from parent
    const searchComposable = inject('searchComposable');

    // Use geo facet composable
    const geoFacet = useGeoFacet(props.facetConfig, searchComposable);

    // Local state
    const isOpen = ref(props.facetConfig.open !== false);
    const isEditorOpen = ref(false);
    const draftBounds = ref(null);

    const cloneBounds = (bounds) => {
      if (!bounds) return null;
      return {
        north: Number(bounds.north),
        south: Number(bounds.south),
        east: Number(bounds.east),
        west: Number(bounds.west),
      };
    };

    const committedBounds = computed(() => {
      const active = geoFacet.activeBounds.value;
      return active?.bounds || null;
    });

    // Methods
    const toggleOpen = () => {
      isOpen.value = !isOpen.value;
    };

    const openEditor = () => {
      draftBounds.value = cloneBounds(committedBounds.value);
      isEditorOpen.value = true;
    };

    const confirmDraftBounds = (bounds) => {
      if (!bounds) {
        geoFacet.clearBounds();
      } else {
        geoFacet.setBounds(bounds);
      }
      isEditorOpen.value = false;
      draftBounds.value = null;
    };

    const cancelDraftBounds = () => {
      isEditorOpen.value = false;
      draftBounds.value = null;
    };

    return {
      ...geoFacet,
      committedBounds,
      draftBounds,
      isOpen,
      isEditorOpen,
      toggleOpen,
      openEditor,
      confirmDraftBounds,
      cancelDraftBounds,
    };
  },
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

.bounds-display {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.bounds-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.15rem 1rem;
  align-items: center;
}

.bounds-label {
  grid-column: 1 / -1;
}

.bounds-north,
.bounds-south {
  grid-column: 1 / -1;
  justify-self: center;
  /* Slight eastward shift for a clearer N / (W E) / S diamond layout */
  transform: translateX(0.5rem);
}

.bounds-west {
  justify-self: start;
}

.bounds-east {
  justify-self: end;
}

.geo-controls {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
</style>