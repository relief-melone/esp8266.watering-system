const routes = require('express').Router();
var bodyparser = require('body-parser');
var board = require('../jf-control/board.js');
var sensors = require('../jf-control/sensors.js');
var pumps = require('../jf-control/pumps.js');
var watering = require('../jf-control/watering.js');


var boardInitialized = false;
var sensorsInitialized = false;
var pumpsInitiliazied = false;
var wateringWatchRunnung = false;
var dns = require('dns');

var WateringSystem;

module.exports = function(io){
    routes.get('/', (req, res) => {
      res.status(200).json({ message: 'Connected!' });
    });

    routes.post('/initialize/Board', (req, res) => {
        // Check post request
        // Required Host and Port

        var data = req.body;
        // The System will check if it should connect via ip or hostname (the hostname cannot be resolved in all networks)
        var system = data.Ip ? board.initialize(null, data.Port, data.Ip) : board.initialize(data.Hostname, data.Port);
        system.then(Data => {
            res.status(200).json({
                message: Data.msg
            });
        }).catch(Data =>{
            res.status(505).json({
                message: "Couldn't connect to board"
            });
            console.log(Data);
        });

    });

    routes.post('/initialize/Sensors', (req, res)=>{
        // Get the intitialized board

        var WateringSystem = board.getBoard();
        // If board is not ready, complain
        if(WateringSystem.err){
            res.status(400).json({
                message: "Board not ready"
            });
        } else {
            var data = req.body;
            // Check if the data by the user is correct
            if(!data.Sensors){
                res.status(400).json({message: "You didn't provide any sensors"})
            } else {
                // Intialize the sensors
                console.log(data.Sensors);
                var sensorInit = sensors.initialize().then(()=>{
                    var moistureWatch = sensors.startMoistureWatch(JSON.parse(data.Sensors));
                    moistureWatch.on('data', (Data)=>{
                        io.emit('sensor-data', Data);
                    });
                    res.status(200).json({
                        message: "Sensors initialized"
                    })
                }).catch((err)=>{
                    res.status(505).json(err);
                });
            }
        }
    });

    routes.post('/initialize/pumps', (req, res) => {
        var WateringSystem = board.getBoard();
        var Sensors = sensors.getSensors();

        if(!req.body.Pumps){
            res.status(400).json({
                message: "No pumps provided"
            });
        }

        var Pumps = pumps.initialize(JSON.parse(req.body.Pumps));
        Pumps.on('ready', ()=>{
            res.status(200).json({
                message: 'Pumps initialized'
            });
        });

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
        var WateringParameters = JSON.parse(req.body.WateringParameters);
        var WateringMonitor = watering.startWateringMonitoring(MoistureWatch, PumpMonitor, WateringParameters);
        WateringMonitor.on('wateringNeeded', function(data){
            io.emit('watering needed', data);
            pumps.startPumpForMillilitres(WateringParameters.MlPerWatering, data.PumpIndex);
        });
        res.status(200).json({
            message: "Watering Monitor has successfully been started"
        });
    });

    return routes;
}
