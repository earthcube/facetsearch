<template>
  <b-container fluid="md" class="mt-5">
    <!-- allow logo to size according to container. fill with primary color from bootstrap variables -->
    <b-container class="col-md-5 pt-5">
      <template v-if="currentTenant">
        <span class="logo">{{ currentTenant.name }}</span>
      </template>
      <template v-else>
        <logoGeoCodes fill="#18598b" width="100%" />
      </template>
    </b-container>

    <!-- Primary entry: keyword search with autocomplete -->
    <b-container class="col-md-6 mt-4">
      <KeywordAutocomplete />
    </b-container>

    <!-- Directory of the other ways into the search interface -->
    <b-container fluid="md" class="mt-5">
      <b-row>
        <b-col md="6" lg="3" class="mb-4">
          <EntryTile
            icon="grid"
            title="Browse everything"
            description="Explore all indexed datasets and tools, then narrow down with facets."
          >
            <b-button variant="primary" :to="{ path: '/search2/' }">
              Browse
            </b-button>
          </EntryTile>
        </b-col>

        <b-col md="6" lg="3" class="mb-4">
          <EntryTile
            icon="calendar-range"
            title="Search by time period"
            description="Find datasets whose temporal coverage overlaps a range of years."
          >
            <TemporalEntryTile />
          </EntryTile>
        </b-col>

        <b-col md="6" lg="3" class="mb-4">
          <EntryTile
            icon="globe"
            title="Search by location"
            description="Draw a bounding box on a map to find datasets in an area of interest."
          >
            <SpatialEntryTile />
          </EntryTile>
        </b-col>

        <b-col md="6" lg="3" class="mb-4">
          <EntryTile
            icon="lightning"
            title="Starter queries"
            description="Jump into a curated search and adjust it from there."
          >
            <StarterQueries />
          </EntryTile>
        </b-col>
      </b-row>
    </b-container>

    <RepoHighlights />
  </b-container>
</template>

<script>
import { computed } from "vue";
import { useStore } from "vuex";
import logoGeoCodes from "@/components/logos/logoGeoCodes.vue";
import { tenantDefault } from "@/config.js";
import EntryTile from "./EntryTile.vue";
import KeywordAutocomplete from "./KeywordAutocomplete.vue";
import TemporalEntryTile from "./TemporalEntryTile.vue";
import SpatialEntryTile from "./SpatialEntryTile.vue";
import StarterQueries from "./StarterQueries.vue";
import RepoHighlights from "./RepoHighlights.vue";

export default {
  name: "LandingDirectory",
  components: {
    logoGeoCodes,
    EntryTile,
    KeywordAutocomplete,
    TemporalEntryTile,
    SpatialEntryTile,
    StarterQueries,
    RepoHighlights,
  },
  setup() {
    const store = useStore();

    const currentTenant = computed(() => {
      const tenantData = store.getters.getTenantData;
      const community = store.state.FacetsConfig?.COMMUNITY;
      if (!tenantData?.tenant) return tenantDefault.tenant[0];
      return (
        tenantData.tenant.find((t) => t.community === community) ||
        tenantDefault.tenant[0]
      );
    });

    return { currentTenant };
  },
};
</script>

<style scoped lang="scss">
.logo {
  font-family: "Open Sans", sans-serif;
  font-size: 72px;
  color: #2a5279;
  letter-spacing: 2px;
  display: inline-flex;
  align-items: center;
}
</style>
