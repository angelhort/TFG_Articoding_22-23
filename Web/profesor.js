const express = require("express");
const path = require("path");
const fs = require('fs');

const profesor = express.Router();

module.exports = function(daoI){
    profesor.use(express.static(path.join(__dirname, "public")));
    
    function comprobarUsuario(request, response, next){
        if(request.session.usuario)
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
    
    profesor.get("/getDatosResumen", function(request, response){
        daoI.getNameById(request.session.instituto, nombreInstituto);
        function nombreInstituto(err, nombre){
            if(err){
                //TODO pagina error 500
            }
            else{
                fs.readFile("./datos/" + nombre + "/plots/categoriasSuperadas.json", function(err, data){
                    if(err){
                        //TODO pagina error 500
                        console.log("No se puede leer archivo");
                    }
                    else{
                        const jsonData = JSON.parse(data);
                        response.json(jsonData);
                    }
                });
            }
        }
    });

    return profesor;
};