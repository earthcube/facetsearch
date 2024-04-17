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

export default FacetsConfig;
