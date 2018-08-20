const routes = require('express').Router();
var board = require('../services/jf-control/service.board.js');
var sensors = require('../services/jf-control/service.sensors.js');
var pumps = require('../services/jf-control/service.pumps.js');
var watering = require('../services/jf-control/service.watering.js');

var wateringParameters;

var wateringWatchRunning = false;

const intializeController = require('../controllers/controller.intitialize');

module.exports = function(io){
    routes.get('/', (req, res) => {
      res.status(200).json({ message: 'Connected!' });
    });

    routes.post('/initialize/Board', (req, res) => {
        intializeController.initBoard(req, res);
    });

    routes.post('/initialize/Sensors', (req, res)=>{
        req.io = io;
        intializeController.initSensors(req, res);
    });

    routes.post('/initialize/pumps', (req, res) => {
      intializeController.initPumps(req, res);
    });

    routes.post('/initialize/watering', (req, res) => {
        var WateringSystem = board.getBoard();
        var MoistureWatch = sensors.getMoistureWatch();
        var PumpMonitor = pumps.getPumpMonitor();

        if(!req.body.WateringParameters){
            res.status(400).json({
                message: "no watering paremeters supplied"
            });
        }
        wateringParameters = typeof(req.body.WateringParameters)==='string' ? JSON.parse(req.body.WateringParameters) : req.body.WateringParameters;
        var WateringMonitor = watering.startWateringMonitoring(MoistureWatch, PumpMonitor, wateringParameters);
        if(!wateringWatchRunning){
            console.log('Routes/initialize: Watering Monitor initializing')
            WateringMonitor.on('wateringNeeded', function(data){
                if(wateringParameters.On){
                    io.emit('watering needed', data);
                    pumps.startPumpForMillilitres(data.MlPerWatering, data.PumpIndex);
                }
            });
            res.status(200).json({
                message: "Watering Monitor has successfully been started"
            });
            wateringWatchRunning = true
        } else {
            console.log('Routes/initialize: Watering Monitor has already been started')
            res.status(200).json({
                message: "Watering Monitor has already been started. Updated parameters"
            });
        }

    });

    return routes;
}
