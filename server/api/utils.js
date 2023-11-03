const _ = require("lodash");

exports.uri3S3Path= function(datasetUrn){
    let  repolocation = 3
    if ( global.gConfig.config.datastore.uriversion ==="v1") {
        repolocation = 2
     }
    if (datasetUrn === undefined) {
       // reject ({status:404, error:"empty datasetUrn"})
        return;
    }
    var part = datasetUrn.split(':');
    if (part.length <3) {
      //  reject ({status:404, error:"improper datasetUrn. Missing parts. At minimum: urn:repo:sha"})
        return;
    }

    //var s3Path = `summoned/${part[3]}/${part[4]}.jsonld`
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    var s3pathtemplate = _.template(global.gConfig.config.datastore.pathtemplate)
    var s3Path = s3pathtemplate({
        bucket: global.gConfig.config.datastore.bucket,
        bucketpath: global.gConfig.config.datastore.bucketpath,
        reponame: part[part.length - repolocation], // zero based
        sha: part[part.length -1 ] // zero based
    })
    return s3Path
}
