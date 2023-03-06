"use strict"

const config = require("./config");
const DAOUsuario = require("./DAO/DAOUsuario")
const DAOInstituto = require("./DAO/DAOInstituto")

const express = require("express");
const mysql = require("mysql");
const path = require("path");
const session = require("express-session")
const bodyParser = require("body-parser");
const mysqlSession = require("express-mysql-session");
const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: "localhost",
    user: "root",
    password: "",
    database: "Articoding"
});


const app = express();

app.use(session({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false,
    store: sessionStore
}));

const pool = mysql.createPool(config.mysqlConfig);
const daoU = new DAOUsuario(pool);
const daoI = new DAOInstituto(pool);

const ficherosEstaticos = path.join(__dirname, "public");
app.use(express.static(ficherosEstaticos));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* -------------------------------------------------------------------------- */

const profesor = require("./profesor")(daoI);
app.use("/profesor", profesor);

app.get("/login", function(request, response){
    response.render("login")
});

app.post("/login", function(request, response){
    daoU.isUserCorrect(request.body.usuario, request.body.contrasenia, usuarioCorrecto);
    function usuarioCorrecto(error, ok, usuario){
        if(error){
            response.status(500);
            response.render("login");
            //TODO añadir pagina error 500
        }
        else if(ok){
            request.session.usuario = usuario.nombre;
            request.session.instituto = usuario.instituto;

            var spawn = require('child_process').spawn;
            var process = spawn('python', ['./datos/script.py', "escolapias"]);
            process.stdout.on('data', function (data) {
                console.log(data.toString());
                response.redirect("/profesor/resumen");
        
            });
            process.stderr.on('data', function (data) {
                console.error(data.toString());
                response.redirect("/profesor/resumen");
            });
            process.on('error', function (error) {
                console.error(error.toString());
                response.redirect("/profesor/resumen");
            });
                
           
        } else{
            response.status(200);
            response.render("login",
                {errorMsg:"Email y/0 contraseña no válidos"});
        }
    }
});

app.listen(config.port, function(err) {
    if (err) {
        console.log("ERROR al iniciar el servidor");
    }
    else {
        console.log(`Servidor arrancado en el puerto ${config.port}`);
    }
});