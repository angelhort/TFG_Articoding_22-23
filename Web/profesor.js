const express = require("express");
const path = require("path");

const profesor = express.Router();
profesor.use(express.static(path.join(__dirname, "public")));

function comprobarUsuario(request, response, next){
    if(request.session.usuario)
        next();
    else
        response.redirect("/login");
}

profesor.use(comprobarUsuario);

profesor.get("/resumen", function(request, response){
    var spawn = require('child_process').spawn;
    var process = spawn('python', ['./datos/script.py', "escolapias"]);
    process.stdout.on('data', function (data) {
        console.log(data.toString());
    });
    response.render("resumen")
});

profesor.get("/categorias", function(request, response){
    response.render("categorias")
});

profesor.get("/comparativa", function(request, response){
    response.render("comparativa")
});

module.exports = profesor;