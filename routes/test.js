const routes = require('express').Router();
var bodyparser = require('body-parser');
var board = require('../services/jf-control/service.board.js');
var sensors = require('../services/jf-control/service.sensors.js');

routes.get('/', (req, res) => {
    var WateringSystem = board.getBoard();
    console.log(WateringSystem.port);
    res.status(200).json({
        Id: WateringSystem.id }
    );
});

module.exports = routes
