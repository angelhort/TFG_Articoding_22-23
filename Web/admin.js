const express = require("express");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const multer = require('multer');

// ...

// Add the following middleware to parse the form data


// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);
const admin = express.Router();

module.exports = function (dataPath, daoU, daoE) {
    admin.use(express.static(path.join(__dirname, "public")));

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, dataPath);
        },
        filename: function (req, file, cb) {
          cb(null, file.originalname);
        }
    });
    const upload = multer({ storage: storage });


    function comprobarUsuario(request, response, next) {
        if (request.session.usuario && request.session.rol == "admin") next();
        else response.redirect("/login");
    }



    function validarContrasena(contrasena) {
        const expresionRegular = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        const valida = expresionRegular.test(contrasena);
        const mensaje = valida ? 'La contraseña es válida' : 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula y un número.';
      
        return { valida, mensaje };
    }

    let dataID = 0;
    

    admin.use(comprobarUsuario);

    //Middleware
    admin.use((request, res, next) => {
        res.locals.currentRoute = request.url;
        next();
    });

    //PR(15/03) La ruta inicial es /, profesor envía a resumen
    admin.get("/", function (request, response) {
        response.render("general",{currentRoute: request.url});
    });

    admin.get("/general", function (request, response) {
        response.render("general",{currentRoute: request.url});
    });

    admin.get("/cuentas/nuevoUsuario", function (request, response) {
        response.render("crearUsuario", {currentRoute: request.url, mostrarMensaje: false, mensaje: '' });
    });

    admin.post("/cuentas/nuevoUsuario", function (request, response) {
        const validacion = validarContrasena(request.body.contrasenia);
        if  (!validacion.valida){
            response.render("crearUsuario", { currentRoute: request.url,mostrarMensaje: true, mensaje: validacion.mensaje });
        }
        else{
            bcrypt.hash(request.body.contrasenia, 10, function (err, hash) {
            daoU.existeUsuario(request.body.usuario, comprobarUsuario);
            function comprobarUsuario(error, contador, mensaje) {
                if (error) {
                    response.status(500).send('Error a la hora de comprobar los usuarios en la tabla de usuarios');
                }
                else if (contador > 0 || request.body.usuario == '') {
                    response.render("crearUsuario", {currentRoute: request.url, mostrarMensaje: true, mensaje: mensaje });
                }
                else {
                    daoU.insertarUsuario(
                        request.body.usuario,
                        hash,
                        request.body.rol,
                        insertarUsuario
                    );
                    function insertarUsuario(error, usuario) {
                        if (error) {
                            response.status(500);
                            response.render("cuentas",{currentRoute: request.url});
                        } else {
                            response.status(200);
                            response.render("general",{currentRoute: request.url});
                        }
                    }
                }
            }


        });
        }
        
    });

    admin.get("/cuentas", function (request, response) {
        daoU.getAllUsers(mostrarUsuarios);
        function mostrarUsuarios(error, usuarios) {
            if (error) {
                response.status(500);
                response.render("general",{currentRoute: request.url});
            } else if (usuarios) {
                //TODO obtener lista de nombre de usuarios
                response.render("cuentas", { currentRoute: request.url,usuarios: usuarios });
            }
        }
    });

    admin.get("/cuentas/:nombre", function (request, response) {
        daoU.getUserDetail(request.params.nombre, mostrarUsuario);
        function mostrarUsuario(error, usuario) {
            if (error) {
                response.status(500);
                response.render("cuentas",{currentRoute: request.url});
            } else {
                response.status(200);
                response.render("cuentaDetallada", { currentRoute: request.url, usuario: usuario, mostrarMensaje:false, mensaje:'' });
            }
        }
    });

    admin.post("/cuentas/:nombre", function (request, response) {
        daoU.getUserDetail(request.body.usuario, actualizarUsuario);
            function actualizarUsuario(error, usuario, mensaje) {
                if (error) {
                    response.status(500).send('Error a la hora de comprobar los usuarios en la tabla de usuarios');
                }
                else if (usuario != null) {
                    response.render("cuentaDetallada", {currentRoute: request.url, usuario: usuario,mostrarMensaje: true, mensaje: mensaje });
                }
                else {
                    const validacion = validarContrasena(request.body.contrasenia);
                    if (request.body.contrasenia != '' && !validacion.valida) {
                        
                        daoU.getUserDetail(request.body.usuarioName, (err,usr) => {
                            response.render("cuentaDetallada", { usuario: usr,mostrarMensaje: true, mensaje: validacion.mensaje });
                        });
                        
                    }
                    else {
                        
                        bcrypt.hash(request.body.contrasenia, 10, function (err, hash) {
                            daoU.updateUser(
                                request.params.nombre,
                                request.body.usuario,
                                hash,
                                mostrarUsuario
                            );
                            function mostrarUsuario(error, usuario) {
                                if (error) {
                                    response.status(500);
                                    response.render("cuentas",{currentRoute: request.url,});
                                } else {
                                    response.status(200);
                                    response.render("general",{currentRoute: request.url});
                                }
                            }  
                        });
                         
                    };
                }

             }
    });

    admin.get("/rutas", function (request, response) {
        daoU.getAllTeachers(insertarSesion);
        function insertarSesion(error, profesores) {
            if (error) {
                response.status(500);
                response.render("cuentas",{currentRoute: request.url,});
            } else {
                response.status(200);
                response.render("rutas", {currentRoute: request.url,mostrarMensaje:false,mensaje:'', profesores: profesores });
            }
        }
    });

    admin.post("/rutas", upload.single("archivo"), function (req, res) {
        const file = req.file;
        const fileName = "trazasOrdenadas.json";
        const profesor = req.body.profesor;
        const nombre = req.body.nombre;
      
        daoE.insertExperimento( profesor, nombre, (error, insertId) => {
          if (error) {
            res.render("rutas",{mostrarMensaje: true,mensaje:"Error al insertar los datos en la tabla de experimentos"});
          } else {
            if (insertId !== undefined) {
              const dataID = insertId;
      
              const folderPath = path.join(dataPath, dataID.toString());
              fs.mkdirSync(folderPath, { recursive: true });
      
              const filePath = path.join(folderPath, fileName);
              fs.renameSync(file.path, filePath);
      
              res.render("general");
            } else {
              res.render("rutas",{mostrarMensaje: true,mensaje:"No se ha podido crear el experimento, datos inválidos"});
            }
          }
        });
    });
      
      

    return admin;
};
