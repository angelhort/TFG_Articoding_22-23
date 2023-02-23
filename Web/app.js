"use strict"

const config = require("./config");
const express = require("express");
const path = require("path");

const app = express();
const profesor = require("./profesor");
app.use("/profesor", profesor);

const ficherosEstaticos = path.join(__dirname, "public");
app.use(express.static(ficherosEstaticos));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/login", function(request, response){
    response.render("login")
});

app.listen(config.port, function(err) {
    if (err) {
        console.log("ERROR al iniciar el servidor");
    }
    else {
        console.log(`Servidor arrancado en el puerto ${config.port}`);
    }
});