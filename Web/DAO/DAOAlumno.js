"use strict"

class DAOAlumno {
    #poolConnections;
    constructor(poolConnections) {
        this.#poolConnections = poolConnections;
    }

    aniadirAlumnosBD(alumnos, instituto, callback){
        this.#poolConnections.getConnection(
            function(err, connection){
                if (err){
                    connection.release()
                    callback(err.message)
                }else{
                    var query = "INSERT INTO `alumno` (`id`, `nombre`, `instituto`) VALUES ";
                    alumnos.forEach(a => {
                        query += "('" + a.id + "', '" + a.nombre + "', '" + instituto + "'),";
                    });
                    query = query.slice(0, -1);
                    connection.query(query,[],
                    function(err, result){
                        if(err){
                            connection.release();
                            callback(err.message);
                        }
                        else{
                            connection.release;
                            callback(null);
                        }
                    });
                }
            }
        );
    }
    
}

module.exports = DAOAlumno;