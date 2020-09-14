var unirest = require('unirest');
var forge = require('node-forge');
var key = process.argv[2];
var user = process.argv[3];
var name = process.argv[4];

function getSignature(text) {
    var hmac = forge.hmac.create();
    hmac.start('sha1', key);
    hmac.update(forge.util.encodeUtf8(JSON.stringify(text)));
    var hash = hmac.digest().toHex();
    var sig = new Buffer(hash, 'hex').toString('base64');
    console.log('sig: ', sig);
    return sig;
}

function getStationId() {
    data = {
	"coordinateType": "EPSG_4326",
	"maxList": '1',
	"theName": {
	    "name": name,
	    "type": "STATION"
	}
    };
    var sig = getSignature(data);
    unirest.post('https://gti.geofox.de/gti/public/checkName')
    .headers({
          'Content-Type': 'application/json;charset=UTF-8',
          'geofox-auth-user': user,
          'geofox-auth-signature': sig
    })
    .send(JSON.stringify(data))
    .end(function (response) {
    if (response.error) { console.log("Error: ", response.error); }
    else {
    console.log("ID: ", response.body.results[0].id);
    }
    });
}

getStationId();
