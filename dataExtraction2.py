def anadirAlDiccionario(diccionario, evento, name):

    #Si ya esta el jugador, se suma 1 en el correspondiente sitio
    if name in diccionario:
        #Guardamos los valores que se usaran:
        creadas = int(diccionario[name][0]["tarjetasCreadas"])
        movidas = int(diccionario[name][0]["tarjetasMovidas"]) 
        eliminadas = int(diccionario[name][0]["tarjetasEliminadas"])
    
        #Si crea
        if(evento["result"]["extensions"]["action"] == "create"):
            diccionario[name][0]["tarjetasCreadas"] = creadas + 1
            
        #Si mueve
        if(evento["result"]["extensions"]["action"] == "move"):
            diccionario[name][0]["tarjetasMovidas"] = movidas + 1
            
        #Si elimina
        if(evento["result"]["extensions"]["action"] == "remove"):
            diccionario[name][0]["tarjetasEliminadas"] = eliminadas + 1
            

    #Si aun no está el jugador, se crea su lista y ya se pone a 1 la primera accion y se ponen a 0 las demas para luego solo tener que sumar
    else: 
        #Si crea
        if(evento["result"]["extensions"]["action"] == "create"):
            diccionario[name] = [{"tarjetasCreadas" : 1,
                "tarjetasMovidas" : 0,
                "tarjetasEliminadas" : 0}]
        #Si mueve
        elif(evento["result"]["extensions"]["action"] == "move"):
            diccionario[name] = [{"tarjetasCreadas" : 0,
                "tarjetasMovidas" : 1,
                "tarjetasEliminadas" : 0}]
        #Si elimina
        elif(evento["result"]["extensions"]["action"] == "remove"):
            diccionario[name] = [{"tarjetasCreadas" : 0,
                "tarjetasMovidas" : 0,
                "tarjetasEliminadas" : 1}]

