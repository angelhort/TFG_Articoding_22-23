"use strict"

class utils{
    constructor() {
    }
    
    parseTiempoASeg (time) {
        var seconds = 0;
        time.split("/").forEach(e =>{
            var l = e.charAt(e.length - 1);
            e = e.slice(0, -1);
            if(l == "h"){
            seconds += parseInt(e)*3600; 
            }
            else if(l == "m"){
            seconds += parseInt(e)*60;
            }
            else{
            seconds += parseInt(e);
            }
        });
        return seconds;
    }

    pasarSegATiempo(seg){
        var hours = Math.floor(seg / 3600);
        var minutes = Math.floor((seg - (hours * 3600)) / 60);
        var remainingSeconds = seg - (hours * 3600) - (minutes * 60);
    
        var timeArray = [];
        if (hours > 0) {
        timeArray.push(hours + 'h');
        }
        if (minutes > 0) {
        timeArray.push(minutes + 'm');
        }
        if (remainingSeconds > 0 || timeArray.length === 0) {
        timeArray.push(remainingSeconds + 's');
        } 
        return timeArray.join('/');
    }
}

module.exports = utils;