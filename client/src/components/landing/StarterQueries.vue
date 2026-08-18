<template>
  <b-list-group v-if="entries.length > 0" flush>
    <b-list-group-item
      v-for="(entry, index) in entries"
      :key="index"
      :to="routeFor(entry)"
      class="px-0"
    >
      <div class="font-weight-bold">{{ entry.label }}</div>
      <small v-if="entry.description" class="text-muted">{{
        entry.description
      }}</small>
    </b-list-group-item>
  </b-list-group>
  <p v-else class="text-muted small mb-0">
    No starter queries configured.
  </p>
</template>

<script>
import { computed } from 'vue';
import { useConfig } from '@/composables/useConfig.js';
import { starterQueryToRoute } from '@/utils/starterQueries.js';

export default {
  name: 'StarterQueries',
  setup() {
    const { config } = useConfig();

    const entries = computed(() => {
      const list = config.value?.STARTER_QUERIES;
      if (!Array.isArray(list)) return [];
      return list.filter((e) => e && typeof e === 'object' && e.label);
    });

    return {
      entries,
      routeFor: starterQueryToRoute,
    };
  },
};
</script>
