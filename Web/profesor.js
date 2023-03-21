const express = require("express");
const path = require("path");
const fs = require('fs');

const profesor = express.Router();

module.exports = function(dataPath){
    profesor.use(express.static(path.join(__dirname, "public")));
    
    function comprobarUsuario(request, response, next){
        if(request.session.usuario && request.session.rol == "profesor")
            next();
        else
            response.redirect("/login");
    }
    
    profesor.use(comprobarUsuario);


    profesor.get("/resumen", function(request, response){
        response.render("resumen")
    });
    
    profesor.get("/categorias", function(request, response){
        response.render("categorias")
    });
    
    profesor.get("/comparativa", function(request, response){
        response.render("comparativa")
    });

    profesor.get("/alumnos", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/jugadores.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo");
            }
            else{
                const infoAlumnos = JSON.parse(data);
                var page = parseInt(request.query.page) || 1;
                var start = (page-1) * 10;
                var end = start + 10;
                var infoAlumnosArray = Object.entries(infoAlumnos).map(function(entry) {
                    return entry[1];
                });
                response.render("alumnos", {"infoAlumnos" : infoAlumnosArray.slice(start, end), "nAlumnos" : infoAlumnosArray.length})
            }
        });  
    });
    
    profesor.get("/getDatosResumen", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/categoriasSuperadas.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData);
            }
        });      
    });

    profesor.get("/getTiempoCategoria/:categoria", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/" + request.params.categoria + "_Tiempo(s).json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData);
            }
        });      
    });

    profesor.get("/getIntentosCategoria/:categoria", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/" + request.params.categoria + "_Intentos.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData);
            }
        });      
    });

    profesor.get("/getComparativaCategorias", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/porcentajeCategorias.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData);
            }
        });      
    });

    profesor.get("/getTiempoCategoriaComparativa/:categoria", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/" + request.params.categoria + "_mediaTiemposComparativa.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData);
            }
        });      
    });

    return profesor;
};