var five = require('johnny-five');
var EtherPort = require('etherport-client').EtherPortClient;
var MoistureWatch = require('./moisture-watch.js');
var WateringWatch = require('./watering.js');
var Logger = require('./excel-logger.js');
var PumpWatch = require('./pump.js');
var dns = require('dns');
var app = require('express')();
var bodyParser = require('body-parser');

var http = require('http').Server(app);
var io = require('socket.io')(http);

// Routes
var routesInit = require('./routes/initialize.js')(io);
var routesTest = require('./routes/test.js');

var generalSettings = require('./environment/general-settings.js');
// ESP8266 thats controlling the watering system

var hostName = generalSettings.BoardHostName;
var moistureSensorParams = generalSettings.MoistrureSensorParameters;
var wateringParams = generalSettings.WateringParameters;
var pumpParams = generalSettings.PumpParameters;

var startTime = new Date();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

io.on('connection', (socket)=>{
    console.log('a user connected');
    socket.on('disconnect', ()=>{
        console.log('user disconnected');
    });
});

app.use('/', routesInit);
app.get('/index', (req,res)=>{
    res.sendFile(__dirname + '/index.html');
});

module.exports = {
    io: function(){
        return io;
    }
}

http.listen('3000', ()=>{
    console.log('Backend Server running on port 3000');
});




// app.use('/testing', routesTest);


//
// console.log('Starting up!');
// dns.lookup(hostName, function(err, result){
//
//     if(err){
//         console.log('ERROR CONNECTING TO BOARD!');
//         console.log(err);
//         return null;
//
//     } else {
//         var espWater = new EtherPort({
//             host: result, port: 8181
//         });
//
//         var WateringSystem = new five.Board({
//             port: espWater,
//             repl: false,
//             timeout: 1e5,
//         });
//
//         WateringSystem.on('ready', function() {
//             console.log('Board ready after ' + (new Date() - startTime)/1000 + ' seconds' );
//
//             // Initialize the moisture sensors
//             console.log('|-----|  Initializing moisture sensors');
//             var sensorsInitialized = MoistureWatch.initialize(moistureSensorParams);
//
//             sensorsInitialized.on('ready', function(){
//                 console.log('|||---| Initializing moisture monitor');
//                 var moistureMonitor = MoistureWatch.startMoistureWatch(moistureSensorParams);
//                 var pumpsMonitor;
//                 var wateringMonitor;
//
//                 // Start the moisture monitor when moisture monitor sends data for the first time;
//                 moistureMonitor.once('data', function(){
//                     console.log('|||||-| Initializing pump watch');
//                     pumpsMonitor = PumpWatch.startPumpWatch(pumpParams);
//
//                     // Feed the moisture monitor to the watering;
//                     pumpsMonitor.on('ready', function(){
//                         wateringMonitor = WateringWatch.startWateringMonitoring(moistureMonitor, pumpsMonitor, wateringParams);
//
//                         // Turn on moisture logging
//                         console.log('||||||| Starting logger');
//                         Logger.logMoisture(moistureMonitor);
//                         Logger.initialize({
//                             creator : 'Christian de Biasi',
//                             created : new Date()
//                         });
//
//                         moistureMonitor.on('data', function(Data){
//                             console.log('Data from MoistrueWatch');
//                             console.log(Data)
//                         });
//
//                         // Turn on the pump watch
//                         wateringMonitor.on('wateringNeeded',function(data){
//                             // console.log('Watering Plant');
//                             PumpWatch.startPumpForMillilitres(wateringParams.MlPerWatering, data.PumpIndex, pumpParams);
//                         });
//                     });
//                 });
//             });
//         });
//     }
// });
