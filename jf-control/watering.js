// This module will determine weather a plant needs to be watered or not

var events = require('events');
var five = require('johnny-five');
var monitorInitialized = false;
var pumpStatus;
var eventEmitter;
var options;

module.exports = {
    startWateringMonitoring: function(SensorInput, PumpInput, Options){
        // SensorInput EventEmitter from the moisture watch
        // Options includes the Values for MinimunInterval between two waterings, MinimumMoisture-Level, etc.

        options = Options;
        console.log(options);
        if(!monitorInitialized){
            var wateringInfo = [];
            eventEmitter = new events.EventEmitter();

            SensorInput.on('data', function(data){
                // console.log(data)
                var output =  {
                    SensorIndex: data.PowerPinIndex,
                    PumpIndex: data.AttachedPump,
                    Time: new Date()
                };
                if(!pumpStatus){
                    // If no pumpStatus is yet available, then no pump has run yet. You can start watering
                    if(options.MinimumMoisture > data.CurrentMoisture){

                        console.log("Watering of Plant with Sensor " + output.SensorIndex + ' needed!');
                        console.log(output);
                        eventEmitter.emit('wateringNeeded', output);
                    }
                } else {
                    // If a pumpStatus is available, make sure the pump is not already running

                    if(options.MinimumMoisture > data.CurrentMoisture && !pumpStatus[data.AttachedPump].Running && new Date() - pumpStatus[data.AttachedPump].LastRun > options.MinimumInterval){
                        eventEmitter.emit('wateringNeeded', output);
                        console.log("Watering of Plant with Sensor " + output.SensorIndex + ' needed!');
                        console.log(output);
                    }
                }
            });
            PumpInput.on('pumpStarted', function(data){
                pumpStatus = data;
            });
            monitorInitialized = true;
        }

        return eventEmitter;
    },
    getWateringMonitor: function(){
        if(!monitorInitialized){
            return {
                err: "Watering Monitor has not been initialized"
            }
        } else {
            return eventEmitter;
        }
    }
}
