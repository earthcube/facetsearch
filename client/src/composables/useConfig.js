import { computed } from 'vue';
import { useStore } from 'vuex';

export function useConfig() {
  const store = useStore();

  const config = computed(() => store.state.FacetsConfig);
  const facets = computed(() => config.value?.FACETS || []);
  const apiUrl = computed(() => config.value?.API_URL);
  const triplestoreUrl = computed(() => config.value?.TRIPLESTORE_URL);
  const queryEngine = computed(() => config.value?.QUERY_ENGINE || 'blazegraph');
  const limitDefault = computed(() => config.value?.LIMIT_DEFAULT || 10);
  const limitOptions = computed(() => config.value?.LIMIT_OPTIONS || [10, 50, 100]);

  const getFacetConfig = (field) => {
    return facets.value.find(f => f.field === field);
  };

  return {
    config,
    facets,
    apiUrl,
    triplestoreUrl,
    queryEngine,
    limitDefault,
    limitOptions,
    getFacetConfig
  };
}
