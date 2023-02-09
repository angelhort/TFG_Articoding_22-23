def anadirAlDiccionario(diccionario, evento, name, levelCode):

    if levelCode in diccionario[name]:
        #Pasos minimos:
        diccionario[name][levelCode].append({"pasosMinimos" : evento["result"]["extensions"]["minimum_steps"],
        #Pistas:
        "pistasNoUsadas" : evento["result"]["extensions"]["no_hints"],
        #Primera ejecucion
        "primeraEjecucion" : evento["result"]["extensions"]["first_execution"],
        #Numero de estrellas
        "estrellas" : evento["result"]["score"]["raw"],
        #3 estrellas 
        "3_estrellas" : True})

        if evento["result"]["score"]["raw"] != 3:
            diccionario[name][levelCode][-1]["3_estrellas"] = False

    else: 
        #Pasos minimos:
        diccionario[name][levelCode] = [{"pasosMinimos" : evento["result"]["extensions"]["minimum_steps"],
            #Pistas:
            "pistasNoUsadas" : evento["result"]["extensions"]["no_hints"],
            #Primera ejecucion
            "primeraEjecucion" : evento["result"]["extensions"]["first_execution"],
            #Numero de estrellas
            "estrellas" : evento["result"]["score"]["raw"],
            #3 estrellas 
            "3_estrellas" : True}]

        if evento["result"]["score"]["raw"] != 3:
            diccionario[name][levelCode][0]["3_estrellas"] = False
