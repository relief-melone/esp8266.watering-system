var five = require('johnny-five');
var EtherPort = require('etherport-client').EtherPortClient;
var MoistureWatch = require('./moisture-watch.js');
var WateringWatch = require('./watering.js');
var Logger = require('./excel-logger.js');
var PumpWatch = require('./pump.js');
var dns = require('dns');

var generalSettings = require('./environment/general-settings.js');

// ESP8266 thats controlling the watering system



var hostName = generalSettings.BoardHostName;
var moistureSensorParams = generalSettings.MoistrureSensorParameters;
var wateringParams = generalSettings.WateringParameters;
var pumpParams = generalSettings.PumpParameters;

var startTime = new Date();
console.log('Starting up!');
dns.lookup(hostName, function(err, result){

    if(err){
        console.log('ERROR CONNECTING TO BOARD!');
        console.log(err);
        return null;

    } else {
        var espWater = new EtherPort({
            host: result, port: 8181
        });

        var WateringSystem = new five.Board({
            port: espWater,
            repl: false,
            timeout: 1e5,
        });

        WateringSystem.on('ready', function() {
            console.log('Board ready after ' + (new Date() - startTime)/1000 + ' seconds' );
            // Initialize the moisture sensors
            console.log('|-----|  Initializing moisture sensors');
            var sensorsInitialized = MoistureWatch.initialize(moistureSensorParams);

            sensorsInitialized.on('ready', function(){
                var sensor = generalSettings.MoistrureSensorParameters.Sensors[0];
                var index = 0;
                setInterval(function(){
                    var moisture = MoistureWatch.getMoisture(sensor, null, index);
                    moisture.then(Data =>{
                        console.log('Received data of run ' + index);
                        console.log(Data);
                    }).catch(err=>{
                        console.log('Error');
                        console.log(err.Message);
                    });
                },4000)

            });
        });
    }
});
