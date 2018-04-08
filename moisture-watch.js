var events = require('events');
var five = require('johnny-five');

var sensor;
var powerPins = [];
var emitDataFreq = 2000; //turning up the sensor freq seems to impact on its value. So here you can define, how often data is emitted
var lastEmitted = new Date();
var sensorCycleTime = 1*60000;

module.exports = {
    initialize: function(Options){
        // PowerPins are used later to just activate one moisture Sensor
        Options.Sensors.forEach(function(sensor, index){
            powerPins.push(new five.Pin(sensor.PowerPin));
        });
        var eventEmitter = new events.EventEmitter();

        // The sensor Values will always pass throug a single analog pin and sensor
        sensor = new five.Sensor({
            pin: Options.AnalogPin,
            freq: 250
        });

        powerPins.forEach(function(powerPin, index){
            if(index !==0){
                powerPins[index].low();
                console.log('MoistureWatch: Turning off Sensor ' + index + ' on pin: ' + Options.Sensors[index].PowerPin);
            } else {
                console.log('Turning on Sensor 0');
                powerPins[0].high();
            }
        });
        // powerPins[0].high();

        setTimeout(function(){
            console.log('Moisture Sensors have been initialized');
            eventEmitter.emit('ready');
        },200);

        return eventEmitter;
    },
    calculateMoisture: function(Value){
        // Sensor will provide a value between 0-1024 while 1024 is completely dry. Competely soaked soil will not be 0 however. This function will return a value
        // between 0 (comepletely dry) and 100 (completely soaked)
        var moisture = [900,420]

        return 100-(Value-moisture[1])/(moisture[0]-moisture[1])*100;
    },
    startMoistureWatch: function(Options){
        // Options
            // Pin                    Pin the
            // WateringTime [ms]            Time water will be running
            // MinimumInterval [minutes]         Time water will stop between 2 WateringSystem

        var eventEmitter = new events.EventEmitter();
        var currentSensor = 0;

        // Cycle through sensors
        setInterval(function(){
            currentSensor = (currentSensor + 1) % powerPins.length;
            powerPins.forEach(function(powerPin, index){
                console.log('Current Sensor Index: '+ currentSensor +'; CurrentIndex: '+ index);
                if(index !== currentSensor){
                    console.log('MoistureWatch: Turning off Sensor ' + index + ' on pin: ' + Options.Sensors[index].PowerPin);
                    powerPins[index].low();
                } else {
                    powerPins[index].high();
                    console.log('MoistureWatch: Turning on Sensor ' + index + ' on pin: ' + Options.Sensors[index].PowerPin);
                }
            });



        },sensorCycleTime);

        var watering = false;
        var plantHasBeenWatered = false;
        var lastTimeWatered = new Date();

        sensor.on('data', function() {
            var currentRaw = this.value;
            var currentMoisture = module.exports.calculateMoisture(currentRaw);
            if(new Date() - lastEmitted > emitDataFreq){
                if(!currentRaw){
                    // console.log("There is a problem with the data from the moisture Sensor");
                } else {
                    var output = {
                        CurrentMoisture: currentMoisture,
                        RawValue: currentRaw,
                        Time: new Date(),
                        SensorPin: Options.AnalogPin,
                        PowerPin: Options.Sensors[currentSensor].PowerPin,
                        PowerPinIndex: currentSensor,
                        BelowMoistureMinimum: currentMoisture<Options.MinimumMoisture,
                        AttachedPump: Options.Sensors[currentSensor].AttachedPump
                    }
                    eventEmitter.emit('data', output);
                    lastEmitted = new Date();
                    // console.log(output);
                    }
                }

            // var currentInterval = new Date() - lastTimeWatered;
            // // All conditions ok
            // if(currentMoisture<options.MinimumMoisture && !watering && currentInterval>options.MinimumInterval){
            //     // Reset watering and the last Time watered
            //     watering = true;
            //     lastTimeWatered = new Date();
            //
            //     eventEmitter.emit('startWatering');
            //     setTimeout(function(){
            //         eventEmitter.emit('stopWatering');
            //         watering = false;
            //         plantHasBeenWatered = true;
            //     }, options.WateringTime);
            //
            // // Plant is already watering
            // } else if (watering){
            //     console.log('Already watering');
            // // Plant has already been watered in less than the MinimumInterval
            // } else if (currentInterval<options.MinimumInterval && plantHasBeenWatered){
            //     console.log('Aldready watered the plant ' + currentInterval/60000 + 'minutes ago.' )
            // }
        });
        return eventEmitter;
    }
}
