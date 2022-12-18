def anadirAlDiccionario(diccionario, evento, name):

    #Si ya esta el jugador, se suma 1 en el correspondiente sitio
    if name in diccionario:
        #Guardamos los valores que se usaran:
        creadas = int(diccionario[name][0]["botonRetryUsado"])
    
        diccionario[name][0]["botonRetryUsado"] = creadas + 1
            

    #Si aun no está el jugador, se crea su lista y ya se pone a 1 la primera accion y se ponen a 0 las demas para luego solo tener que sumar
    else: 
        diccionario[name] = [{"botonRetryUsado" : 1}]

