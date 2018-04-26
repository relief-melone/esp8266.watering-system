var five        = require('johnny-five');
var EtherPort   = require('etherport-client').EtherPortClient;
var dns         = require('dns');
var initialized = false;
var WateringSystem;

module.exports = {
    intialize: (HostName, Port) =>{
        return new Promise(function(res, rej){
            dns.lookup(HostName, function(err, result){
                if(err){
                    return rej(err);
                } else {
                    var espWater = new EtherPort({
                        host: result, port: Port
                    });

                    WateringSystem = new five.Board({
                        port: espWater,
                        repl: false,
                        timeout: 1e5,
                    });

                    WateringSystem.on('ready', ()=>{
                        initialized = true;
                        res({
                            msg: "Board Initialized!",
                            WateringSystem: WateringSystem
                        });
                    });
                }
            });
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
    }
}
