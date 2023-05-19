"use strict"

const fs = require("fs");

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

    cambiarNombreNiveles(text, language){
        try{
            const data = fs.readFileSync("./languages/" + language + ".json",{ encoding: 'utf8', flag: 'r' });
            const nombres = JSON.parse(data);
            const niveles = nombres.nombreNiveles;
            var outputText = JSON.stringify(text);
            for (const key in niveles) {
                const regex = new RegExp(key, "gi");
                outputText = outputText.replaceAll(regex, niveles[key]);
            }
            return JSON.parse(outputText);
        }
        catch(err){
            return text;
        }
    }

    cambiarNombreNiveles_SoloValores(json, language) {
        try {
          const data = fs.readFileSync(`./languages/${language}.json`, { encoding: 'utf8', flag: 'r' });
          const nombres = JSON.parse(data);
          const niveles = nombres.nombreNiveles;
      
          const replaceValues = (obj) => {
            for (const key in obj) {
              if (typeof obj[key] === 'object') {
                replaceValues(obj[key]);
              } else if (typeof obj[key] === 'string') {
                for (const levelKey in niveles) {
                  const regex = new RegExp(levelKey, "gi");
                  obj[key] = obj[key].replace(regex, niveles[levelKey]);
                }
              }
            }
          };
      
          const clonedJson = JSON.parse(JSON.stringify(json));
          replaceValues(clonedJson);
      
          return clonedJson;
        } catch (err) {
          return json;
        }
    }
}

module.exports = utils;