module.exports = {
    Blinking : function(IntervalTime, Led){
        var on = false;
        setInterval(function(){
            if(!on){
                Led.high();
                on = true;
            } else {
                Led.low();
                on = false;
            }
        },IntervalTime);
    }
}
