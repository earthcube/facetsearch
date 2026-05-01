// var env = process.env.NODE_ENV || 'development'
//
// var FacetsConfig = {
//     development: require('./config/development.js'),
//     production: require('./config/production.js'),
//     staging: require('./config/staging.js'),
//     geocodestest: require('./config/geocodestest.js')
// }
//
// module.exports = FacetsConfig[env]
// https://cli.vuejs.org/config/#publicpath
// module.exports = {
//     publicPath: env === 'production'
//         ? '/facetsearch/'
//         : '/'
// }

import yaml from "js-yaml";
const facetConfigFunction = () => {
  // we really cannot use a process.env value for file name, because that gets embedded in webpack,
  // aka would need a new container for every file
  //fetch(process.env.BASE_URL + "config/config.yaml") // vuec
  const configfile = import.meta.env.VITE_APP_FACETS_CONFIG_FILE
    ? import.meta.env.VITE_APP_FACETS_CONFIG_FILE
    : "config/config.yaml";
  const configurl = import.meta.env.BASE_URL + configfile;
  fetch(configurl) //vite
    .then((response) => response.text())
    .then((config) => {
      let y = yaml.load(config);
      return y;
    })
    .catch(function (err) {
      console.log(err);
    });
};
let FacetsConfig = facetConfigFunction();

/** Used when tenant.yaml cannot be fetched or COMMUNITY is missing from it (common on slow/local networks). */
export const tenantFetchFallback = {
  geocodesall: {
    tenant: [
      {
        community: "geocodesall",
        name: "GeoCODES",
        description:
          "Discovery across EarthCube-indexed datasets and tools. (Using built-in tenant text because tenant.yaml could not be loaded or did not list this community.)",
        landing_introduction:
          "Search and explore geoscience datasets and tools. For full landing copy, ensure TENANT_URL in your config is reachable from the browser.",
        color: "#18598b",
        url: "https://geocodes.earthcube.org",
      },
    ],
  },
};

export const tenantDefault = {
  tenant: [
    {
      community: "none",
      landing_introduction:
        "Check FacetsConfig.TENANT_URL (network / CORS) and that COMMUNITY exists in tenant.yaml.",
      description: "Tenant metadata could not be loaded.",
      name: "GeoCODES",
      color: "#18598b",
      url: "https://geocodes.earthcube.org",
    },
  ],
};
export default FacetsConfig;
