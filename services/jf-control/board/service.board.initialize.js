var five        = require('johnny-five');
var EtherPort   = require('etherport-client').EtherPortClient;
var WateringSystem;


function initialize(Ip, Port){
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

module.exports = initialize;