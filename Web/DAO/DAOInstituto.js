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

    getNameById(id, callback) {
        this.#poolConnections.getConnection(function(err, connection) {
          if (err) {
            connection.release();
            callback(err.message);
          } else {
            connection.query("SELECT nombre FROM instituto WHERE id = ?", [id], function(err, insti) {
              if (err) {
                callback(err.message);
              } else if (insti.length === 0) {
                callback("Instituto not found");
              } else {
                callback(null, insti[0].nombre);
              }
            });
          }
        });
    }

    insertInstituto(fileName, profesor, nombre, callback) {
      this.#poolConnections.getConnection(function(err, connection) {
        if (err) {
          connection.release();
          callback(err.message);
        } else {
          const query = 'INSERT INTO institutos (fileName, profesor, nombre) VALUES (?, ?, ?)';
          connection.query(query, [fileName, profesor, nombre], (error, results) => {
            if (error) {
              console.error('Error inserting into institutos:', error);
              callback(error);
            } else {
              const insertId = results.insertId;
              callback(null, insertId);
            }
          });
        }
    });
  };

    
}

module.exports = DAOInstituto;