var five = require('johnny-five');
var events = require('events');
var set = require('./environment/general-settings.js');


var pins;
var pumpInitialized = false;
var eventEmitter = new events.EventEmitter();
var pumps = [];

var delayS = set.DelayS;
var delayM = set.DelayM;
var delayL = set.DelayL;

module.exports = {
    startPumpWatch: function(PumpParams){
        var index = 0;
        var interval = setInterval(function(){
            if(index<PumpParams.pumps.length){
                var element = PumpParams.pumps[index];
                pumps[index] = {
                    Id: index,
                    PinNr: element.Pin,
                    Pin: new five.Pin(element.Pin),
                    Running: false
                }
                pumps[index].Pin.low();
                pumps[index].Initialized = true;
                console.log('Pump ' + index + ' has been initialized');
                index++;
            } else  {
                eventEmitter.emit('ready');
                clearInterval(interval);
            }
        }, delayM);
        return eventEmitter;
    },
    startPump: function(Index){
        // Index is the Number of the pump that needs to be started
        if(!pumps[Index].Initialized){
            console.log('Please inizialize pump first');
            return null;
        }
        console.log('Starting Pump ' + Index + ' with Pin ' + pumps[Index].PinNr);
        pumps[Index].Pin.high();
        pumps[Index].Running = true;
        pumps[Index].LastRun = new Date();
        eventEmitter.emit('pumpStarted', pumps);

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
        module.exports.startPump(Index);
        setTimeout(function(){
            module.exports.stopPump(Index);
        }, Time);
    },startPumpForMillilitres: function(Milliliters, Index, PumpParams){
        if(!pumps[Index].Initialized){
            console.log('Please inizialize pump first');
            return null;
        }
        module.exports.startPump(Index);
        var runningTime = module.exports.calculateRunningTime(Milliliters, PumpParams.pumps[Index].LitersPerHour);
        console.log('Turning on Pump for ' + runningTime/1000 + ' seconds');
        setTimeout(function(){
            module.exports.stopPump(Index);
        }, runningTime);
    },
    calculateRunningTime(Milliliters, LitersPerHour){
        var millisecondsPerMillilitre = (3600)/(LitersPerHour);
        return Milliliters * millisecondsPerMillilitre;
    }
}
