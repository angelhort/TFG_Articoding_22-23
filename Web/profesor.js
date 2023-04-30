const express = require("express");
const path = require("path");
const fs = require('fs');

const profesor = express.Router();

module.exports = function(dataPath, daoU){
    profesor.use(express.static(path.join(__dirname, "public")));
    
    function comprobarUsuario(request, response, next){
        if(request.session.usuario && request.session.rol == "profesor")
            next();
        else{
            request.session.destroy();
            response.redirect("/login");
        }
    }
    
    profesor.use(comprobarUsuario);

    profesor.get("/", function(request, response){
        daoU.getInstitutosProf(request.session.idProf, selectInstituto);
        function selectInstituto(err, institutos){
            if(err){
                //TODO pagina error 500
                console.log("No se encuentran institutos");
            }
            else{
                const institutosKeys = Object.keys(institutos);
                const dataToSend = [];

                for (const key of institutosKeys) {
                    const instituto = institutos[key];
                    fs.readFile(dataPath + instituto.id + "/info.json", function (err, data) {
                        if (err) {
                            dataToSend.push({
                                "nombre": instituto.nombre,
                            });
                        } else {
                            const info = JSON.parse(data);
                            dataToSend.push({
                                "id" : instituto.id,
                                "nombre": instituto.nombre,
                                "fecha": info.fechaSesion,
                                "jugadores": info.nJugadores
                            });
                            if (dataToSend.length === institutosKeys.length) {
                                var idsInstitutos = [];
                                institutos.forEach((inst, i) => {
                                    idsInstitutos.push(inst.id);
                                });
                                request.session.institutos = idsInstitutos;
                                dataToSend.sort((a,b) => {
                                    const nombreA = a.nombre.toUpperCase();
                                    const nombreB = b.nombre.toUpperCase();
                                    if (nombreA < nombreB) {
                                        return -1;
                                    }
                                    if (nombreA > nombreB) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                response.render("clases", { "institutos": dataToSend });
                            }
                        }
                    });
                }
            }
        }
    });

    profesor.get("/generarDatos/:instituto", function(request, response){
                
        if(request.session.institutos.includes(Number(request.params.instituto))){
            request.session.instituto = request.params.instituto;
            if(!fs.existsSync(dataPath + "/" + request.session.instituto + "/plots")){
                var spawn = require('child_process').spawn;
                var process = spawn('python', [dataPath + "script.py", request.session.instituto]);
                process.stdout.on('data', function (data) {
                    fs.readFile(dataPath + request.session.instituto + "/jugadores.json", function(err, data){
                        if(err){
                            //TODO pagina error 500
                            console.log("No se puede leer archivo");
                        }
                        else{
                            const infoAlumnos = JSON.parse(data);
                            var infoAlumnosArray = Object.entries(infoAlumnos).map(function(entry) {
                                return entry[1];
                            });
                            /*daoA.aniadirAlumnosBD(infoAlumnosArray, request.session.instituto, usuariosIntroducidos); 
                            function usuariosIntroducidos(err){
                                if(err){
                                    console.log(err)
                                }
                                else{
                                    response.redirect('/profesor/resumen');
                                }
                            }*/
                            response.redirect('/profesor/resumen');
                        }
                    });                    
                });
                process.stderr.on('data', function (data) {
                    console.error(data.toString());
                    response.redirect('/profesor/resumen');
                });
                process.on('error', function (error) {
                    console.error(error.toString());
                    response.redirect('/profesor/resumen');
                });
            }
            else{
                response.redirect('/profesor/resumen');
            }
        }
        else{
            request.session.destroy();
            response.redirect("/login");
        }
    });
    
    profesor.get("/resumen", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/datosMedios.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo RESUMEN");
            }
            else{
                fs.readFile(dataPath + request.session.instituto + "/jugadores.json", function(err, jugadores){
                    if(err){
                        //TODO pagina error 500
                        console.log("No se puede leer archivo RESUMEN");
                    }
                    else{
                        const datosMedios = JSON.parse(data);
                        const nJugadores = Object.keys(JSON.parse(jugadores)).length;
                        response.render("resumen", {"medias" : datosMedios["general"], "nJugadores" : nJugadores})
                    }
                });
            }
        });
    });

    profesor.get("/avisos", function(request, response){
        response.render("errores");
    });

    profesor.get("/avisos/participantes", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/errores" + request.query.concepto + ".json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo ERRORES");
            }
            else{
                const errores = JSON.parse(data);
                fs.readFile(dataPath + request.session.instituto + "/info.json", function(err, data){
                    if(err){
                        //TODO pagina error 500
                        console.log("No se puede leer archivo ERRORES");
                    }
                    else{
                        const info = JSON.parse(data);
                        fs.readFile(dataPath + request.session.instituto + "/jugadores.json", function(err, data){
                            if(err){
                                //TODO pagina error 500
                                console.log("No se puede leer archivo ERRORES");
                            }
                            else{
                                const jugadores = JSON.parse(data);
                                for(var j in jugadores){
                                    var i = info.niveles.findIndex(e => (e.charAt(0).toUpperCase() + e.slice(1)).replaceAll("_", " ") == jugadores[j].ultNivel);
                                    if(j in errores){
                                        jugadores[j].mediaErroresVar = parseFloat((errores[j].length / (i - 9)).toFixed(2));
                                    }
                                    else{
                                        jugadores[j].mediaErroresVar = 0;
                                    }
                                }
                                var jugadoresData = Object.values(jugadores).sort((a, b) => b.mediaErroresVar - a.mediaErroresVar);
                                response.render("erroresAlumnos" , {"jugMasErr" : jugadoresData, "erroresJugadores" : errores});
                            }
                        });
                    }
                });
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

    profesor.get("/participantes", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/jugadores.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo ALUMNOS");
            }
            else{
                const infoAlumnos = JSON.parse(data);
                var infoAlumnosArray = Object.entries(infoAlumnos).map(function(entry) {
                    return entry[1];
                });
                response.render("alumnos", {"infoAlumnos" : infoAlumnosArray, "nAlumnos" : infoAlumnosArray.length})
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

    profesor.get("/getErroresAlumnos/:concepto", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/errores" + request.params.concepto +".json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo ERRORES");
            }
            else{
                const errores = JSON.parse(data);
                fs.readFile(dataPath + request.session.instituto + "/info.json", function(err, data){
                    if(err){
                        //TODO pagina error 500
                        console.log("No se puede leer archivo ERRORES");
                    }
                    else{
                        const info = JSON.parse(data);
                        var fallosTodosNiveles = info["nErrores" + request.params.concepto].slice();
                        fallosTodosNiveles.sort((a,b) =>{
                            var levelNameA = Object.keys(a)[0];
                            var levelNameB = Object.keys(b)[0];
                            return info.niveles.indexOf(levelNameA) - info.niveles.indexOf(levelNameB);
                        });

                        fs.readFile(dataPath + request.session.instituto + "/jugadores.json", function(err, data){
                            if(err){
                                //TODO pagina error 500
                                console.log("No se puede leer archivo ERRORES");
                            }
                            else{
                                const jugadores = JSON.parse(data);
                                for(var j in jugadores){
                                    var i = info.niveles.findIndex(e => (e.charAt(0).toUpperCase() + e.slice(1)).replaceAll("_", " ") == jugadores[j].ultNivel);
                                    if(j in errores){
                                        jugadores[j].mediaErroresVar = parseFloat((errores[j].length / (i - 9)).toFixed(2));
                                    }
                                    else{
                                        jugadores[j].mediaErroresVar = 0;
                                    }
                                }
                                var jugadoresData = Object.values(jugadores).sort((a, b) => b.mediaErroresVar - a.mediaErroresVar);
                                response.json({"jugadores" : jugadoresData.slice(0,7), "niveles" : info["nErrores" + request.params.concepto].slice(0,7), "fallosTodosNiveles" : fallosTodosNiveles});
                            }
                        });
                    }
                });
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
                            response.end();
                        }
                    });
                }
            }
        });
    });

    profesor.get("/getNiveles", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/info.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo INFO");
            }
            else{
                const info = JSON.parse(data);
                response.json({"niveles" : info.niveles});
            }
        });      
    });

    return profesor;
};