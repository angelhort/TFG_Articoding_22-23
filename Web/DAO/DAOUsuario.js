"use strict"

class DAOUsuario {
    #poolConnections;
    constructor(poolConnections) {
        this.#poolConnections = poolConnections;
    }

    isUserCorrect(usuario, contrasenia, callback){
        this.#poolConnections.getConnection(
            function (err, connection) {
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT nombre, contrasenya, instituto, rol FROM usuario WHERE nombre = ? AND contrasenya = ?", [usuario, contrasenia], 
                    function(err, user){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else{
                            connection.release();
                            callback(null, user.length == 1, user[0]);
                        }
                    });
                }
            }
        );
    }

    getAllUsers (callback){
        this.#poolConnections.getConnection(
            function (err, connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT nombre, contrasenya, instituto, rol FROM usuario WHERE rol != 'admin'",
                    function(err, rows){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else{
                            connection.release();
                            let users =JSON.parse(JSON.stringify(rows));
                            callback(null, users);
                        }
                    }); 
                }
            }
        );
    }

    getUserDetail (usuario,callback){
        this.#poolConnections.getConnection(
            function (err, connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT * FROM usuario WHERE nombre = ?",[usuario],
                    function(err, rows){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else if (rows.length == 1){
                            connection.release();
                            let users =JSON.parse(JSON.stringify(rows[0]));
                            callback(null, users);
                        }
                    }); 
                }
            }
        );

    }

    insertarUsuario(nombre,contrasenya,rol,instituto,callback){
        this.#poolConnections.getConnection(
            function (err,connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    
                    connection.query("INSERT INTO usuario (nombre,contrasenya,rol,instituto) VALUES(?,?,?,?)",[nombre,contrasenya,rol,instituto],
                    function(err, rows){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else {
                            connection.release();
                            callback(null, rows);
                        }
                    }); 
                }
            }
        );
    }

    updateUser(nombreAnt,nombreAct,contrasenya,callback){
        this.#poolConnections.getConnection(
            function (err,connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    
                    connection.query("UPDATE usuario SET nombre = ?, contrasenya = ? WHERE nombre = ?",[nombreAct,contrasenya,nombreAnt],
                    function(err, rows){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else {
                            connection.release();
                            callback(null, rows);
                        }
                    }); 
                }
            }
        );
    }

    
}

module.exports = DAOUsuario;