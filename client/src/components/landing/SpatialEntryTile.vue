<template>
  <div>
    <b-button variant="primary" :to="{ path: '/map' }">
      Explore the map
    </b-button>
    <b-button variant="outline-secondary" class="ml-2" @click="editorVisible = true">
      Draw a search area
    </b-button>

    <GeoBoundsEditorModal
      :visible="editorVisible"
      :initial-bounds="null"
      @confirm="onConfirm"
      @cancel="editorVisible = false"
    />
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import GeoBoundsEditorModal from '@/components/facetsearch/GeoBoundsEditorModal.vue';

export default {
  name: 'SpatialEntryTile',
  components: { GeoBoundsEditorModal },
  setup() {
    const router = useRouter();
    const editorVisible = ref(false);

    const onConfirm = (bounds) => {
      editorVisible.value = false;
      if (!bounds) return;
      // Same N,S,E,W encoding as FilterStateManager.encodeGeoBoundsForUrl.
      const spatialCoverage = [
        bounds.north,
        bounds.south,
        bounds.east,
        bounds.west,
      ]
        .map((v) => Number(v))
        .join(',');
      router.push({ path: '/search2/', query: { spatialCoverage } });
    };

    return { editorVisible, onConfirm };
  },
};
</script>
