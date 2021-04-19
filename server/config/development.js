var debug = require('debug')('config')
debug('in development config')
exports.config = {
    jsonldStore: {
        "type": "minio",
        "endPoint": "oss.geodex.org",
            "port": 443,
        useSSL: true,
        accessKey: 'AKIAIOSFODNN7EXAMPLE',
        secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'

  }

}
