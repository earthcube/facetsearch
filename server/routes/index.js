var express = require('express');
var router = express.Router();
const url = require('url');
const querystring = require('querystring');
const minio = require('minio')

var toolsController = require('../api/tools')
var datasetController = require('../api/dataset_s3_store')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/tools/*', function(req,
                              res,
                              next) {
  var path = url.parse(req.url).pathname;
  var arkurl = path.replace('/tools/','')
  var arkuri = path.substring(path.indexOf('ark:'))
  toolsController.getTool(arkurl).then(
     function(r) {
       res.send(r);
     }
  )

});
router.get('/dataset/*', function(req,
                                res,
                                next) {
  var path = url.parse(req.url).pathname;
  var datasetFromPath = path.replace('/dataset/','')
  var datasetUrn = path.substring(path.indexOf('urn:') )
    var part = datasetUrn.split(':')

    var s3Path = `summoned/${part[3]}/${part[4]}.jsonld`


    // datasetController.getDataset(arkuri).then(
    //   function(r) {
    //     res.send(r);
    //   }
    const mc = new minio.Client(global.gConfig.config.jsonldStore  )
    //https://gleaner.oss.geodex.org/summoned/opentopo/0281f678daa333bdc4d9b6bbdf6c07974244e0a4.jsonld

    // mc.listBuckets(function(err, buckets) {
    //     if (err) return console.log(err)
    //     console.log('buckets :', buckets)
    // })
    // var stream = mc.listObjects('gleaner','summoned/cchdo', true)
    // stream.on('data', function(obj) { console.log(obj) } )
    // stream.on('error', function(err) { console.log(err) } )
    mc.getObject('gleaner', s3Path,
        function(err, dataStream ) {
             if (err) {

                 return console.log(err)
             }
             // dataStream.on('data', function(chunk) {
             //     size += chunk.length
             // })
             // dataStream.on('end', function() {
             //     console.log('End. Total size = ' + size)
             // })
             // dataStream.on('error', function(err) {
             //     console.log(err)
             // })
             dataStream.on('data', function(chunk) {
                // size += chunk.length
                 res.write(chunk)
             })
             dataStream.on('end', function() {
                // console.log('End. Total size = ' + size)
                 res.end()
             })
             dataStream.on('error', function(err) {
                console.log(err)
                 //res.error(err)
             })
         }
     )



});
module.exports = router;
