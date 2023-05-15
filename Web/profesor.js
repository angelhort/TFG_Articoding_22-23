const express = require("express");
const path = require("path");
const fs = require('fs');
const utils = require('./utils')

const profesor = express.Router();
const bcrypt = require("bcrypt");
const acceptLanguage = require('accept-language-parser');
const defaultLanguage = "es";

const util = new utils();

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
                                "id" : instituto.id,
                                "nombre": instituto.nombre
                            });
                            if (dataToSend.length === institutosKeys.length){
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
                                        response.render("clases", { "institutos": dataToSend, "texto" : idiomaJSON.sesiones });
                                    }
                                });
                            }
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
                                        response.render("clases", { "institutos": dataToSend, "texto" : idiomaJSON.sesiones });
                                    }
                                });
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
                        var language = acceptLanguage.parse(request.headers['accept-language'])[0].code;
                        if(!fs.existsSync("./languages/" + language + ".json")){
                            language = "en";
                        }
                        fs.readFile("./languages/" + language + ".json", function(err, idioma){
                            if(err){
                                //TODO pagina error 500
                                console.log("No se puede leer archivo IDIOMA");
                            }
                            else{
                                const idiomaJSON = JSON.parse(idioma);
                                response.render("resumen", {"medias" : datosMedios["general"], "nJugadores" : nJugadores, "texto" : {"resumen" : idiomaJSON.resumen, "comun" : idiomaJSON.comun}})
                            }
                        });
                    }
                });
            }
        });
    });

    profesor.get("/avisos", function(request, response){
        var language = acceptLanguage.parse(request.headers['accept-language'])[0].code;
        if(!fs.existsSync("./languages/" + language + ".json")){
            language = "en";
        }
        fs.readFile("./languages/" + language + ".json", function(err, idioma){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo IDIOMA");
            }
            else{
                const idiomaJSON = JSON.parse(idioma);
                response.render("errores", {"texto" : {"avisos" : idiomaJSON.avisos, "comun" : idiomaJSON.comun}})
            }
        });
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
                                var language = acceptLanguage.parse(request.headers['accept-language'])[0].code;
                                if(!fs.existsSync("./languages/" + language + ".json")){
                                    language = "en";
                                }
                                fs.readFile("./languages/" + language + ".json", function(err, idioma){
                                    if(err){
                                        //TODO pagina error 500
                                        console.log("No se puede leer archivo IDIOMA");
                                    }
                                    else{
                                        const idiomaJSON = JSON.parse(idioma);
                                        response.render("erroresAlumnos" , {"jugMasErr" : jugadoresData, "erroresJugadores" : errores, "texto" : {"avisosAlumnos" : idiomaJSON.avisosAlumnos, "comun" : idiomaJSON.comun}});
                                    }
                                });
                                
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
                        var language = acceptLanguage.parse(request.headers['accept-language'])[0].code;
                        if(!fs.existsSync("./languages/" + language + ".json")){
                            language = "en";
                        }
                        fs.readFile("./languages/" + language + ".json", function(err, idioma){
                            if(err){
                                //TODO pagina error 500
                                console.log("No se puede leer archivo IDIOMA");
                            }
                            else{
                                const idiomaJSON = JSON.parse(idioma);
                                response.render("categorias", {"info" : info, "jugadores" : infoJ, "texto" : {"categorias" : idiomaJSON.categorias, "comun" : idiomaJSON.comun}});
                            }
                        });
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
                var language = acceptLanguage.parse(request.headers['accept-language'])[0].code;
                    if(!fs.existsSync("./languages/" + language + ".json")){
                        language = "en";
                    }
                    fs.readFile("./languages/" + language + ".json", function(err, idioma){
                        if(err){
                            //TODO pagina error 500
                            console.log("No se puede leer archivo IDIOMA");
                        }
                        else{
                            const idiomaJSON = JSON.parse(idioma);
                            response.render("comparativa", {"info" : info, "texto" : {"comparativa" : idiomaJSON.comparativa, "comun" : idiomaJSON.comun}});
                        }
                    });
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
                fs.readFile(dataPath + request.session.instituto + "/tiemposIntentosJugador.json", function(err, data){
                    if(err){
                        //TODO pagina error 500
                        console.log("No se puede leer archivo TIEMPO ALUMNOS");
                    }
                    else{
                        const tiempoAlumnos = JSON.parse(data);
                        var infoAlumnosArray = Object.entries(infoAlumnos).map(function(entry) {
                            return entry[1];
                        });
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
                                response.render("alumnos" , {"infoAlumnos" : infoAlumnosArray, "nAlumnos" : infoAlumnosArray.length, "tiempoAlumnos" : tiempoAlumnos, "texto" : {"alumnos" : idiomaJSON.alumnos, "comun" : idiomaJSON.comun}});
                            }
                        });
                    }
                });
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

    profesor.get("/getDetallesNivelAlumno/:idAlumno", function(request, response){
        fs.readFile(dataPath + request.session.instituto + "/tiemposIntentosJugador.json", function(err, data){
            if(err){
                //TODO pagina error 500
                console.log("No se puede leer archivo DETALLES NIVEL ALUMNO");
            }
            else{
                const info = JSON.parse(data);
                const idA = request.params.idAlumno;
                var niveles = []
                var tiempos = []
                var intentos = []
                for(var n in info.tiempo[idA]){
                    var passed = false;
                    var int = 0;
                    var seg = 0;
                    info.tiempo[idA][n].forEach((e, i) =>{
                        if(e.stars > 0 && !passed){
                            levelName = n.replaceAll("_", " ");
                            niveles.push(levelName.charAt(0).toUpperCase() + levelName.slice(1));
                            
                            seg += util.parseTiempoASeg(e.time);
                            tiempos.push(util.pasarSegATiempo(seg));
                            intentos.push(int + info.intentos[idA][n][i].intentos);
                            passed = true;
                        }
                        else if(!passed){
                            int += info.intentos[idA][n][i].intentos;
                            seg += util.parseTiempoASeg(e.time);
                        }
                    });
                }
                response.json({"niveles" : niveles, "tiempos" : tiempos, "intentos" : intentos});
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

    profesor.post("/editarDatos", function(request, response){
        bcrypt.hash(request.body.contrasenia, 10, function(err, hash) {
            daoU.updateUser(request.session.usuario, request.body.usuario, hash, userUpdated);
            function userUpdated(err, result){
                if(err){
                    //TODO pagina error 500
                    console.log("Fallo al actualizar profe");
                    response.status(500);
                    response.end();
                }
                else{
                    request.session.usuario = request.body.usuario;
                    response.status(200);
                    response.end();
                }
            }
        });
    });

    return profesor;
};