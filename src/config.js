var env = process.env.NODE_ENV || 'development'

var FacetsConfig = {
    development: require('./config/development.js'),
    production: require('./config/production.js'),
    staging: require('./config/staging.js')
}

module.exports = FacetsConfig[env]
// https://cli.vuejs.org/config/#publicpath
// module.exports = {
//     publicPath: env === 'production'
//         ? '/facetsearch/'
//         : '/'
// }
