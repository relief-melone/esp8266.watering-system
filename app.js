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
            PowerPin: 0,
            AttachedPump: 0
        },
        {
            PowerPin: 16,
            AttachedPump: 0
        }
    ],
    AnalogPin: "A0"
};
var wateringParams = {
    WateringTime: 2000,
    MinimumMoisture: 35,
    MinimumInterval: 10000
};
var pumpParams = {
    pumps : [
        {
            Pin1: 5,
            Pin2: 4
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
    }

    WateringSystem.on('ready', function() {
        console.log('Board ready');

        var sensorsInitialized = MoistureWatch.initialize(moistureSensorParams);
        sensorsInitialized.on('ready', function(){

            var moistureMonitor = MoistureWatch.startMoistureWatch(moistureSensorParams);
            var pumpsMonitor = PumpWatch.startPumpWatch(pumpParams);
            // Feed the moisture monitor to the watering;
            var wateringMonitor = WateringWatch.startWateringMonitoring(moistureMonitor, pumpsMonitor, wateringParams);

             // Logging
             Logger.initialize({
                 creator : 'Christian de Biasi',
                 created : new Date()
             });
             Logger.logMoisture(moistureMonitor);

            wateringMonitor.on('wateringNeeded',function(data){
                // console.log('Watering Plant');
                PumpWatch.startPumpFor(wateringParams.WateringTime, data.PumpIndex);
            });
        });
    });
})
