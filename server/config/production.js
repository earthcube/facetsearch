var endPoint = process.env.MINIO_ENDPOINT || "oss.geodex.org"
var accessKey = process.env.MINIO_ACCESS || 'AKIAIOSFODNN7EXAMPLE'
var secretKey = process.env.MINIO_SECRET || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
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
