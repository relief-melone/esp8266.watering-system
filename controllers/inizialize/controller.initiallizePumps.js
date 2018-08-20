const board = require('../../services/jf-control/service.board.js');
const sensors = require('../../services/jf-control/service.sensors.js');
const pumps = require('../../services/jf-control/service.pumps.js');


const initPumps = (req, res) => {
    let WateringSystem = board.getBoard();
    let Sensors = sensors.getSensors();

    if(!req.body.Pumps){
        res.status(400).json({
            message: "No pumps provided"
        });
    }
    var Pumps = pumps.initialize(typeof(req.body.Pumps) === 'string' ? JSON.parse(req.body.Pumps) : req.body.Pumps);

    Pumps.once('ready', ()=>{
        res.status(200).json({
            message: 'Pumps initialized'
        });
    });
}

module.exports = initPumps;