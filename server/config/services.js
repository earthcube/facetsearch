
var endPoint = process.env.S3ADDRESS || "oss.geodex.org"
var accessKey = process.env.S3KEY || 'AKIAIOSFODNN7EXAMPLE'
var secretKey = process.env.S3SECRET || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
var useSSL = process.env.S3SSL || true
var s3Port =  process.env.S3PORT || 443
var bucket = process.env.BUCKET || 'gleaner'
var bucketpath = process.env.BUCKETPATH || 'summoned'
// options for path: bucket, bucketpath, reponame, sha
var pathtemplate = process.env.PATHTEMPLATE || '{{bucketpath}}/{{reponame}}/{{sha}}.jsonld'

// options for tool: bucket, bucketpath, reponame, ref (aka ark, or maybe a sha in the future)
var tooltemplate = process.env.TOOLTEMPLATE || '{{bucketpath}}/{{reponame}}/{{ref}}.json'
var toolbucket = process.env.TOOLBUCKET || 'ecrr'
var toolpath = process.env.TOOLPATH || 'summoned'
var toolrepo = process.env.TOOLREPO ||'ecrr_form'

exports.config = {
    jsonldStore: {
        "type": "minio",
        "endPoint": endPoint,
        "port": s3Port,
        useSSL: useSSL,
        accessKey: accessKey,
        secretKey: secretKey

    },
    datastore: {
        type: 'minio',
        bucket: bucket,
        bucketpath: bucketpath,
        pathtemplate: pathtemplate,
        tooltemplate: tooltemplate,
        toolpath: toolpath,
        toolrepo: toolrepo,
        toolbucket: toolbucket
    },


}
