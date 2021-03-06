var events = require('events');
var five = require('johnny-five');
var set = require('./environment/general-settings.js');

var pinIds = [16,5,4,0];
var powerPins = [];
var sensor;
var emitDataFreq = 30000; //turning up the sensor freq seems to impact on its value. So here you can define, how often data is emitted
var lastEmitted = new Date();
var sensorCycleTime = .25 *60000;

var delayS = set.DelayS; //Usually too little time between two hardware actions (like turning on a pin) will make the actions not work. for this a delay is added to cylcles
var delayM = set.DelayM;
var delayL = set.DelayL;
var delayXL = set.DelayXL;

var analogPin = "A0"

var internalFunctions = {

}

var eventEmitter = new events.EventEmitter();


module.exports = {
    initialize: function(Options){
        // PowerPins are used later to just activate one moisture Sensor


        var index = 0;
        var intervalInit = setInterval(function(){
            if(index>0){
                powerPins[index-1].low();
            }
            if(index<Options.Sensors.length){
                console.log('Setting Sensor pin ' + pinIds[index]);
                powerPins.push(new five.Pin(pinIds[index]));
                index++;
            } else {
                clearInterval(intervalInit);
                setTimeout(function(){
                    console.log('pinsInitialized');
                    eventEmitter.emit('pinsInitialized');
                }, delayM);
            }
        },delayM);

        eventEmitter.on('pinsInitialized', function(){
            sensor = new five.Sensor({
                pin: analogPin,
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
        var moisture = [900,420];

        return 100-(Value-moisture[1])/(moisture[0]-moisture[1])*100;
    },
    startMoistureWatch: function(Options){
        // Options
            // Pin                    Pin the
            // WateringTime [ms]            Time water will be running
            // MinimumInterval [minutes]         Time water will stop between 2 WateringSystem

        var currentSensor = 0;
        console.log('Starting moisture watch');
        // Cycle through sensors

        setInterval(function(){
            while(!Options.Sensors[currentSensor].On){
                currentSensor = (currentSensor+1) % Options.Sensors.length;
                console.log('While statement: Current Sensor = ' + currentSensor);
            }
            module.exports.getMoisture(Options, currentSensor).then(Data => {
                eventEmitter.emit('data', Data);
            }).catch(Err => {
                console.log(Err)
            });
            currentSensor++;
        },sensorCycleTime);

        return eventEmitter;
    },
    getMoisture: function(Options, Index){
        Options = Options ? Options : {};
        var options = {
            Timeout : Options.Timeout ? Options.Timeout : 5*1000,
            WaitForDataAfterTurningOn: 2000
        };
        var started = new Date();

        return new Promise(function(res, rej){
            // Compare PowerPin of submitted sensor with the ones initialized;

            if(Index === null){
                return rej({
                    Code: 404,
                    Message: "MoistureSensor not found"
                });
            } else {
                // If the sensor is found turn it on, wait for the data send back the data and turn it off again
                console.log('Turning sensor on: ' + Index);
                powerPins[Index].high();

                var getTheData = function(){
                    setTimeout(function(){
                        sensor.once('data', function(){
                            var currentRaw = this.value;
                            var currentMoisture = module.exports.calculateMoisture(currentRaw);
                            if(!currentRaw){
                                if(new Date()-started > options.Timeout){
                                    return rej({
                                        Code: 408,
                                        Message: "Request Timeout. Couldn't get MoistureSensor Value"
                                    });
                                } else {
                                    getTheData()
                                }
                            } else {
                                setTimeout(function(){
                                    var output = {
                                        CurrentMoisture: currentMoisture,
                                        RawValue: currentRaw,
                                        Time: new Date(),
                                        SensorPin: "A" + sensor.pin,
                                        PowerPin: pinIds[Index],
                                        PowerPinIndex: Index,
                                        AttachedPump: Options.Sensors[Index].AttachedPump
                                    }
                                    sensor.removeListener('data', ()=>{
                                        console.log('Listener Removed');
                                    });
                                    setTimeout(function(){
                                        console.log('Turning sensor off: ' + Index);
                                        powerPins[Index].low();
                                        return res(output);
                                    }, delayM);
                                }, delayM);
                            }
                        });
                    }, delayM);
                };
                getTheData();
            }
        });
    }
}
