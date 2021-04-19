var axios = require('axios')


exports.getTool =async function(toolArk) {
//var url = new URL(toolArk); //adding ?  or ?? to ark returns some info  eg http://n2t.net/ark:/23942/g2600027??
 var ark = toolArk.substr(toolArk.indexOf('ark:'))
 var arkurl = ark.replace(':/','_').replace(':','_').replace('/', "_")   // https://object.cloud.sdsc.edu/v1/AUTH_85f46aa78936477d8e71b186269414e8/gleaner-summoned
    //    ecrr_form/ark_23942_g,20g98.json
   // var url = 'https://object.cloud.sdsc.edu/v1/AUTH_85f46aa78936477d8e71b186269414e8/gleaner-summoned/ecrr_form/ark_23942_g20g98.json'
//var url = toolArk
    var url = `https://object.cloud.sdsc.edu/v1/AUTH_85f46aa78936477d8e71b186269414e8/gleaner-summoned/ecrr_form/${arkurl}.json`
    const config = {
    url: url,
    method: 'get',
    maxRedirects: 5,
    // headers: {
    //     'Accept': 'application/xhtml+xml',
    //     'Content-Type': 'application/xhtml+xml'
    // },
    crossDomain: true,


}
    return axios.request(config
    ).then(
        //const content = await rawResponse.json();
        function (r) {

            //: https://drive.google.com/file/d/1jV0uTRwBGLcYt_tP0KLN-8eC-wiDqXdg/view?usp=drivesdk]
            return r.data

        }
    )
}
