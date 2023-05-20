"use strict"

class DAOUsuario {
    #poolConnections;
    constructor(poolConnections) {
        this.#poolConnections = poolConnections;
    }

    getUser(usuario, callback){
        this.#poolConnections.getConnection(
            function (err, connection) {
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT nombre, contrasenya, id, rol FROM usuario WHERE nombre = ?", [usuario], 
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
                    connection.query("SELECT nombre, contrasenya, rol FROM usuario WHERE rol != 'admin'",
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

    getAllTeachers (callback){
        this.#poolConnections.getConnection(
            function (err, connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT nombre  FROM usuario WHERE rol = 'profesor';",
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
                            callback(null, users,'Usuario ya existente');
                        }
                        else{
                            connection.release();
                            callback(null, null);
                        }
                    }); 
                }
            }
        );

    }

    existeUsuario(nombre,callback){
        this.#poolConnections.getConnection(
            function (err,connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else {
                    connection.query("SELECT COUNT(*) AS count FROM usuario WHERE nombre = ?", [nombre],
                    function(err, rows){
                        if(err){
                            callback(error,null);
                        }
                        else {
                            const count = rows[0].count
                            if(count > 0){
                                callback(null,count,'Usuario no válido');
                            }
                            else{
                                callback(null,count);
                            }
                        }
                    });
                };
            }
        );
    }

    insertarUsuario(nombre,contrasenya,rol,callback){
        this.#poolConnections.getConnection(
            function (err,connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("INSERT INTO usuario (nombre,contrasenya,rol) VALUES(?,?,?)",[nombre,contrasenya,rol],
                    function(err, rows){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else {
                            if(rows.length == 0){
                                connection.release();
                                callback(null, rows);
                            }
                            else {
                                connection.release();
                                callback(null, rows);
                            }
                            
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
                    connection.query(
                        `UPDATE usuario SET 
                        nombre = (case when `+ connection.escape(nombreAct) + `<> '' then `+ connection.escape(nombreAct)+` else nombre end) ,
                        contrasenya = (case when `+ connection.escape(contrasenya) + ` <> '' then `+ connection.escape(contrasenya) + ` else contrasenya end) 
                        WHERE nombre = `+ connection.escape(nombreAnt),
                        [nombreAct,contrasenya,nombreAnt],
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

    getInstitutosProf(idProf, callback){
        this.#poolConnections.getConnection(
            function (err,connection){
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT * FROM experimento WHERE idProfesor = ?",[idProf],
                    function(err, inst){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else {
                            connection.release();
                            callback(null, inst);
                        }
                    }); 
                }
            }
        );
    }

    
}

module.exports = DAOUsuario;