var https = require('https');

var ws = {
	host: 'ws.ovh.com',
	port: 443,
	path: '/dedicated/r2/ws.dispatcher/getAvailability2'
};


var freeId = process.argv[2];
var freeKey = process.argv[3];
var product = process.argv[4];

for (var i = 0; i <= 4; i++) {
	if (typeof process.argv[i] == 'undefined'){
		console.error(	"Usage   : node main.js freeId   freeKey        product\n"+
						"Exemple : node main.js 42442466 vTC8uGXO1Iy9Fk 160sk1"); 
		return;
	}
};


var freeWs = {
	host: 'smsapi.free-mobile.fr',
	port: 443,
	path: '/sendmsg?user='+freeId+'&pass='+freeKey+'&msg='
};

function onServerAvailable(zones){
	var msg = product+' is available now, zones : '+zones.join(', '); 

	freeWs.path += msg;
	https.get(freeWs, function(res) {
		if (res.statusCode != 200){
			console.log('Free fail with statusCode '+res.statusCode);
		}
	});

	console.log(new Date()+' | '+msg);
}

function onOvhResponse(data)
{
	var availabilities = data.answer.availability;
	for(var i= 0; i < availabilities.length; i++)
	{
		var availability = availabilities[i];
		var availabileZones = [];
		if (availability.reference === product){
			for(var i= 0; i < availability.zones.length; i++){
				var metazone = availability.zones[i];
				if (metazone.availability != 'unavailable' && metazone.availability != 'unknown'){
					availabileZones.push(metazone.zone);
				}
			}
			if (availabileZones.length){
				onServerAvailable(availabileZones);
				return true;
			}
		}
	}
	return false;
}

function makeOvhRequest(){
	https.get(ws, function(res) { 
		if(res.statusCode == 200){
			var data = '';
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				var success = onOvhResponse(JSON.parse(data));
				if (success){
					setTimeout(makeOvhRequest, 21600000); // Retry in 6 hours
				}
				else{
					setTimeout(makeOvhRequest, 10000); // Retry in 10 seconds
				}
			});
		}
		else{
			console.log("Bad response: " + res.statusCode);
			setTimeout(makeOvhRequest, 1800000); // Retry in 30 minutes
		}
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		setTimeout(makeOvhRequest, 60000); // Retry in 1 minute
	});
}
makeOvhRequest();

