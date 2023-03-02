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
                    connection.query("SELECT nombre, contrasenya, instituto FROM usuario WHERE nombre = ? AND contrasenya = ?", [usuario, contrasenia], 
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
    
}

module.exports = DAOUsuario;