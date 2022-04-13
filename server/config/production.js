var endPoint = process.env.S3ADDRESS || "oss.geodex.org"
var accessKey = process.env.S3KEY || 'AKIAIOSFODNN7EXAMPLE'
var secretKey = process.env.S3SECRET || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
var useSSL = process.env.S3SSL || true
var s3Port =  process.env.S3PORT || 443
exports.config = {
    jsonldStore: {
        "type": "minio",
        "endPoint": endPoint,
        "port": s3Port,
        useSSL: useSSL,
        accessKey: accessKey,
        secretKey: secretKey

    }

}
