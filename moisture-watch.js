var events = require('events');
var five = require('johnny-five');
var set = require('./environment/general-settings.js');

var powerPins = [];
var sensor;
var emitDataFreq = 30000; //turning up the sensor freq seems to impact on its value. So here you can define, how often data is emitted
var lastEmitted = new Date();
var sensorCycleTime = 1*60000;

var delayS = set.DelayS; //Usually too little time between two hardware actions (like turning on a pin) will make the actions not work. for this a delay is added to cylcles
var delayM = set.DelayM;
var delayL = set.DelayL;

module.exports = {
    initialize: function(Options){
        // PowerPins are used later to just activate one moisture Sensor
        var eventEmitter = new events.EventEmitter();

        var index = 0;
        var intervalInit = setInterval(function(){
            if(index<Options.Sensors.length){
                console.log('Setting Sensor pin ' + Options.Sensors[index].PowerPin);
                powerPins.push(new five.Pin(Options.Sensors[index].PowerPin));
                index++;
            } else {
                console.log('Turning on initial Sensor');
                powerPins[0].high();
                clearInterval(intervalInit);
                setTimeout(function(){
                    console.log('pinsInitialized');
                    eventEmitter.emit('pinsInitialized');
                }, delayM);
            }
        },delayM);

        eventEmitter.on('pinsInitialized', function(){
            sensor = new five.Sensor({
                pin: Options.AnalogPin,
                freq: 250,
                type: "analog"
            });
            setTimeout(function(){
                // console.log(powerPins);
                eventEmitter.emit('ready', powerPins);
            },delayM);
        });
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
        console.log('Starting moisture watch');
        // Cycle through sensors
        setInterval(function(){
            var index = 0;
            currentSensor = (currentSensor + 1) % powerPins.length;
            var interval = setInterval(function(){
                if(index<powerPins.length){
                    if(index !== currentSensor){
                        powerPins[index].low();
                        console.log('MoistureWatch: Turning off Sensor ' + index + ' on pin: ' + Options.Sensors[index].PowerPin);
                    }
                    index++;
                } else {
                    console.log('MoistureWatch: Turning on Sensor ' + currentSensor + ' on pin: ' + Options.Sensors[currentSensor].PowerPin);
                    clearInterval(interval);
                    powerPins[currentSensor].high();
                    setTimeout(function(){
                        eventEmitter.emit('sensorSwitched');
                    }, delayM);
                }
            },delayM);
        },sensorCycleTime);

        var watering = false;
        var plantHasBeenWatered = false;
        var lastTimeWatered = new Date();

        sensor.on('data', function() {
            var currentRaw = this.value;
            var currentMoisture = module.exports.calculateMoisture(currentRaw);
            if(new Date() - lastEmitted > emitDataFreq){
                if(!currentRaw){
                    console.log("There is a problem with the data from the moisture Sensor");
                    lastEmitted = new Date();
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
