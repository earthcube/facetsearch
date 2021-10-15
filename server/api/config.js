var _ = require('lodash')


exports.getConfig = function() {
//var url = new URL(toolArk); //adding ?  or ?? to ark returns some info  eg http://n2t.net/ark:/23942/g2600027??
    var c = global.gConfig.config.jsonldStore
    c = _.omit(c, ["accessKey", "secretKey"])
    return c
}
