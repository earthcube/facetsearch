var jsonLdObj = require("./jsonldObject");
var jsonld = require('jsonld')
var axios = require('axios')
const https = require('https')
const minio = require('minio')
var d = require('debug')('dataset:dataset')
var t = require('debug')('dataset:tools')
var g = require('debug')('dataset:getJson')

var S3_BASE ='http://gleaner.oss.geodex.org/summoned'

const getJson =async function(datasetUrn) {
    return  new Promise((resolve, reject) => {
        if (datasetUrn === undefined) {
           reject ({status:404, error:"empty datasetUrn"})
            return;
        }
        var part = datasetUrn.split(':');
        if (part.length <4) {
            reject ({status:404, error:"improper datasetUrn. Missing parts"})
            return;
        }

        var s3Path = `summoned/${part[3]}/${part[4]}.jsonld`
        g('config'+global.gConfig)
        const mc = new minio.Client(global.gConfig.config.jsonldStore)
        //https://gleaner.oss.geodex.org/summoned/opentopo/0281f678daa333bdc4d9b6bbdf6c07974244e0a4.jsonld
        let jsonld = "";
        mc.getObject('gleaner', s3Path,
            function (err, dataStream) {
                if (err) {
                    // need better error messaging
                    //res.status(404)
                    //res.render('error', { error: err.message + err.resource })
                    console.log(err)

                    //throw Error(err.message + err.resource)
                    reject({status:404, error:err.message + err.resource})
                    return
                }
                let jsonld = ""
                dataStream.on('data', function (chunk) {
                    //res.write(chunk)
                    jsonld += chunk
                })
                dataStream.on('end', function () {
                    //res.end()
                   resolve(jsonld)
                })
                dataStream.on('error', function (err) {
                    console.log(err)
                    //res.status(500)
                    //res.render('error', { error: err.message  })
                   // throw Error(err.message)
                    reject({status:500, error:err.message})
                })
            }
        )
    }) // promise
}
exports.getDataset = getJson

const jsonCompact = async function(jsonldObj)
{
    const toolLdContext = {};
    return jsonld.compact(toolLdObj, toolLdContext).then((providers) => {
        var j = JSON.stringify(providers, null, 2);
        var jp = JSON.parse(j);
        console.log(j.toString());
        return jp

    })
}

exports.getDownloads =async function(uri) {
    return  new Promise((resolve, reject) => {
        getJson(uri).then(function(data){
            {
                let jsonObj = JSON.parse(data)
                const toolLdContext = {};
                jsonld.compact(jsonObj, toolLdContext).then(
                    json => {
                        var s_distribution = jsonLdObj.schemaItem('distribution', json);
                        var downloads = jsonLdObj.getDistributions(s_distribution)
                        resolve( JSON.stringify(downloads, null,2));
                    }
                ).catch(err => reject(err))
            }
        }).catch(
            err =>  reject(err)
        )
    })
}




