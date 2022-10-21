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
const facetConfigFunction = () => {

     fetch(process.env.BASE_URL + "config/config.yaml")
    .then((response) => response.text())
    .then((config) => {
     let y =   yaml.load(config)
        return y;

    }).catch(function (err) {
            console.log(err)
        })
}
let FacetsConfig = facetConfigFunction()

export default FacetsConfig
