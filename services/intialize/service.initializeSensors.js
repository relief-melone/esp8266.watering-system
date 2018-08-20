let board = require('../jf-control/service.board');

const initSensors = () => {
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
                var moistureWatch = sensors.startMoistureWatch(typeof(data.Sensors) === 'string' ? JSON.parse(data.Sensors) : data.Sensors);
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
}

module.exports = initSensors;