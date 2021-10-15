var debug = require('debug')('config')
debug('in development config')
var endPoint = process.env.S3ADDRESS || "oss.geocodes.earthcube.org"
var accessKey = process.env.S3KEY || 'AKIAIOSFODNN7EXAMPLE'
var secretKey = process.env.S3SECRET || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
exports.config = {
    jsonldStore: {
        "type": "minio",
        "endPoint": endPoint,
            "port": 443,
        useSSL: true,
        accessKey: accessKey,
        secretKey: secretKey

  }

}
