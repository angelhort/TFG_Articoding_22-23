const express = require("express");
const path = require("path");
const fs = require('fs');

const admin = express.Router();

module.exports = function(dataPath){
    admin.use(express.static(path.join(__dirname, "public")));

    function comprobarUsuario(request, response, next){
        if(request.session.usuario)
            next();
        else
            response.redirect("/login");
    }
    admin.use(comprobarUsuario);
    //PR(15/03) La ruta inicial es /, profesor envía a resumen
    admin.get("/",function(request,response) {
        response.render("general")
    });

    admin.get("/general", function(request,response){
        response.render("general")
    });

    admin.get("/cuentas", function(request,response){
        response.render("cuentas")
    });

    admin.get("/rutas", function(request,response){
        response.render("rutas")
    });
    
    return admin;
};