"use strict"
var dataPath = './datos/'

const config = require("./config");
const DAOUsuario = require("./DAO/DAOUsuario")
const DAOExperimento = require("./DAO/DAOExperimento")


const express = require("express");
const mysql = require("mysql");
const path = require("path");
const session = require("express-session")
const bodyParser = require("body-parser");
const fs = require('fs');
const mysqlSession = require("express-mysql-session");
const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: "localhost",
    user: "root",
    password: "",
    database: "Articoding"
});

const acceptLanguage = require('accept-language-parser');
const defaultLanguage = "es";
const bcrypt = require("bcrypt");


const app = express();

app.use(session({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false,
    store: sessionStore
}));

const pool = mysql.createPool(config.mysqlConfig);
const daoU = new DAOUsuario(pool);
const daoE = new DAOExperimento(pool);

const ficherosEstaticos = path.join(__dirname, "public");
app.use(express.static(ficherosEstaticos));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* -------------------------------------------------------------------------- */

const admin = require('./admin')(dataPath,daoU,daoE);
app.use("/admin",admin);
const profesor = require("./profesor")(dataPath, daoU);
app.use("/profesor", profesor);

app.get("/login", function(request, response){
    var language = acceptLanguage.parse(request.headers['accept-language'])[0].code;
    if(!fs.existsSync("./languages/" + language + ".json")){
        language = defaultLanguage;
    }
    fs.readFile("./languages/" + language + ".json", function(err, idioma){
        if(err){
            //TODO pagina error 500
            console.log("No se puede leer archivo IDIOMA");
        }
        else{
            const idiomaJSON = JSON.parse(idioma);
            response.render("login", {"errorMsg" : false, "texto" : idiomaJSON.login});
        }
    });
});

app.get("/logout", function(request, response){
    request.session.destroy();

    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
    
    response.redirect("/login");
});

/*
    CIFRAR CONTRASENIAS 
    const saltRounds = 10;
    const plaintextPassword = 'password123';

    bcrypt.hash(plaintextPassword, saltRounds, function(err, hash) {
    console.log(hash);
    });
*/

app.post("/login", function(request, response){
    daoU.getUser(request.body.usuario, usuarioCorrecto);
    function usuarioCorrecto(error, ok, usuario){
        if(error){
            response.status(500);
            response.render("login");
            //TODO añadir pagina error 500
        }
        else if(ok){
            bcrypt.compare(request.body.contrasenia, usuario.contrasenya, function(err, result) {
                if (result === true) {
                    request.session.usuario = usuario.nombre;
                    request.session.rol = usuario.rol;
                    request.session.idProf = usuario.id;
                    
                    if (usuario.rol == "profesor"){
                        response.redirect('/profesor/')
                    }
                    else if (usuario.rol == "admin"){
                        response.redirect('/admin/general');
                    }
                } else {
                    var language = acceptLanguage.parse(request.headers['accept-language'])[0].code;
                    if(!fs.existsSync("./languages/" + language + ".json")){
                        language = defaultLanguage;
                    }
                    fs.readFile("./languages/" + language + ".json", function(err, idioma){
                        if(err){
                            //TODO pagina error 500
                            console.log("No se puede leer archivo IDIOMA");
                        }
                        else{
                            const idiomaJSON = JSON.parse(idioma);
                            response.status(200);
                            response.render("login", {"errorMsg": true, "texto" : idiomaJSON.login});
                        }
                    });
                }
            });         
        }
    }
});

app.get("/getUserName", function(request, response){
    response.json({"nombre" : request.session.usuario ? request.session.usuario : null});
});

app.use(function(request, response){
    response.status(404);
    response.render("404");
});

app.listen(config.port, function(err) {
    if (err) {
        console.log("ERROR al iniciar el servidor");
    }
    else {
        console.log(`Servidor arrancado en el puerto ${config.port}`);
    }
});