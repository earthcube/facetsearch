<template>
  <b-card no-body class="entry-tile h-100">
    <b-card-body class="d-flex flex-column">
      <b-card-title class="h5 d-flex align-items-center mb-2">
        <!-- BIcon's dynamic icon lookup renders bi-blank under the Vue 3
             compat build; the per-icon components registered by IconsPlugin
             (b-icon-grid, ...) resolve fine. -->
        <component :is="`b-icon-${icon}`" v-if="icon" class="mr-2 tile-icon" />
        {{ title }}
      </b-card-title>
      <b-card-text v-if="description" class="text-muted small">
        {{ description }}
      </b-card-text>
      <div class="mt-auto">
        <slot />
      </div>
    </b-card-body>
  </b-card>
</template>

<script>
export default {
  name: 'EntryTile',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.entry-tile {
  .tile-icon {
    color: $primary;
  }
}
</style>
