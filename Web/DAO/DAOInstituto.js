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
                    connection.query("SELECT nombre FROM instituto", [id], 
                    function(err, institutos){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else if(insti.length === 0){
                            connection.release();
                            callback("Institutos no existentes");
                        }
                        else{
                            connection.release();
                            let instis =JSON.parse(JSON.stringify(rows));
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