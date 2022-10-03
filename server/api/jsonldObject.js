"use strict";
const _ = require( 'lodash')
const axios =require('axios')




// const getJsonLD =  async function (object){
//
//     const fetchURL = `https://dx.geodex.org/id/summoned${object}`
//     console.log(fetchURL);
//     var url = new URL(fetchURL);
//     return axios.get(url).then (
//     //const content = await rawResponse.json();
//     function(r) {
//         var content = r.data;
//         //console.log(contentAsText);
//         if (typeof content === String) {
//             content = content.replace("http://schema.org/", "https://schema.org/")
//         } else {
//             content = JSON.stringify(content)
//             content = content.replace("http://schema.org/", "https://schema.org/")
//         }
//
//         var jsonldObject = JSON.parse(content)
//
//     //console.log(content);
//          return jsonldObject
//     }
//
//     )
//
// }
const schemaItem = function (name, json_compacted, noSchemaMessage="") {
    let s_name = json_compacted["https://schema.org/" + name] ? json_compacted["https://schema.org/" + name] :
        json_compacted["http://schema.org/" + name] ? json_compacted["http://schema.org/" + name] : noSchemaMessage
    return s_name;
}
const hasSchemaProperty = function (name, jsonObj) {
    // eslint-disable-next-line no-prototype-builtins
    if ( jsonObj.hasOwnProperty("https://schema.org/" +name) || jsonObj.hasOwnProperty("http://schema.org/" +name) )
        return true;
}
const geoplacename = function(s_spatialCoverage){
    var placename = ''
    if (Array.isArray(s_spatialCoverage)){
        var s_place = s_spatialCoverage.find((obj) => hasSchemaProperty('name',obj) )
         placename = schemaItem('name',s_place)
    } else {
         placename = hasSchemaProperty('name',s_spatialCoverage) ? schemaItem('name',s_spatialCoverage) : null
    }
    return placename;
}
const getFirstGeoShape = function(s_spatialCoverage, shapetype){

    let geo;
// box, poly
    if (Array.isArray(s_spatialCoverage)){
        //geo = s_spatialCoverage.find((obj) => hasSchemaProperty('geo',obj) );
        let spatialC = s_spatialCoverage.filter((obj) => hasSchemaProperty('geo',obj) )
        let spatialCofType = spatialC.find(function(obj){
            let geoInternal = schemaItem('geo', obj)
            return hasSchemaProperty(shapetype, geoInternal)
        })
        if (spatialCofType) geo = schemaItem('geo', spatialCofType)
    } else {
        geo = hasSchemaProperty('geo', s_spatialCoverage) ? schemaItem('geo', s_spatialCoverage) : null;
    }
    if (Array.isArray(geo)){
        // get first match
        geo = geo.find((obj) => obj['@type'].endsWith('GeoShape') && hasSchemaProperty(shapetype, obj) );
    }
    if (geo){
        //console.log(geo['@type'])
        if (geo['@type'].endsWith('GeoShape') && hasSchemaProperty(shapetype, geo)){
            var g = schemaItem (shapetype, geo);
            var coords = g.replaceAll(',',' ' ).split(' ').filter( e => e.trim().length > 0)

            var forLeaflet = []
            for (var i = 0; i < coords.length ; i= i+2){

                forLeaflet.push([ parseFloat(coords[i] ),  parseFloat(coords[i+1]) ])
            }
            return forLeaflet
        }
    }
    return null;
}

// "@type": "https://schema.org/GeoCoordinates",
//     "https://schema.org/latitude": 43.10841,
//     "https://schema.org/longitude": -118.25872000000001
const getGeoCoordinates = function(s_spatialCoverage){
    // box, poly
    var geo =[]
    var coords = null
    if (Array.isArray(s_spatialCoverage)){
        // geo = s_spatialCoverage.find((obj) => hasSchemaProperty('geo',obj) )
        let spatialC = s_spatialCoverage.filter((obj) => hasSchemaProperty('geo',obj) )
        let spatialCofType = spatialC.filter(function(obj){
            let geoInternal = schemaItem('geo', obj)
            return geoInternal['@type'].endsWith("GeoCoordinates")
        })
        if (spatialCofType) {spatialCofType = spatialCofType.map(function(obj){
            let geoInternal = schemaItem('geo', obj)
            if ( geoInternal['@type'].endsWith("GeoCoordinates") ){
                return geoInternal
            }
        })}
        if (spatialCofType) geo = spatialCofType
    } else {
        if (hasSchemaProperty('geo',s_spatialCoverage) ) {
            geo = schemaItem('geo', s_spatialCoverage)
        }
    }
    // sometimes obj has no @type..

    if (Array.isArray(geo)) {
        geo = geo.filter((obj) => obj['@type'] === 'https://schema.org/GeoCoordinates' || obj['@type'] === 'http://schema.org/GeoCoordinates');

        coords = geo.map(function (obj) {
            var lat = schemaItem('latitude', obj)
            var lon = schemaItem('longitude', obj)
            if (lat && lon) {
                return [parseFloat(lat), parseFloat(lon)]
            }
        })
    }
    else {
        if (geo['@type']=== 'https://schema.org/GeoCoordinates' || geo['@type'] === 'http://schema.org/GeoCoordinates') {
            var lat = schemaItem('latitude', geo)
            var lon = schemaItem('longitude', geo)
            if (lat && lon) {
                coords = [[parseFloat(lat), parseFloat(lon)]]
            }
        }

    }
    return coords;
}

const getDistributions = function(s_distribution) {
    var downloads = []
    //if (! s_distribution &&  ! s_url) return [];
    if (! s_distribution ) return [];
    if (Array.isArray(s_distribution)){

        s_distribution.map((obj) => downloads= downloads.concat (makeLinkObj(obj)))
    }
    else {

        downloads= downloads.concat (makeLinkObj(s_distribution))
    }
    // if (s_url) {
    //    var link =  {
    //         distType: "URL",
    //             contentUrl: s_url,
    //         encodingFormat: "Website",
    //         name: "Document URL"
    //     }
    //     downloads.push(link)
    // }
    return downloads
}

const makeLinkObj = function(obj_dist){
    var downloads = []
    let url = ""
    let name =""
    let encodingFormats = ""
    if (hasSchemaProperty('url', obj_dist)) {
        url = schemaItem('url', obj_dist);
    } else if ( hasSchemaProperty('contentUrl',obj_dist) ) {
        url = schemaItem('contentUrl', obj_dist)
    }
    encodingFormats = schemaItem('encodingFormat', obj_dist)

    // if (hasSchemaProperty('name',obj_dist)){
    //     name = schemaItem('name', obj_dist)
    // } else {
    //     if (encodingFormats && Array.isArray(encodingFormats))
    //     {
    //          name = encodingFormats[0]
    //     } else {
    //         name = 'None Provided'
    //     }
    // }
    // there can be multiple encoding formats.
    // cant send back an array, or could but would require some
    // handling in way response is handled
    if (Array.isArray(encodingFormats)) {
        for (let e=0 ; e < encodingFormats.length; e++ )
        {
            name = hasSchemaProperty('name',obj_dist)? schemaItem('name', obj_dist): encodingFormats[e];
            downloads.push ({
                    distType: name,
                    contentUrl: url,
                    encodingFormat: encodingFormats[e],
                    name: name,
                    linkName:encodingFormats[e]
                }
            )
        }
    } else {
        name = hasSchemaProperty('name',obj_dist)? schemaItem('name', obj_dist): encodingFormats;
        var linkName= ''
        if (_.isEmpty(encodingFormats)) {
             linkName= name
        } else {
             linkName= encodingFormats
        }
        downloads.push ({
            distType: name,
            contentUrl: url,
            encodingFormat: encodingFormats,
            name: name,
            linkName:linkName
        })
    }
    return downloads
}



//module.exports.getJsonLD = getJsonLD;
module.exports.schemaItem =schemaItem
module.exports.hasSchemaProperty =hasSchemaProperty
module.exports.geoplacename=geoplacename
module.exports.getFirstGeoShape=getFirstGeoShape
module.exports.getGeoCoordinates=getGeoCoordinates
module.exports.getDistributions=getDistributions
module.exports.makeLinkObj=makeLinkObj


//export { getJsonLD, schemaItem, hasSchemaProperty, getGeoCoordinates,geoplacename,getFirstGeoShape,getDistributions,makeLinkObj};

