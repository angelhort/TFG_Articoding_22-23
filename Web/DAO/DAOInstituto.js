"use strict"

class DAOInstituto {
    #poolConnections;
    constructor(poolConnections) {
        this.#poolConnections = poolConnections;
    }

    getAllInstitutos(callback){
        this.#poolConnections.getConnection(
            function (err, connection) {
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT DISTINCT * FROM instituto", 
                    function(err, institutos){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else if(institutos.length === 0){
                            connection.release();
                            callback("Institutos no existentes");
                        }
                        else{
                            connection.release();
                            var instis = [];
                            for (let i = 0; i < institutos.length; i++) {
                                instis.push(institutos[i].nombre);
                            }
                            callback(null, instis);
                        }
                    });
                }
            }
        );
    }

    getNameById(id, callback){
        this.#poolConnections.getConnection(
            function (err, connection) {
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT nombre FROM instituto WHERE id = ?", [id], 
                    function(err, insti){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else if(insti.length === 0){
                            connection.release();
                            callback("Instituto not found");
                        }
                        else{
                            connection.release();
                            callback(null, insti[0].nombre);
                        }
                    });
                }
            }
        );
    }

    
}

module.exports = DAOInstituto;