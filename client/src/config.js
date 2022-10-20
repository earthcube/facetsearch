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

import yaml from 'js-yaml'
const FacetsConfig =() => {
    fetch(process.env.BASE_URL + "public/config.yaml")
    .then((response) => response.json())
    .then((config) => {
        const y = yaml.load(config)
        return y
    })
}
export default FacetsConfig
