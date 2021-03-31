var env = process.env.NODE_ENV || 'development'

var serverConfig = {
    development: require('./config/development.js'),
    production: require('./config/production.js'),
    staging: require('./config/staging.js')
}

global.gConfig =  serverConfig[env]
