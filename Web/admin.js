const express = require("express");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const mysql = require("mysql");


// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);
const admin = express.Router();

module.exports = function (dataPath,daoU,daoI) {
  console.log(dataPath);
  admin.use(express.static(path.join(__dirname, "public")));

  function comprobarUsuario(request, response, next) {
    if (request.session.usuario && request.session.rol == "admin") next();
    else response.redirect("/login");
  }

  function validarContrasena(contrasena) {
    const expresionRegular =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return expresionRegular.test(contrasena);
  }

  admin.use(comprobarUsuario);
  //PR(15/03) La ruta inicial es /, profesor envía a resumen
  admin.get("/", function (request, response) {
    response.render("general");
  });

  admin.get("/general", function (request, response) {
    response.render("general");
  });

  admin.get("/cuentas/nuevoUsuario", function (request, response) {
    response.render("crearUsuario");
  });

  admin.post("/cuentas/nuevoUsuario", function (request, response) {
    daoU.insertarUsuario(
      request.body.usuario,
      request.body.contrasenia,
      request.body.rol,
      insertarUsuario
    );
    function insertarUsuario(error, usuario) {
      if (error) {
        response.status(500);
        response.render("cuentas");
      } else {
        response.status(200);
        response.render("general");
      }
    }
  });

  admin.get("/cuentas", function (request, response) {
    daoU.getAllUsers(mostrarUsuarios);
    function mostrarUsuarios(error, usuarios) {
      if (error) {
        response.status(500);
        response.render("general");
      } else if (usuarios) {
        //TODO obtener lista de nombre de usuarios
        response.render("cuentas", { usuarios: usuarios });
      }
    }
  });

  admin.get("/cuentas/:nombre", function (request, response) {
    daoU.getUserDetail(request.params.nombre, mostrarUsuario);
    function mostrarUsuario(error, usuario) {
      if (error) {
        response.status(500);
        response.render("cuentas");
      } else {
        response.status(200);
        response.render("cuentaDetallada", { usuario: usuario });
      }
    }
  });

  admin.post("/cuentas/:nombre", function (request, response) {
    var variable = JSON.parse(request.body.usuario);
    if (validarContrasena(request.body.contrasenia)) {
      daoU.updateUser(
        request.params.nombre,
        request.body.usuario,
        request.body.contrasenia,
        mostrarUsuario
      );
      function mostrarUsuario(error, usuario) {
        if (error) {
          response.status(500);
          response.render("cuentas");
        } else {
          response.status(200);
          response.render("general");
        }
      }
    } else {
      // Enviar mensaje de error en la respuesta HTTP
      response.status(400).send("La contraseña no es válida");
    }
  });

  admin.get("/rutas", function (request, response) {
    daoU.getAllTeachers(insertarSesion);
    function insertarSesion(error, profesores) {
      if (error) {
        response.status(500);
        response.render("cuentas");
      } else {
        response.status(200);
        response.render("rutas", { profesores: profesores });
      }
    }
  });

  admin.post("/rutas", (req, res) => {
    const file = req.file;
    const fileName = file.filename;
    const profesor = req.body.profesor;
    const nombre = req.body.nombre;

    // Check file type
    const fileExtension = path.extname(file.originalname);
    if (fileExtension !== ".json") {
      return res
        .status(400)
        .send("Sólo son admitidos archivos con formato JSON");
    }

    daoI.insertInstituto(fileName, profesor, nombre, (error, insertId) => {
      if (error) {
        res
          .status(500)
          .send("Erros al insertar los datos en la tabla de institutos");
      } else {
        const newFilePath = path.join("datos", insertId.toString());
        fs.rename(file.path, newFilePath, (error) => {
          if (error) {
            console.error("Error al mover el fichero:", error);
            res.status(500).send("Error al mover el fichero");
          } else {
            res.send("¡Archivo subido y sesión creada correctamente!");
          }
        });
      }
    });
  });

  return admin;
};
