def anadirAlDiccionario(diccionario, evento, name):

    #Si ya esta el jugador, se suma 1 en el correspondiente sitio
    if name in diccionario:
        #Guardamos los valores que se usaran:
        creadas = int(diccionario[name][0]["laserCreados"])
        movidas = int(diccionario[name][0]["laserMovidos"]) 
        eliminadas = int(diccionario[name][0]["laserEliminados"])
    
        #Si crea
        if(evento["result"]["extensions"]["action"] == "create" and evento["result"]["extensions"]["element_type"] == "laser"):
            diccionario[name][0]["laserCreados"] = creadas + 1
            
        #Si mueve
        if(evento["result"]["extensions"]["action"] == "move" and evento["result"]["extensions"]["element_type"] == "laser"):
            diccionario[name][0]["laserMovidos"] = movidas + 1
            
        #Si elimina
        if(evento["result"]["extensions"]["action"] == "remove" and evento["result"]["extensions"]["element_type"] == "laser"):
            diccionario[name][0]["laserEliminados"] = eliminadas + 1
            

    #Si aun no está el jugador, se crea su lista y ya se pone a 1 la primera accion y se ponen a 0 las demas para luego solo tener que sumar
    else: 
        #Si crea
        if(evento["result"]["extensions"]["action"] == "create" and evento["result"]["extensions"]["element_type"] == "laser"):
            diccionario[name] = [{"laserCreados" : 1,
                "laserMovidos" : 0,
                "laserEliminados" : 0}]
        #Si mueve
        elif(evento["result"]["extensions"]["action"] == "move" and evento["result"]["extensions"]["element_type"] == "laser"):
            diccionario[name] = [{"laserCreados" : 0,
                "laserMovidos" : 1,
                "laserEliminados" : 0}]
        #Si elimina
        elif(evento["result"]["extensions"]["action"] == "remove" and evento["result"]["extensions"]["element_type"] == "laser"):
            diccionario[name] = [{"laserCreados" : 0,
                "laserMovidos" : 0,
                "laserEliminados" : 1}]

