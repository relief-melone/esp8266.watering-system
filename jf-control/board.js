var five        = require('johnny-five');
var EtherPort   = require('etherport-client').EtherPortClient;
var dns         = require('dns');
var initialized = false;
var WateringSystem;

module.exports = {
    initialize: (HostName, Port, Ip) =>{

        return new Promise(function(res, rej){
            if(Ip){
                WateringSystem = module.exports.initializeBoard(Ip, Port);
                WateringSystem.on('ready', ()=>{
                    initialized = true;
                    res({
                        msg: "Board Initialized!",
                        WateringSystem: WateringSystem
                    });
                });
            } else {
                dns.lookup(HostName, function(err, result){
                    if(err){
                        return rej(err);
                    } else {
                        WateringSystem = module.exports.initializeBoard(result, Port)
                        WateringSystem.on('ready', ()=>{
                            initialized = true;
                            res({
                                msg: "Board Initialized!",
                                WateringSystem: WateringSystem
                            });
                        });
                    }
                });
            }

        });
    },
    getBoard: () =>{
        if(!initialized){
            return {
                err: "Board has not been initialized yet"
            }
        } else {
            return WateringSystem;
        }
    },
    initializeBoard: function(Ip, Port){
        console.log('Connecting to Board IP:' + Ip +' Port:'+ Port);
        var espWater = new EtherPort({
            host: Ip, port: Port
        });
        console.log(espWater);
        WateringSystem = new five.Board({
            port: espWater,
            repl: false,
            timeout: 1e5,
        });
        return WateringSystem;
    }

}
