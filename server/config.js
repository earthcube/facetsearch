var debug = require('debug')('config')
var env = process.env.NODE_ENV || "development"

var serverConfig = {
    development: require('./config/development.js'),
    production: require('./config/production.js'),
    staging: require('./config/staging.js')
}

if (serverConfig[env]) {
    global.gConfig =  serverConfig[env]
    debug(global.gConfig)
} else {
    throw Error( 'Bad Config env.NODE_ENV must be one of ' + Object.keys(serverConfig) )
}

