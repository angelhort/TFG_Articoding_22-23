const express = require("express");
const path = require("path");
const fs = require('fs');
const config = require("./config");
const mysql = require("mysql");

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

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
        fs.readFile(dataPath + request.session.instituto + "/datosMedios.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo RESUMEN");
            }
            else{
                const datosMedios = JSON.parse(data);
                response.render("resumen", {"medias" : datosMedios["general"]})
            }
        });
    });
    
    profesor.get("/categorias", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/info.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo CATEGORIAS");
            }
            else{
                const info = JSON.parse(data);
                fs.readFile(dataPath + request.session.instituto + "/jugadores.json", function(err, dataJ){
                    if(err){
                        //TODO pagina error 500
                        console.log("No se puede leer archivo CATEGORIAS");
                    }
                    else{
                        const infoJ = JSON.parse(dataJ);
                        response.render("categorias", {"info" : info, "jugadores" : infoJ});
                    }
                });
            }
        });
    });
    
    profesor.get("/comparativa", function(request, response){

        fs.readFile(dataPath + request.session.instituto + "/info.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo COMPARATIVA");
            }
            else{
                const info = JSON.parse(data);
                response.render("comparativa", {"info" : info})
            }
        });
    });

    profesor.get("/alumnos", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/jugadores.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo ALUMNOS");
            }
            else{
                const infoAlumnos = JSON.parse(data);
                var page = parseInt(request.query.page) || 1;
                var start = (page-1) * 10;
                var end = start + 10;
                var infoAlumnosArray = Object.entries(infoAlumnos).map(function(entry) {
                    return entry[1];
                });
                response.render("alumnos", {"infoAlumnos" : infoAlumnosArray.slice(start, end), "nAlumnos" : infoAlumnosArray.length, "page" : page})
            }
        });  
    });
    
    profesor.get("/getDatosResumen", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/categoriasSuperadas.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo DATOS_RESUMEN");
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
                console.log("No se puede leer archivo TIEMPO_CATEGORIA");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData);
            }
        });      
    });

    profesor.get("/getMediasCategoria/:categoria", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/datosMedios.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo MEDIAS_CATEGORIA");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData[request.params.categoria]);
            }
        });      
    });

    profesor.get("/getIntentosCategoria/:categoria", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/plots/" + request.params.categoria + "_Intentos.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo INTENTOS_CATEGORIA");
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
                console.log("No se puede leer archivo COMPARATIVA_CATEGORIAS");
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
                console.log("No se puede leer archivo TIEMPO_CATEGORIA_COMPARATIVA");
            }
            else{
                const jsonData = JSON.parse(data);
                response.json(jsonData);
            }
        });      
    });

    profesor.post("/cambiarNombreAlumno", function(request, response){
        pathFichero = dataPath + request.session.instituto + "/jugadores.json";
        fs.readFile(pathFichero, function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo CAMBIAR_NOMBRE_ALUMNO");
            }
            else{
                const infoAlumnos = JSON.parse(data);
                
                var alumno;
                var repetido = false;
                for(var a in infoAlumnos){
                    if(infoAlumnos[a]["nombre"] === request.body.nombreAntiguo){
                        alumno = a
                    }
                    if(infoAlumnos[a]["nombre"] === request.body.nombre){
                        repetido = true;
                        break;
                    }
                }

                if(!repetido){
                    infoAlumnos[alumno]["nombre"] = request.body.nombre;
                    fs.writeFile(pathFichero, JSON.stringify(infoAlumnos), function(err){
                        if(err){
                            //TODO pagina error 500
                            console.log("No se puede escribir el archivo");
                        }else{
                            
                        }
                    });
                }
            }
        });
    });

    return profesor;
};