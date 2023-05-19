"use strict"

class DAOExperimento {
    #poolConnections;
    constructor(poolConnections) {
        this.#poolConnections = poolConnections;
    }

    getAllexperimentos(callback){
        this.#poolConnections.getConnection(
            function (err, connection) {
                if (err){
                    connection.release();
                    callback(err.message);
                }
                else{
                    connection.query("SELECT DISTINCT * FROM experimento", 
                    function(err, experimentos){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else if(experimentos.length === 0){
                            connection.release();
                            callback("experimentos no existentes");
                        }
                        else{
                            connection.release();
                            var instis = [];
                            for (let i = 0; i < experimentos.length; i++) {
                                instis.push(experimentos[i].nombre);
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
            connection.query("SELECT nombre FROM experimento WHERE id = ?", [id], function(err, insti) {
              if (err) {
                callback(err.message);
              } else if (insti.length === 0) {
                callback("experimento not found");
              } else {
                callback(null, insti[0].nombre);
              }
            });
          }
        });
    }

    insertexperimento(fileName, profesor, nombre, callback) {
      this.#poolConnections.getConnection(function(err, connection) {
        if (err) {
          connection.release();
          callback(err.message);
        } else {
          const query = 'INSERT INTO experimentos (fileName, profesor, nombre) VALUES (?, ?, ?)';
          connection.query(query, [fileName, profesor, nombre], (error, results) => {
            if (error) {
              console.error('Error inserting into experimentos:', error);
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

module.exports = DAOExperimento;