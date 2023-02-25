const express = require("express");
const path = require("path");

const profesor = express.Router();
profesor.use(express.static(path.join(__dirname, "public")));

profesor.get("/resumen", function(request, response){
    response.render("resumen")
});

profesor.get("/categorias", function(request, response){
    response.render("categorias")
});

module.exports = profesor;