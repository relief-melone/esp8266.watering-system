const dns           = require('dns');
const initialize    = require('./service.board.initialize');
let initialized     = false;
let WateringSystem;


async function WateringOnReady (Ip, Port) {
    return new Promise((resolve, reject) => {
        WateringSystem = initialize(Ip, Port)
        WateringSystem.on('ready', () => {
            initialized = true;
            resolve({
                msg: "Board Initialized!",
                WateringSystem: WateringSystem
            });
        });
    });    
}


async function connect (HostName, Port, Ip) {
    if(initialized){
        return({
            msg: "Board Initialized!",
            WateringSystem
        });
    } else {
        return new Promise(async (resolve, reject) => {
            if((!HostName && !Ip) || !Port) reject({
                msg: "Board not initialized!"
            });
            if(Ip){
                let result = await WateringOnReady(Ip, Port);
                return result;
            } else {
                dns.lookup(HostName, async function(err, Ip){
                    if(err){
                        return reject(err);
                    } else {
                        let result = await WateringOnReady(Ip, Port);
                        return result;
                    }
                });
            }
        });
    }
}

module.exports = connect;