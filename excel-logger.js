var Excel = require('exceljs');


var workbook = new Excel.Workbook();
var startDate = new Date();
var filename = './logs/Log' + startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + '.xlsx';
var logParams = {
    MinutesPerSave: 1,
    LastSaved : new Date('1900/01/01')
}


module.exports = {
    initialize : function(Options){
        for(var option in Options){
            workbook[option] = Options.option;
        }
    },
    logMoisture: function(DataEH){
        // DataEH is the event handler that sends out data;
        var sheetInfo = {

        }
        DataEH.on('data', function(Data){
            var sheetname = 'Sensor'+ Data.PowerPinIndex;
            if(!workbook.getWorksheet(sheetname)){
                var currentWorksheet = workbook.addWorksheet(sheetname);
                currentWorksheet.addRow([
                    'Time', ' Moisture', 'Raw Value', 'PowerPin'
                ]);
                currentWorksheet.addRow([
                    Data.Time, Data.CurrentMoisture, Data.RawValue, Data.PowerPin
                ]);
                sheetInfo[sheetname] = {
                    CurrentRow: 0
                }
            } else {
                var currentWorksheet = workbook.getWorksheet(sheetname);
                currentWorksheet.addRow([
                    Data.Time, Data.CurrentMoisture, Data.RawValue, Data.PowerPin
                ]);
            }
            if(new Date()- logParams.LastSaved>logParams.MinutesPerSave*60000){
                workbook.xlsx.writeFile(filename);
                logParams.LastSaved = new Date();
                console.log('Log saved: ' + logParams.LastSaved.toGMTString());
            }
        });
    }
}
