var axios = require('axios')
const https = require('https')
var S3_BASE ='http://gleaner.oss.geodex.org/summoned'

exports.getDataset =async function(uri) {
//var url = new URL(toolArk); //adding ?  or ?? to ark returns some info  eg http://n2t.net/ark:/23942/g2600027??
    var parts = uri.split(':')
//urn:gleaner:milled:magic:c164daaca4ae58122d76ec48ecae1c1c45819fcf
    var url =`${S3_BASE}/${parts[3]}/${parts[4]}.jsonld`

    const agent = new https.Agent({
        rejectUnauthorized: false
    });
    const config = {
    url: url,
    method: 'get',
    maxRedirects: 5,
    // headers: {
    //     'Accept': 'application/xhtml+xml',
    //     'Content-Type': 'application/xhtml+xml'
    // },
    crossDomain: true,
    httpsAgent: agent


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
