const express = require("express");
const path = require("path");
const fs = require('fs');
const config = require("./config");
const mysql = require("mysql");
const DAOUsuario = require("./DAO/DAOUsuario");
const DAOInstituto = require("./DAO/DAOInstituto");

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);
const daoU = new DAOUsuario(pool);
const daoI = new DAOInstituto(pool);
const admin = express.Router();

module.exports = function(dataPath){
    console.log(dataPath)
    admin.use(express.static(path.join(__dirname, "public")));

    function comprobarUsuario(request, response, next){
        if(request.session.usuario && request.session.rol == "admin")
            next();
        else
            response.redirect("/login");
    };

    function validarContrasena(contrasena) {
        const expresionRegular = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        return expresionRegular.test(contrasena);
    };

    admin.use(comprobarUsuario);
    //PR(15/03) La ruta inicial es /, profesor envía a resumen
    admin.get("/",function(request,response) {
        response.render("general");
    });

    admin.get("/general", function(request,response){
        response.render("general");
    });
    
    admin.get("/cuentas/nuevoUsuario",function(request,response){
        daoI.getAllInstitutos(actualizarUsuario);
        function actualizarRoles(error, institutos){
            if (error){
                response.status(500);
                response.render("cuentas");
            }
            else{
                daoU.getAllRoles(actualizarUsuario);
            }
        }
        function actualizarUsuario(error,institutos,roles){
            if (error){
                response.status(500);
                response.render("cuentas");
            }
            else{
                response.status(200);
                response.render("crearUsuario",{"institutos": institutos, "roles":roles});
            }
        }
    });

    admin.post("/cuentas/nuevoUsuario",function(request,response){
        daoU.insertarUsuario(request.body.usuario,request.body.contrasenia,request.body.rol,request.body.instituto,insertarUsuario);
        function insertarUsuario(error,usuario){
            if (error){
                response.status(500);
                response.render("cuentas");
            }
            else{
                response.status(200);
                response.render("general");
            }
        }
    });

    admin.get("/cuentas", function(request,response){
        daoU.getAllUsers(mostrarUsuarios);
        function mostrarUsuarios(error,usuarios) {
            if(error){
                response.status(500);
                response.render("general");
            }
            else if (usuarios){
                //TODO obtener lista de nombre de usuarios
                response.render("cuentas", {"usuarios" : usuarios});
            }
        }
    });

    admin.get("/cuentas/:nombre",function(request,response){

        daoU.getUserDetail(request.params.nombre,mostrarUsuario);
        function mostrarUsuario(error,usuario) {
            if (error){
                response.status(500);
                response.render("cuentas");
            }
            else{
                response.render("cuentaDetallada",{"usuario": usuario});
            }
        }   
    });

    admin.post("/cuentas/:nombre",function(request,response){
        var variable = JSON.parse(request.body.usuario);
        if(validarContrasena(request.body.contrasenia)){
            
            daoU.updateUser(request.params.nombre,request.body.usuario,request.body.contrasenia,mostrarUsuario);
            function mostrarUsuario(error,usuario) {
                if (error) {
                    response.status(500);
                    response.render("cuentas");
                } else {
                    response.status(200);
                    response.render("general", { mensajeError: "" });
                }
            }   
        }
        else {
            // Enviar mensaje de error en la respuesta HTTP
            response.status(400).send("La contraseña no es válida");
        }
        
    });



    admin.get("/rutas", function(request,response){
        response.render("rutas")
    });


    
    return admin;
};