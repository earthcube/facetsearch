/**
 * Free Esri Ocean basemap tiles (no API key).
 * Shows bathymetry / ocean geography via GEBCO and related sources.
 */
export const OCEAN_BASEMAP_ATTRIBUTION =
  'Tiles © Esri — Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri';

export const OCEAN_BASE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';

export const OCEAN_REFERENCE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}';

/** Add Esri Ocean base + reference label layers to a Leaflet map. */
export function addOceanBasemap(L, map, layerOptions = {}) {
  L.tileLayer(OCEAN_BASE_URL, {
    attribution: OCEAN_BASEMAP_ATTRIBUTION,
    maxZoom: 16,
    ...layerOptions,
  }).addTo(map);

  L.tileLayer(OCEAN_REFERENCE_URL, {
    attribution: OCEAN_BASEMAP_ATTRIBUTION,
    maxZoom: 16,
    ...layerOptions,
  }).addTo(map);
}
