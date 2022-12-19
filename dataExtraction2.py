def anadirAlDiccionario(diccionario, evento, name, nivel):

    levelCode = -1
    
    if name in nivel:
        levelCode = nivel[name][-1]

    #Si ya esta el jugador, se suma 1 en el correspondiente sitio
    if levelCode in diccionario[name]:
        #Guardamos los valores que se usaran:
        creadas = int(diccionario[name][levelCode][0]["tarjetasCreadas"])
        movidas = int(diccionario[name][levelCode][0]["tarjetasMovidas"]) 
        eliminadas = int(diccionario[name][levelCode][0]["tarjetasEliminadas"])
    
        #Si crea
        if(evento["result"]["extensions"]["action"] == "create"):
            diccionario[name][levelCode][0]["tarjetasCreadas"] = creadas + 1
            
        #Si mueve
        if(evento["result"]["extensions"]["action"] == "move"):
            diccionario[name][levelCode][0]["tarjetasMovidas"] = movidas + 1
            
        #Si elimina
        if(evento["result"]["extensions"]["action"] == "remove"):
            diccionario[name][levelCode][0]["tarjetasEliminadas"] = eliminadas + 1
            

    #Si aun no está el jugador, se crea su lista y ya se pone a 1 la primera accion y se ponen a 0 las demas para luego solo tener que sumar
    else: 
        #Si crea
        if(evento["result"]["extensions"]["action"] == "create"):
            diccionario[name][levelCode] = [{"tarjetasCreadas" : 1,
                "tarjetasMovidas" : 0,
                "tarjetasEliminadas" : 0}]
        #Si mueve
        elif(evento["result"]["extensions"]["action"] == "move"):
            diccionario[name][levelCode] = [{"tarjetasCreadas" : 0,
                "tarjetasMovidas" : 1,
                "tarjetasEliminadas" : 0}]
        #Si elimina
        elif(evento["result"]["extensions"]["action"] == "remove"):
            diccionario[name][levelCode] = [{"tarjetasCreadas" : 0,
                "tarjetasMovidas" : 0,
                "tarjetasEliminadas" : 1}]

