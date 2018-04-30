var five = require('johnny-five');
var events = require('events');
var set = require('../environment/general-settings.js');


var pins;
var pumpsInitialized = false;
var eventEmitter = new events.EventEmitter();
var pumps = [];
var pumpPins = [15,13,12,14];

var delayS = set.DelayS;
var delayM = set.DelayM;
var delayL = set.DelayL;

module.exports = {
    initialize: function(PumpParams){
        var index = 0;
        if(!pumpsInitialized){
            console.log('Initializing Pumps!');
            var interval = setInterval(function(){
                if(index<PumpParams.length){
                    var element = PumpParams[index];
                    pumps[index] = {
                        Id: index,
                        PinNr: pumpPins[index],
                        Pin: new five.Pin(pumpPins[index]),
                        Running: false,
                        LitersPerHour: element.LitersPerHour,
                        On: element.On
                    }
                    pumps[index].Pin.low();
                    pumps[index].Initialized = true;
                    console.log('Pump ' + index + ' has been initialized');
                    index++;
                } else  {
                    pumpsInitialized = true;
                    eventEmitter.emit('ready');
                    clearInterval(interval);
                }
            }, delayM);
        } else {
            setTimeout(function(){
                eventEmitter.emit('ready')
            }, delayM);
        }

        return eventEmitter;
    },
    startPump: function(Index){
        // Index is the Number of the pump that needs to be started
        if(!pumps[Index].Initialized){
            console.log('Please inizialize pump first');
            return null;
        }
        console.log('Starting Pump ' + Index + ' with Pin ' + pumps[Index].PinNr);
        if(pumps[Index].On){
            pumps[Index].Pin.high();
            pumps[Index].Running = true;
            pumps[Index].LastRun = new Date();
            eventEmitter.emit('pumpStarted', pumps);
        } else {
            console.log('Pump ' + Index + ' will not run, because it is tuned off');
        }

    },
    stopPump: function(Index){
        // Index is the Number of the pump that needs to be started
        if(!pumps[Index].Initialized){
            console.log('Please inizialize pump first');
            return null;
        }
        console.log('Stopping Pump ' + Index);
        pumps[Index].Pin.low();
        pumps[Index].Running = false;
        eventEmitter.emit('pumpStopped', pumps);
    },
    startPumpFor: function(Time, Index){
        if(!pumps[Index].Initialized){
            console.log('Please inizialize pump first');
            return null;
        }
        if(pumps[Index].On){
            module.exports.startPump(Index);
            setTimeout(function(){
                module.exports.stopPump(Index);
            }, Time);
        } else {
            console.log('Pump ' + Index + ' will not run, because it is tuned off');
        }

    },
    startPumpForMillilitres: function(Milliliters, Index){
        if(!pumps[Index].Initialized){
            console.log('Please inizialize pump first');
            return null;
        }
        if(pumps[Index].On){
            var runningTime = module.exports.calculateRunningTime(Milliliters, pumps[Index].LitersPerHour);
            console.log('Turning on Pump for ' + runningTime/1000 + ' seconds');
            module.exports.startPumpFor(runningTime, Index);
        } else {
            console.log('Pump ' + Index + ' will not run, because it is tuned off');
        }

    },
    calculateRunningTime(Milliliters, LitersPerHour){
        var millisecondsPerMillilitre = (3600)/(LitersPerHour);
        return Milliliters * millisecondsPerMillilitre;
    },
    getPumps: function(){
        if(!pumpsInitialized){
            return {
                err: "Pumps are not initialized yet"
            }
        } else {
            return pumps;
        }
    },
    getPumpMonitor: function(){
        if(!pumpsInitialized){
            return {
                err: "Pumps are not initialized yet"
            }
        } else {
            return eventEmitter;
        }
    }
}
