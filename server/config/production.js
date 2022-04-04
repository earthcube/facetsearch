var endPoint = process.env.S3ADDRESS || "oss.geodex.org"
var accessKey = process.env.S3KEY || 'AKIAIOSFODNN7EXAMPLE'
var secretKey = process.env.S3SECRET || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
exports.config = {
    jsonldStore: {
        "type": "minio",
        "endPoint": endPoint,
        "port": 9000,
        useSSL: false,
        accessKey: accessKey,
        secretKey: secretKey

    }

}
