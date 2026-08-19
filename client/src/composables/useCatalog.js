import { ref, computed, unref, watch } from 'vue';
import { createSearchService } from '@/services/SearchService.js';

/**
 * Loads a source's DataCatalog and pages through its embedded Datasets via SPARQL
 * LIMIT/OFFSET, rather than fetching+framing the whole (potentially huge) release
 * document client-side.
 */
export function useCatalog(configOrRef, sourceOrRef) {
  const initial = unref(configOrRef) ?? {};
  const searchService = createSearchService(initial);

  /**
   * The route param changes without remounting this view (/catalog/iris ->
   * /catalog/wodb reuses the component), so the source has to be read at call
   * time. Accepts a getter, a ref, or a plain string.
   */
  const currentSource = () => {
    const s = typeof sourceOrRef === 'function' ? sourceOrRef() : unref(sourceOrRef);
    return s == null ? '' : String(s);
  };

  watch(
    () => unref(configOrRef),
    (cfg) => {
      if (cfg) searchService.setConfig(cfg);
    }
  );

  const catalog = ref(null);
  const notFound = ref(false);
  const datasets = ref([]);
  const totalCount = ref(0);
  const page = ref(1);
  const pageSize = ref(Number(unref(configOrRef)?.LIMIT_DEFAULT || 20));
  const isLoadingCatalog = ref(false);
  const isLoadingDatasets = ref(false);
  const error = ref(null);

  const pageSizeOptions = computed(() => {
    const fromConfig = unref(configOrRef)?.LIMIT_OPTIONS;
    const sizes =
      Array.isArray(fromConfig) && fromConfig.length > 0
        ? fromConfig.map((v) => Number(v))
        : [10, 20, 50, 100];
    // LIMIT_DEFAULT is not necessarily one of LIMIT_OPTIONS (config_qlever_20
    // defaults to 20 but offers 10/50/100/...), which leaves the select blank.
    if (!sizes.includes(pageSize.value)) sizes.push(pageSize.value);
    return sizes.sort((a, b) => a - b);
  });

  let loadGeneration = 0;

  const loadDatasetsPage = async () => {
    if (!catalog.value?.g) return;
    const generation = ++loadGeneration;
    isLoadingDatasets.value = true;
    error.value = null;
    const offset = (page.value - 1) * pageSize.value;
    try {
      const [rows, count] = await Promise.all([
        searchService.getCatalogDatasetsPage(catalog.value.g, { limit: pageSize.value, offset }),
        searchService.getCatalogDatasetsCount(catalog.value.g),
      ]);
      if (generation !== loadGeneration) return;
      datasets.value = rows;
      totalCount.value = count;
    } catch (err) {
      if (generation !== loadGeneration) return;
      console.error('Error loading catalog datasets:', err);
      error.value = err?.message || String(err);
    } finally {
      if (generation === loadGeneration) isLoadingDatasets.value = false;
    }
  };

  const load = async () => {
    catalog.value = null;
    notFound.value = false;
    datasets.value = [];
    totalCount.value = 0;
    page.value = 1;
    isLoadingCatalog.value = true;
    error.value = null;
    try {
      const matches = await searchService.getCatalogForSource(currentSource());
      if (!matches.length) {
        notFound.value = true;
        return;
      }
      catalog.value = matches[0];
      await loadDatasetsPage();
    } catch (err) {
      console.error('Error loading catalog:', err);
      error.value = err?.message || String(err);
    } finally {
      isLoadingCatalog.value = false;
    }
  };

  const setPage = (p) => {
    const n = Number(p);
    if (!Number.isFinite(n) || n < 1) return;
    if (n === page.value) return;
    page.value = n;
    void loadDatasetsPage();
  };

  const setPageSize = (size) => {
    const n = Number(size);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n === pageSize.value) return;
    pageSize.value = n;
    page.value = 1;
    void loadDatasetsPage();
  };

  return {
    catalog,
    notFound,
    datasets,
    totalCount,
    page,
    pageSize,
    pageSizeOptions,
    isLoadingCatalog,
    isLoadingDatasets,
    error,
    load,
    setPage,
    setPageSize,
  };
}
