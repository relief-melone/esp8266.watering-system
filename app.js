var five = require('johnny-five');
var EtherPort = require('etherport-client').EtherPortClient;
var Testing = require('./testing.js');
var MoistureWatch = require('./moisture-watch.js');
var WateringWatch = require('./watering.js');
var Logger = require('./excel-logger.js');
var PumpWatch = require('./pump.js');
var dns = require('dns');

// ESP8266 thats controlling the watering system
var hostName = 'ESP_AC6CB1';
var espWater;
var WateringSystem;

var moistureSensorParams = {
    Sensors: [
        {
            PowerPin: 16,
            AttachedPump: 0
        },
        {
            PowerPin: 5,
            AttachedPump: 0
        }
    ],
    AnalogPin: "A0"
};
var wateringParams = {
    MlPerWatering: 250,
    MinimumMoisture: 35,
    MinimumInterval: 10000
};
var pumpParams = {
    pumps : [
        {
            Pin: 13,            //You only set one Pin as the Pump can only rotate in one direction
            LitersPerHour: 110,
        }
    ]
}
var startTime = new Date();
console.log('Starting up!');
dns.lookup(hostName, function(err, result){
    if(!err){
        espWater = new EtherPort({
            host: result, port: 8181
        });

        WateringSystem = new five.Board({
            port: espWater,
            repl: false,
            timeout: 1e5,
        });
    } else {
        console.log('ERROR CONNECTING TO BOARD!');
        console.log(err);
        return null;
    }

    WateringSystem.on('ready', function() {
        console.log('Board ready after ' + (new Date() - startTime)/1000 + ' seconds' );

        // Initialize the moisture sensors
        console.log('|-----|  Initializing moisture sensors');
        var sensorsInitialized = MoistureWatch.initialize(moistureSensorParams);

        sensorsInitialized.on('ready', function(){
            console.log('|||---| Initializing moisture monitor');
            var moistureMonitor = MoistureWatch.startMoistureWatch(moistureSensorParams);
            var pumpsMonitor;
            var wateringMonitor;

            // Start the moisture monitor when moisture monitor sends data for the first time;
            moistureMonitor.once('data', function(){
                console.log('|||||-| Initializing pump watch');
                pumpsMonitor = PumpWatch.startPumpWatch(pumpParams);

                // Feed the moisture monitor to the watering;
                pumpsMonitor.on('ready', function(){
                    wateringMonitor = WateringWatch.startWateringMonitoring(moistureMonitor, pumpsMonitor, wateringParams);

                    // Turn on moisture logging
                    console.log('||||||| Starting logger');
                    Logger.logMoisture(moistureMonitor);
                    Logger.initialize({
                        creator : 'Christian de Biasi',
                        created : new Date()
                    });

                    // Turn on the pump watch
                    wateringMonitor.on('wateringNeeded',function(data){
                        // console.log('Watering Plant');
                        PumpWatch.startPumpForMillilitres(wateringParams.MlPerWatering, data.PumpIndex, pumpParams);
                    });
                });
            });
        });
    });
});
