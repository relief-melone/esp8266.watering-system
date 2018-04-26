module.exports = {
    DelayS: 150,
    DelayM: 500,
    DelayL: 1000,
    DelayXL: 2000,
    MaxBoardConnectionAttepmts: 5,

    WateringParameters: {
        MlPerWatering: 250,
        MinimumMoisture: 35,
        MinimumInterval: 10000
    },

    PumpParameters: {
        pumps : [
            {
                Pin: 13,            //You only set one Pin as the Pump can only rotate in one direction
                LitersPerHour: 110,
            }
        ]
    },

    // new Pumps Parameter for REST-API
    Pumps : [
        {
            LitersPerHour: 110,
            On: true
        }
    ],

    // new Sensors Parameter for REST-API
    Sensors: [
        {
            AttachedPump: 0,
            On: true
        },
        {
            AttachedPump: 0,
            On: true
        },
        {
            AttachedPump: 0,
            On: false
        },
        {
            AttachedPump: 0,
            On: false
        }
    ],

    // The Backend will take up to 4 sensors (max. of the board)
    MoistrureSensorParameters: {
        Sensors: [
            {
                AttachedPump: 0,
                On: true
            },
            {
                AttachedPump: 0,
                On: true
            },
            {
                AttachedPump: 0,
                On: false
            },
            {
                AttachedPump: 0,
                On: false
            }
        ]
    },

    BoardHostName : 'ESP_AC6CB1'
}
