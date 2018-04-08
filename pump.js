var five = require('johnny-five');
var events = require('events');


var pins;
var pumpInitialized = false;
var eventEmitter = new events.EventEmitter();
var pumps = [];

module.exports = {
    startPumpWatch: function(PumpParams){
        PumpParams.pumps.forEach(function(element, index){
            pumps[index] = {
                Id: index,
                PinNr1: element.Pin1,
                PinNr2: element.Pin2,
                Pin1: new five.Pin(element.Pin1),
                Pin2: new five.Pin(element.Pin2),
                Running: false
            };
            pumps[index].Pin1.low();
            pumps[index].Pin2.low();
            pumps[index].Initialized = true;
            console.log('Pump ' + index + ' has been initialized');
        });
        return eventEmitter;
    },
    startPump: function(Index){
        // Index is the Number of the pump that needs to be started
        if(!pumps[Index].Initialized){
            console.log('Please inizialize pump first');
            return null;
        }
        console.log('Starting Pump ' + Index);
        pumps[Index].Pin1.high();
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
        pumps[Index].Pin1.low();
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
    }
}
