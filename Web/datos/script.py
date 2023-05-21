import pandas as pd
import json
from collections import defaultdict
import re
from utilities import Tiempo
import statistics
import re
import plotly.express as px
import plotly.graph_objects as go
import sys
import os
import xml.etree.ElementTree as ET
import keyword
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

sys.stdout.flush()
print("Analizando datos...")

nombreInstituto = sys.argv[1]

if not os.path.exists("./datos/" + nombreInstituto + "/plots"):
    os.makedirs("./datos/" + nombreInstituto + "/plots")

def extraerTiemposPorNivelJugador(rawData, tenerEnCuentaMove = False):
    
    tiempos = defaultdict(defaultdict)
    intentosNecesarios = defaultdict(defaultdict)
    inicioYFinJuego = defaultdict()
    erroresVar = defaultdict(list)
    erroresCod = defaultdict(list)
    codJugadores = defaultdict()
    codUltNivel = defaultdict()

    error1 = "No necesario crear variable"
    error2 = "Asignacion mismo valor en variable"
    error3 = "Entero o texto utilizado 2 veces"
    errorCodSucio = "Codigo muerto"

    nivelesError1Excepcion = ['variables_2', 'variables_3', 'variables_4', 'variables_6', 'variables_8', 'variables_10', 'types_2', 'basic_operators_1', 'basic_operators_3', 'basic_operators_6']
    nivelesError3Excepcion = ['tutorials_1', 'tutorials_2', 'tutorials_3', 'tutorials_4', 'tutorials_5', 'tutorials_6', 'tutorials_7', 'tutorials_8', 'tutorials_9']

    ultimaInteraccionJugador = defaultdict()
    tiempoInicio_Interaccion_Jugador = defaultdict(defaultdict) #Tiempo entre inicio de nivel y la siguiente interaccion (reinicio, completado o interaccion con tarjeta)
    tiempoInteraccion_Completado_Jugador = defaultdict(defaultdict) #Tiempo entre una interaccion (inicio, reinicio o interaccion con tarjeta) y terminar el nivel
    tiempoInteraccion_Interaccion_Jugador = defaultdict(defaultdict) #Tiempo entre una interaccion con tarjeta y otra interaccion con tarjeta

    erLevel = re.compile(r'\blevel$\b')
    erIdLevel = re.compile(r'/')
    
    erInitialized = re.compile(r'\binitialized$\b')
    erCompleted = re.compile(r'\bcompleted$\b')
    erAccessed = re.compile(r'\baccessed$\b')
    erProgressed = re.compile(r'\bprogressed$\b')
    erInteracted = re.compile(r'\binteracted$\b')

    erSeriousGame = re.compile(r'\bserious-game$\b')  
    erCategoryMain = re.compile(r'\bcategories_main$\b') 
    erGameObject = re.compile(r'\bgame-object$\b')
    erLevelExitButton = re.compile(r'\blevel_exit_button$\b') 

    estandarNombreVar = re.compile(r'^_*[a-zA-Z][a-zA-Z0-9_]*$')
    
    fechaSesion = {"inicio" : None, "fin" : None}
    fechaSesion["inicio"] = rawData[0]["timestamp"]
    fechaSesion["fin"] = rawData[-1]["timestamp"]
    
    for evento in rawData:
        verb = evento["verb"]["id"]
        obj = evento["object"]["definition"]["type"]
        name = evento["actor"]["name"]
        timestamp = evento["timestamp"]
        objectId = evento["object"]["id"]
       
        if erLevel.search(obj): #Si el objeto de la acción es un nivel
            levelCode = erIdLevel.split(objectId)[-1]
            if levelCode != "editor_level":
                if erInitialized.search(verb): #Si la acción es inicio o reinicio
                    if "result" in evento: #Significa que ha iniciado el nivel desde el menu
                        if levelCode in tiempos[name]:
                            intentosNecesarios[name][levelCode].append({"intentos" : 1, "success" : False})
                            tiempos[name][levelCode].append({"ini" : timestamp, "fin" : None, "stars" : ""})
                        else:
                            intentosNecesarios[name][levelCode] = [{"intentos" : 1, "success" : False}]
                            tiempos[name][levelCode] = [{"ini" : timestamp, "fin" : None, "stars" : ""}]

                        ultimaInteraccionJugador[name] = {"t" : timestamp, "accion" : "inicio"}
                    else:
                        intentosNecesarios[name][levelCode][-1]["intentos"] += 1
                        try:
                            t = Tiempo(ultimaInteraccionJugador[name]["t"], timestamp)               
                            if ultimaInteraccionJugador[name]["accion"] == "inicio":
                                #Añadimos la dif de tiempo al diccionario del jugador
                                if levelCode in tiempoInicio_Interaccion_Jugador[name]:
                                    tiempoInicio_Interaccion_Jugador[name][levelCode].append({"tiempo" : t, "accion" : "reinicio"})
                                else:
                                    tiempoInicio_Interaccion_Jugador[name][levelCode] = [{"tiempo" : t, "accion" : "reinicio"}]
                            #Actualizamos ultima interaccion
                            ultimaInteraccionJugador[name] = {"t" : timestamp, "accion" : "reinicio"}
                        except:
                            #Si entra aqui es porque ha reiniciado un nivel que no habia iniciado
                            #Trazas estan mal
                            None

                elif erProgressed.search(verb):
                    cod = ET.fromstring(evento['result']['extensions']['code'])
                    codJugadores[name] = cod
                    codUltNivel[name] = levelCode

                elif erCompleted.search(verb):
                    if evento["result"]["score"]["raw"] != 0:
                        try:
                            t = Tiempo(ultimaInteraccionJugador[name]["t"], timestamp)                        
                            #Añadimos la dif de tiempo al diccionario del jugador
                            if ultimaInteraccionJugador[name]["accion"] == "inicio":
                                    #Añadimos la dif de tiempo al diccionario del jugador
                                if levelCode in tiempoInicio_Interaccion_Jugador[name]:
                                    tiempoInicio_Interaccion_Jugador[name][levelCode].append({"tiempo" : t, "accion" : "terminado", "exito" : evento["result"]["success"]})
                                else:
                                    tiempoInicio_Interaccion_Jugador[name][levelCode] = [{"tiempo" : t, "accion" : "terminado", "exito" : evento["result"]["success"]}]
                                    
                                if levelCode in tiempoInteraccion_Completado_Jugador[name]:
                                    tiempoInteraccion_Completado_Jugador[name][levelCode].append({"tiempo" : t, "accion_anterior" : "inicio"})
                                else:
                                    tiempoInteraccion_Completado_Jugador[name][levelCode] = [{"tiempo" : t, "accion_anterior" : "inicio"}]
                                        
                            elif ultimaInteraccionJugador[name]["accion"] == "reinicio":
                                if levelCode in tiempoInteraccion_Completado_Jugador[name]:
                                    tiempoInteraccion_Completado_Jugador[name][levelCode].append({"tiempo" : t, "accion_anterior" : "reinicio"})
                                else:
                                    tiempoInteraccion_Completado_Jugador[name][levelCode] = [{"tiempo" : t, "accion_anterior" : "reinicio"}]

                            elif ultimaInteraccionJugador[name]["accion"] == "interaccion":
                                if levelCode in tiempoInteraccion_Completado_Jugador[name]:
                                    tiempoInteraccion_Completado_Jugador[name][levelCode].append({"tiempo" : t, "accion_anterior" : "interaccionTarjeta"})
                                else:
                                    tiempoInteraccion_Completado_Jugador[name][levelCode] = [{"tiempo" : t, "accion_anterior" : "interaccionTarjeta"}]
                            #Actualizamos ultima interaccion, la borramos
                            del ultimaInteraccionJugador[name]
                        except:
                            #Si entra aqui es porque se ha completado un nivel que no se habia iniciado
                            #Probablemente por anomalias en las trazas
                            None
                    if evento["result"]["score"]["raw"] > 0 :
                        if levelCode in tiempos[name]:
                            intentosNecesarios[name][levelCode][-1]["success"] = True
                            tiempos[name][levelCode][-1]["fin"] = timestamp
                            tiempos[name][levelCode][-1]["stars"] = evento["result"]["score"]["raw"]

                        if codUltNivel[name] == levelCode:
                            
                            try:
                                cod = codJugadores[name]
                            except:
                                print(evento)
                                print(timestamp)
                                return
                            #Analisis codigo limpio
                            antBloque = False
                            for child in cod:
                                if child.tag == "block":
                                    if antBloque:
                                        erroresCod[name].append({'error' : errorCodSucio, 'level' : levelCode})
                                        break
                                    else:
                                        antBloque = True
                                else:
                                    antBloque = False 
                            
                            #Analisis nombre variables

                            def nombreVarValido(nombresVar):
                                for nombre in nombresVar:
                                    if keyword.iskeyword(nombre):
                                        erroresCod[name].append({'error' : "Variable: '" + nombre + "' es una palabra reservada", 'level' : levelCode})
                                    elif not bool(estandarNombreVar.match(nombre)):
                                        erroresCod[name].append({'error' : "Variable: '" + nombre + "' no tiene un nombre que siga el estandar de programacion", 'level' : levelCode})

                            variablesDeclaradas = []
                            for child in cod.find("variables"):
                                variablesDeclaradas.append(child.text)
                            nombreVarValido(variablesDeclaradas)

                            #Analisis uso variables
                            vars = defaultdict()
                            values = []

                            for v in cod.find('variables'):
                                vars[v.text] = {"valores" : [], "usado" : 0}

                            for b in cod.find("block[@type='start_start']").iter('block'):
                                tarjeta = b.attrib['type']

                                if tarjeta == "text" or tarjeta == "math_number":
                                    valor = b.find('field').text
                                    if valor in values and levelCode not in nivelesError3Excepcion:
                                        erroresVar[name].append({'error' : error3, 'level' : levelCode})
                                    else:
                                        values.append(valor)

                                elif tarjeta == "variables_set":
                                    varName = b.find('field').text
                                    try:
                                        varValue = b.find('value').find('block').find('field').text
                                    except:
                                        #print(ET.tostring(cod, encoding='utf8', method='xml'))
                                        #print(ET.tostring(b, encoding='utf8', method='xml'))
                                        None                                

                                    if vars[varName]['valores'] and vars[varName]['usado'] < 2 and levelCode not in nivelesError1Excepcion:
                                        erroresVar[name].append({'error' : error1 + " " + varName, 'level' : levelCode})

                                    if varValue in vars[varName]['valores']:
                                        erroresVar[name].append({'error' : error2 + " " + varName, 'level' : levelCode})
                                    else:
                                        vars[varName]['valores'].append(varValue)

                                    vars[varName]['usado'] = 0

                                elif tarjeta == "variables_get":
                                    varName = b.find('field').text
                                    vars[varName]["usado"] += 1

                            for v in vars:
                                if vars[v]['usado'] < 2 and levelCode not in nivelesError1Excepcion:
                                    erroresVar[name].append({'error' : error1 + " " + v, 'level' : levelCode})

                    elif evento["result"]["score"]["raw"] == -1:
                        if levelCode in tiempos[name]:
                            tiempos[name][levelCode][-1]["fin"] = timestamp
                            tiempos[name][levelCode][-1]["stars"] = evento["result"]["score"]["raw"]
                    else:
                        tiempos[name][levelCode][-1]["fin"] = timestamp
        
        elif erSeriousGame.search(obj) and erInitialized.search(verb):
            if name in inicioYFinJuego:
                inicioYFinJuego[name].append({"inicio" : timestamp, "fin" : None})
            else:
                inicioYFinJuego[name] = [{"inicio" : timestamp, "fin" : None}]

            if name in ultimaInteraccionJugador:
                    del ultimaInteraccionJugador[name]
        
        elif erGameObject.search(obj) and erInteracted.search(verb):
                if "result" in evento and "extensions" in evento["result"] and "level" in evento["result"]["extensions"]:
                    levelCode = evento["result"]["extensions"]["level"]
                    if not erLevelExitButton.search(objectId) and levelCode != "editor_level":
                        if name in ultimaInteraccionJugador:
                            if evento["result"]["extensions"]["action"] != "move" or tenerEnCuentaMove: #<-- Que accion realiza
                                t = Tiempo(ultimaInteraccionJugador[name]["t"], timestamp)
                                #Añadimos la dif de tiempo al diccionario del jugador

                                if ultimaInteraccionJugador[name]["accion"] == "inicio":
                                    if levelCode in tiempoInicio_Interaccion_Jugador[name]:
                                        tiempoInicio_Interaccion_Jugador[name][levelCode].append({"tiempo" : t, "accion" : "interaccionTarjeta"})
                                    else:
                                        tiempoInicio_Interaccion_Jugador[name][levelCode] = [{"tiempo" : t, "accion" : "interaccionTarjeta"}]

                                if ultimaInteraccionJugador[name]["accion"] == "interaccionTarjeta":
                                    if levelCode in tiempoInteraccion_Interaccion_Jugador[name]:
                                        tiempoInteraccion_Interaccion_Jugador[name][levelCode].append({"tiempo" : t, "accion_anterior" : "interaccionTarjeta"})
                                    else:
                                        tiempoInteraccion_Interaccion_Jugador[name][levelCode] = [{"tiempo" : t, "accion_anterior" : "interaccionTarjeta"}]

                                ultimaInteraccionJugador[name] = {"t" : timestamp, "accion" : "interaccionTarjeta"}
                        else:
                            #Se ha interactuado en un nivel que no estaba iniciado
                            None

        if not(erAccessed.search(verb) and erCategoryMain.search(objectId)):
            try:
                inicioYFinJuego[name][-1]["fin"] = timestamp
            except:
                None
    
     # Dataframe 1: tiempoInteraccion_Completado_Jugador
    df_tiempoInteraccion_Completado_Jugador = pd.DataFrame(tiempoInteraccion_Completado_Jugador)
    df_tiempoInteraccion_Completado_Jugador = df_tiempoInteraccion_Completado_Jugador.applymap(lambda x: np.nan if not isinstance(x, list) or len(x) == 0 else int(x[-1]["tiempo"]))
    df_tiempoInteraccion_Completado_Jugador.index.name = "nivel"

    # Dataframe 2: tiempoInicio_Interaccion_Jugador
    df_tiempoInicio_Interaccion_Jugador = pd.DataFrame(tiempoInicio_Interaccion_Jugador)
    df_tiempoInicio_Interaccion_Jugador = df_tiempoInicio_Interaccion_Jugador.applymap(lambda x: np.nan if not isinstance(x, list) or len(x) == 0 else int(x[0]["tiempo"]))
    df_tiempoInicio_Interaccion_Jugador.index.name = "nivel"

    # Dataframe 3: tiempoInteraccion_Interaccion_Jugador
    df_tiempoInteraccion_Interaccion_Jugador = pd.DataFrame(tiempoInteraccion_Interaccion_Jugador)
    df_tiempoInteraccion_Interaccion_Jugador = df_tiempoInteraccion_Interaccion_Jugador.applymap(lambda x: np.nan if not isinstance(x, list) or len(x) == 0 else sum(int(tiempo["tiempo"]) for tiempo in x) / len(x))
    df_tiempoInteraccion_Interaccion_Jugador.index.name = "nivel"
    
    return {"tiempos" : tiempos, "intentosNecesarios" : intentosNecesarios, "inicioYFinJuego" : inicioYFinJuego, "erroresVar" : erroresVar, "erroresCod" : erroresCod, "fechaSesion" : fechaSesion, "tiempoInteraccion_Completado_Jugador" : df_tiempoInteraccion_Completado_Jugador, "tiempoInicio_Interaccion_Jugador" : df_tiempoInicio_Interaccion_Jugador, "tiempoInteraccion_Interaccion_Jugador" : df_tiempoInteraccion_Interaccion_Jugador}

def tiempoPorNiveles_Jugador(data):
    tiemposJugados = defaultdict(defaultdict)
    tiemposJugadosSerializable = defaultdict(defaultdict)
    for player in data:
        for level in data[player]:
            for times in data[player][level]:
                if times["fin"] != None: #Si no se aborto el intento del nivel
                    timeDifference = Tiempo(times["ini"], times["fin"])
                    if level in tiemposJugados[player]:
                        tiemposJugados[player][level].append({"time" : timeDifference, "stars" : times["stars"]})
                        tiemposJugadosSerializable[player][level].append({"time" : timeDifference.toString(), "stars" : times["stars"]})
                    else:
                        tiemposJugados[player][level] = [{"time" : timeDifference, "stars" : times["stars"]}]
                        tiemposJugadosSerializable[player][level] = [{"time" : timeDifference.toString(), "stars" : times["stars"]}]
    return tiemposJugados, tiemposJugadosSerializable

def tiempoTotalJuego(inicioYFinJuego, ultNivelAlcanzado):
    tiempoTotal = defaultdict()
    for player in inicioYFinJuego:
        for time in inicioYFinJuego[player]:
            if time["fin"] != None:
                if player in tiempoTotal:
                    tiempoTotal[player] += Tiempo(time["inicio"], time["fin"])
                else:
                    tiempoTotal[player] = Tiempo(time["inicio"], time["fin"])

    for p in tiempoTotal:
        if p in ultNivelAlcanzado:
            tiempoTotal[p] = {"id" : p, "tiempo" : str(tiempoTotal[p]), "ultNivel" : ultNivelAlcanzado[p].replace("_", " ").capitalize(), "nombre" : p}
        else:
            tiempoTotal[p] = {"id" : p, "tiempo" : str(tiempoTotal[p]), "ultNivel" : "None", "nombre" : p}


    with open('./datos/'+ nombreInstituto +'/jugadores.json', 'w') as json_file:
        json.dump(tiempoTotal, json_file)

def getMediaTiempoPorNivel(tiempos, soloPrimerExito = True, tiemposOrdenados = False):
    medias = defaultdict(list)
    mediasEstrellas = defaultdict(list)
    tiempoCompletarNivelIndividual = defaultdict(defaultdict)
    
    for player in tiempos:
        for level in tiempos[player]:
            tAux = Tiempo("0s")
            for t in tiempos[player][level]:
                if t["stars"] != "" and int(t["stars"]) != -1:
                    if level in medias:
                        medias[level].append(int(tAux + t["time"]))
                        mediasEstrellas[level].append(int(t["stars"]))
                    else:
                        medias[level] = [int(tAux + t["time"])]
                        mediasEstrellas[level] = [int(t["stars"])]
                        
                    tiempoCompletarNivelIndividual[player][level] = tAux + t["time"]
                    if soloPrimerExito:
                        break
                elif t["stars"] == 0:
                    print("ALERTA")
                else:
                    tAux += t["time"]
    for m in medias:
        medias[m] = Tiempo(str(int(round(statistics.mean(medias[m]), 0))) + "s")
        
    for m in mediasEstrellas:
        mediasEstrellas[m] = statistics.mean(mediasEstrellas[m])
    
    listaNiveles = medias.keys()
    
    if tiemposOrdenados:
        medias = sorted(medias.items(), key=lambda x: x[1])
        mediasEstrellas = sorted(mediasEstrellas.items(), key=lambda x: x[1])
    else:
        medias = list(medias.items())
        mediasEstrellas = list(mediasEstrellas.items())
    
    return {"mediaTiempos" : medias, "mediaEstrellas" : mediasEstrellas, "listaNiveles" : listaNiveles, "tiemposIndividuales" : tiempoCompletarNivelIndividual}

def getUltimoNivelAlcanzado(tiempos):
    ultNivel = defaultdict()
    for player in tiempos:
        for level in tiempos[player]:
            ultNivel[player] = level
    return ultNivel

def getIntentosMedios_HastaCompletarNivel(intentosNecesarios, intentosOrdenados = False):
    intentosMedios = defaultdict(list)
    intentosCompletarNivelIndividual = defaultdict(defaultdict)
    
    for name in intentosNecesarios:
        for level in intentosNecesarios[name]:
            cont = 0
            for i in intentosNecesarios[name][level]:
                cont += i["intentos"]
                if i["success"] == True:
                    intentosMedios[level].append(cont)
                    intentosCompletarNivelIndividual[name][level] = cont
                    break
            
    for level in intentosMedios:
        intentosMedios[level] = round(statistics.mean(intentosMedios[level]), 2)
    
    if intentosOrdenados:
        intentosMedios = sorted(intentosMedios.items(), key=lambda x: x[1])
    else:
        intentosMedios = list(intentosMedios.items())
    return {"intentosMedios" : intentosMedios, "intentosIndividual" : intentosCompletarNivelIndividual}

def extraerArray(my_dict):
    nested_keys = []
    nested_values = []

    for k, v in my_dict.items():
        for nested_k, nested_v in v.items():
            nested_keys.append(nested_k)
            nested_values.append(nested_v)

    # create a dictionary with keys as the values of the nested_keys array
    nested_dict = defaultdict(list)
    for key, value in zip(nested_keys, nested_values):
        nested_dict[key].append(value)
    
    return nested_dict

def extraerArrayConNombres(my_dict):
    nested_keys = []
    nested_values = []

    for k, v in my_dict.items():
        for nested_k, nested_v in v.items():
            nested_keys.append(nested_k)
            nested_values.append({"name" : k, "valor" : nested_v})

    # create a dictionary with keys as the values of the nested_keys array
    nested_dict = defaultdict(defaultdict)
    for key, value in zip(nested_keys, nested_values):
        nested_dict[key][value["name"]] = value["valor"]
    
    return nested_dict

def parseTiemposDictToInteger(data_dict):
    parsed_dict = {}

    for key, value in data_dict.items():
        parsed_list = []
        for element in value:
            parsed_list.append(int(element))
        parsed_dict[key] = parsed_list

    return parsed_dict

def getCuantasPersonasHanAlcanzadoNivel(ultNivelCompletado, niveles):
    cuantosHanLlegadoAlNivel = defaultdict()
    
    ultNivelCopia = ultNivelCompletado.copy()

    #Contamos cuanta gente ha llegado hasta cada nivel
    for nivel in niveles:
        cuantosHanLlegadoAlNivel[nivel] = len(ultNivelCopia)
        
        keys_to_delete = [k for k, v in ultNivelCopia.items() if v == nivel]
        for k in keys_to_delete:
            del ultNivelCopia[k]

    return cuantosHanLlegadoAlNivel

def generateChartNivelesAlcanzados(niveles, ultNivelCompletado):
    cuantosHanLlegadoAlNivel = getCuantasPersonasHanAlcanzadoNivel(ultNivelCompletado, niveles)
    ultNivelCat = {}
    for level in cuantosHanLlegadoAlNivel:
        ultNivelCat[(" ".join(level.split("_")[:-1])).capitalize()] = cuantosHanLlegadoAlNivel[level]
    
    df = pd.DataFrame({"levels" : list(ultNivelCat.keys()), "nJugadores" : list(ultNivelCat.values())})
    fig = px.bar(df, x="levels", y='nJugadores', labels={'levels':'Categorías', 'nJugadores':'Número Jugadores'}, title = "Categorías superadas")
    fig.update_layout(plot_bgcolor='#C3CEDA')
    fig.update_traces(marker_color='#738FA7', hovertemplate='<b>Numero Jugadores: %{y}</b>')
    fig.write_json("./datos/" + nombreInstituto + "/plots/categoriasSuperadas.json")

def parseTiemposDictConNombresToInteger(tiemposDict):
    for l in tiemposDict:
        for j in tiemposDict[l]:
            tiemposDict[l][j] = int(tiemposDict[l][j])
    return tiemposDict

def getListaCategorias(listaNiveles):
    categorias = defaultdict()
    erroresVar = defaultdict()
    erroresCod = defaultdict()

    for n in listaNiveles:
        categorias[n.split("_")[0]] = (" ".join(n.split("_")[:-1])).capitalize()
    
    for j in resultados_Tiempos_Nivel_Jugador["erroresVar"]:
        for e in resultados_Tiempos_Nivel_Jugador["erroresVar"][j]:
            if e["level"] in erroresVar:
                erroresVar[e["level"]] += 1
            else:
                erroresVar[e["level"]] = 1

    for j in resultados_Tiempos_Nivel_Jugador["erroresCod"]:
        for e in resultados_Tiempos_Nivel_Jugador["erroresCod"][j]:
            if e["level"] in erroresCod:
                erroresCod[e["level"]] += 1
            else:
                erroresCod[e["level"]] = 1
    
    nPersonasNivel = getCuantasPersonasHanAlcanzadoNivel(ultNivelAlcanzado, tiemposMedios["listaNiveles"])
    listVar = []
    listCod = []
    for n in nPersonasNivel:
        if n in erroresVar:
            listVar.append({n : {"errores" : erroresVar[n], "jugadores" : nPersonasNivel[n]}})
        else:
            listVar.append({n : {"errores" : 0, "jugadores" : nPersonasNivel[n]}})

        if n in erroresCod:
            listCod.append({n : {"errores" : erroresCod[n], "jugadores" : nPersonasNivel[n]}})
        else:
            listCod.append({n : {"errores" : 0, "jugadores" : nPersonasNivel[n]}})


    listVar = sorted(listVar, key=lambda x: x[list(x.keys())[0]]['errores'], reverse=True)
    listCod = sorted(listCod, key=lambda x: x[list(x.keys())[0]]['errores'], reverse=True)

    with open("./datos/" + nombreInstituto + "/info.json", 'w') as json_file:
        json.dump({"categorias" : categorias, "niveles" : list(listaNiveles), "nErroresVar" : listVar, "nErroresCod" : listCod, "fechaSesion" : resultados_Tiempos_Nivel_Jugador["fechaSesion"], "nJugadores" : len(ultNivelAlcanzado)}, json_file)
    return categorias

def create_boxplots(data_dict, titulo):
    categorias = defaultdict(defaultdict)
    for d in data_dict:
        categorias[(" ".join(d.split("_")[:-1]))][d] = data_dict[d]

    for c in categorias:
        df = pd.DataFrame.from_dict(categorias[c], orient="index")
        df = df.reset_index()
        df = df.rename(columns={'index' : 'Niveles'})
        df_melted = df.melt(id_vars=['Niveles'], var_name='Jugador', value_name=titulo)
        # create boxplot
        fig = px.box(df_melted, x='Niveles', y=titulo, hover_name='Jugador', title = c.capitalize())
        fig.update_layout(plot_bgcolor='#C3CEDA')
        fig.update_traces(marker_color='#738FA7', hovertemplate='<b>%{hovertext}</b><br>' + titulo + ': %{y}')
        fig.write_json("./datos/" + nombreInstituto + "/plots/"+ c.split(" ")[0] + "_"+ titulo +".json")

def getChartsComparativas(niveles, tiemposMedios, ultNivelCompletado, jugClase, tiempoInteraccion_Interaccion):
    cuantosHanLlegadoAlNivel = getCuantasPersonasHanAlcanzadoNivel(ultNivelCompletado, niveles)
    ultNivelCat = {}
    for level in cuantosHanLlegadoAlNivel:
        ultNivelCat[(" ".join(level.split("_")[:-1])).capitalize()] = cuantosHanLlegadoAlNivel[level]

    for c in ultNivelCat:
        ultNivelCat[c] = round((ultNivelCat[c]/jugClase)*100, 2)

    categorias = defaultdict(defaultdict)
    for d in tiemposMedios:
        categorias[(" ".join(d[0].split("_")[:-1])).capitalize()][d[0]] = int(d[1])

    ### Actualizar datos globales
    JSONFile = open('./datos/datosGlobales.json')
    datosGlobales = json.load(JSONFile)
    JSONFile.close()

    if( nombreInstituto not in datosGlobales["institutos"]):
        jugTotales = jugClase + datosGlobales["numeroAlumnos"]
        for c in datosGlobales["porcentaje"]:
            if c in ultNivelCat:
                datosGlobales["porcentaje"][c] = (datosGlobales["porcentaje"][c]*datosGlobales["numeroAlumnos"]/jugTotales) + (ultNivelCat[c]*jugClase/jugTotales)

        

        for c in datosGlobales["tiempoMedio"]:
            if c in categorias:
                for l in datosGlobales["tiempoMedio"][c]:
                    if l in categorias[c]:
                        jugTotales = datosGlobales["tiempoMedio"][c][l]["jugadores"] + cuantosHanLlegadoAlNivel[l]
                        datosGlobales["tiempoMedio"][c][l]["tiempo"] = (datosGlobales["tiempoMedio"][c][l]["tiempo"]*datosGlobales["tiempoMedio"][c][l]["jugadores"]/jugTotales) + (categorias[c][l]*cuantosHanLlegadoAlNivel[l]/jugTotales)
                        datosGlobales["tiempoMedio"][c][l]["jugadores"] += cuantosHanLlegadoAlNivel[l]
                        
        datosGlobales["numeroAlumnos"] = jugClase + datosGlobales["numeroAlumnos"]        
        datosGlobales["institutos"].append(nombreInstituto)
        with open('./datos/datosGlobales.json', 'w') as json_file:
            json.dump(datosGlobales, json_file)

        clustering(tiempoInteraccion_Interaccion)


    fig = go.Figure(data=[
        go.Bar(name="Clase", x=list(ultNivelCat.keys()), y=list(ultNivelCat.values()), marker_color="#738FA7",
            hovertemplate='<b>%{y}%</b>'),
        go.Bar(name="Global", x=list(datosGlobales["porcentaje"].keys()), y=list(datosGlobales["porcentaje"].values()), marker_color="#0C4160",
            hovertemplate='<b>%{y}%</b>'),
    ])
    fig.update_layout(plot_bgcolor='#C3CEDA')
    fig.update_layout(barmode='group')
    fig.update_layout(title_text='Porcentaje Categorías Superadas VS Global')
    fig.write_json("./datos/" + nombreInstituto + "/plots/porcentajeCategorias.json")

    for c in datosGlobales["tiempoMedio"]:
        valores = []
        for l in datosGlobales["tiempoMedio"][c]:
            valores.append(datosGlobales["tiempoMedio"][c][l]["tiempo"])
        if c in categorias:
            fig = go.Figure(data=[
                go.Bar(name = "Clase", x=list(categorias[c].keys()), y=list(categorias[c].values()), marker_color="#738FA7",
                    hovertemplate='<b>%{y}s</b>'),
                go.Bar(name = "Global", x=list(datosGlobales["tiempoMedio"][c].keys()), y=list(valores), marker_color="#0C4160",
                    hovertemplate='<b>%{y}s</b>')
            ])
            fig.update_layout(plot_bgcolor='#C3CEDA')
            fig.update_layout(barmode='group')
            fig.write_json("./datos/" + nombreInstituto + "/plots/" + c.split(" ")[0].lower() + "_mediaTiemposComparativa.json")

def getMediaCategorias(df_tiempo, df_intentos, df_estrellas):
    data = defaultdict(defaultdict)
    tiempo = defaultdict()
    intentos = defaultdict()
    estrellas = defaultdict()

    nPersonasNivel = getCuantasPersonasHanAlcanzadoNivel(ultNivelAlcanzado, tiemposMedios["listaNiveles"])

    for l in df_tiempo:
        tiempo[l[0]] = l[1].toString()

    for l in df_intentos:
        intentos[l[0]] = round(l[1], 2)
    
    for l in df_estrellas:
        estrellas[l[0]] = round(l[1],2)

    for l in tiempo:
        c = l.split("_")[0]
        data[c][l] = {"tiempo" : tiempo[l], "intentos" : intentos[l], "estrellas" : estrellas[l], "participantes" : nPersonasNivel[l]}

    with open("./datos/" + nombreInstituto + "/datosMedios.json", 'w') as json_file:
        json.dump(data, json_file)

    return data

def getDatosMediosPorCategoria(df_tiempo, df_intentos):
    data = defaultdict()
    tiempo = defaultdict()
    intentos = defaultdict()

    for l in df_tiempo:
        tiempo[l[0]] = l[1]

    for l in df_intentos:
        intentos[l[0]] = round(l[1], 2)
    
    for l in tiempo:
        c = (" ".join(l.split("_")[:-1])).capitalize()
        if c in data:
            data[c] = {"tiempo" : data[c]["tiempo"] + tiempo[l], "intentos" : round(data[c]["intentos"] + intentos[l], 2)}
        else:
            data[c] = {"tiempo" : tiempo[l], "intentos" : intentos[l]}
    
    for c in data:
        data[c]["tiempo"] = data[c]["tiempo"].toString()


    JSONFile = open("./datos/" + nombreInstituto + "/datosMedios.json")
    datosMedios = json.load(JSONFile)
    JSONFile.close()

    datosMedios["general"] = data
    
    with open("./datos/" + nombreInstituto + "/datosMedios.json", 'w') as json_file:
        json.dump(datosMedios, json_file)

    return data

def clustering(df_tiempoInteraccion_Interaccion_Jugador):
    # Crear un DataFrame con los datos de los intentos medios de cada jugador

    intentosJugadores = pd.DataFrame(intentosMedios_Individual["intentosIndividual"])
    #intentosJugadores

    # Convertir columnas en filas
    df_stacked = intentosJugadores.stack().reset_index()
    df_stacked.columns = ['nivel', 'token', 'intentos']

    # Calcular promedio de intentos por jugador
    promedio_intentos = df_stacked.groupby('token')['intentos'].mean()

    # Crear DataFrame final
    df_final = pd.DataFrame({'token': promedio_intentos.index, 'intentos': promedio_intentos.values})
    df_final

    # Convertir índice de df_tiempoInteraccion_Interaccion_Jugador en columna
    df_tiempoInteraccion_Interaccion_Jugador2 = df_tiempoInteraccion_Interaccion_Jugador.stack().reset_index()
    df_tiempoInteraccion_Interaccion_Jugador2.columns = ['nivel', 'token', 'tiempo']

    # Calcular promedio de intentos por jugador
    promedio_interaccion = df_tiempoInteraccion_Interaccion_Jugador2.groupby('token')['tiempo'].mean()

    # Crear DataFrame final
    df_final2 = pd.DataFrame({'token': promedio_interaccion.index, 'tiempo': promedio_interaccion.values})

    # Unir con intentosJugadores usando merge en'token'
    df_jugadores = pd.merge(df_final, df_final2, on=['token'])


    #Añadimos los errores:
    resultados_Tiempos_Nivel_Jugador = extraerTiemposPorNivelJugador(rawData)
    res = defaultdict(int)

    for j in resultados_Tiempos_Nivel_Jugador["erroresCod"]:
        res[j] += len(resultados_Tiempos_Nivel_Jugador["erroresCod"][j])
    for j in resultados_Tiempos_Nivel_Jugador["erroresVar"]:
        res[j] += len(resultados_Tiempos_Nivel_Jugador["erroresVar"][j])

    for i, row in df_jugadores.iterrows():
        jugador = row['token']
        if jugador in res:
            df_jugadores.at[i, 'errores'] = res[jugador]
        else:
            df_jugadores.at[i, 'errores'] = 0

    niveles = list(tiemposMedios["listaNiveles"])
    nivel_numeros = {nivel: i+1 for i, nivel in enumerate(niveles)}

    ultNivelAlcanzado = getUltimoNivelAlcanzado(tiemposMedios["tiemposIndividuales"])

    for jugador, nivel in ultNivelAlcanzado.items():
        ultNivelAlcanzado[jugador] = nivel_numeros[nivel]

    for i, row in df_jugadores.iterrows():
        jugador = row['token']
        if jugador in ultNivelAlcanzado:
            df_jugadores.at[i, 'nivel'] = ultNivelAlcanzado[jugador]
        else:
            df_jugadores.at[i, 'nivel'] = 0

    # Calcular los límites de los valores atípicos
    # regla empírica, que establece que los valores atípicos se encuentran a más de 3 desviaciones estándar de la media.

    Q1_intentos = df_jugadores['intentos'].quantile(0.25)
    Q3_intentos = df_jugadores['intentos'].quantile(0.75)
    IQR_intentos = Q3_intentos - Q1_intentos
    outlier_threshold_intentos = Q3_intentos + 1.5*IQR_intentos

    Q1_tiempo = df_jugadores['tiempo'].quantile(0.25)
    Q3_tiempo = df_jugadores['tiempo'].quantile(0.75)
    IQR_tiempo = Q3_tiempo - Q1_tiempo
    outlier_threshold_tiempo = Q3_tiempo + 1.5*IQR_tiempo

    Q1_errores = df_jugadores['errores'].quantile(0.25)
    Q3_errores = df_jugadores['errores'].quantile(0.75)
    IQR_errores = Q3_errores - Q1_errores
    outlier_threshold_errores = Q3_errores + 1.5*IQR_errores

    df = df_jugadores[(df_jugadores['errores'] <= outlier_threshold_errores) & (df_jugadores['intentos'] <= outlier_threshold_intentos) & (df_jugadores['tiempo'] <= outlier_threshold_tiempo)]

    df = df.reset_index(drop=True)

    # Seleccionamos las columnas que se van a usar en el análisis
    columnas = ['intentos', 'tiempo', 'errores', 'nivel']

    # Seleccionamos los datos que se van a usar en el análisis
    data = df[columnas]

    # Estandarizamos los datos
    data_std = StandardScaler().fit_transform(data)

    # Creamos un objeto PCA con el número de componentes que queremos obtener
    pca = PCA(n_components=2)

    # Aplicamos PCA a los datos estandarizados
    componentes_principales = pca.fit_transform(data_std)

    # Creamos un nuevo DataFrame con las componentes principales y los tokens
    df_pca = pd.DataFrame(data = componentes_principales, columns = ['PC1', 'PC2'])
    df_pca['token'] = df['token']

    # Ruta del archivo CSV
    archivo_csv = './datos/jugadores_pca.csv'

    # Comprobar si el archivo CSV existe
    if os.path.isfile(archivo_csv):
        # Cargar el archivo CSV existente
        df_pca_guardado = pd.read_csv(archivo_csv)

        # Combinar los datos guardados con los nuevos jugadores
        df_pca = pd.concat([df_pca_guardado, df_pca], ignore_index=True)
    else:
        df_pca_guardado = pd.DataFrame()

    # Guardar el dataframe actualizado en el archivo CSV (agregar nuevas filas)
    df_pca.to_csv(archivo_csv, mode='a', header=not os.path.isfile(archivo_csv), index=False)

    matriz_caracteristicas = df_pca[['PC1', 'PC2']].values

    # Normalizar los datos
    matriz_caracteristicas_norm = StandardScaler().fit_transform(matriz_caracteristicas)

    n_iter = 20

    SEED_VALUE = 190463 
    np.random.seed(SEED_VALUE)
    centr_iniciais = matriz_caracteristicas_norm[np.random.choice(matriz_caracteristicas_norm.shape[0], size=5, replace=False)]

    model = KMeans(n_clusters=len(centr_iniciais), init=centr_iniciais, n_init=1,
                max_iter=n_iter, algorithm='lloyd', random_state=SEED_VALUE)

    np.random.seed(SEED_VALUE)
    agrupamento = model.fit(matriz_caracteristicas_norm)


    # Crear la figura. Si quisiesemos incluirla en la web sería guardar la figura
    """fig = go.Figure(data=[go.Scatter(x=df_pca['PC1'], y=df_pca['PC2'], mode='markers',
                                    marker=dict(size=10, color=agrupamento.labels_ + 1, opacity=0.8,
                                                colorscale='Viridis'),
                                                hovertext=df['token'] + '<br>' +
                                                'Tiempo: ' + df['tiempo'].astype(str) + '<br>' +
                                                'Nivel: ' + df['nivel'].astype(str) + '<br>' +
                                                'Intentos: ' + df['intentos'].astype(str) + '<br>' +
                                                'Errores: ' + df['errores'].astype(str))]) 

    # Configurar layout
    fig.update_layout(title='Clustering de intentos',
                    xaxis_title='PC1',
                    yaxis_title='PC2',
                    width=800, height=600)"""
    
    # Obtener los últimos valores de los clusters en agrupamento
    ultimos_clusters = agrupamento.labels_[-len(df):] +1

    # Crear una nueva columna 'cluster' en el dataframe df y asignar los valores de los clusters
    df['cluster'] = ultimos_clusters

    # Copiar la columna 'cluster' del dataframe df a df_jugadores
    df_jugadores['cluster'] = 00
    for index, row in df.iterrows():
        jugador_id = row['token']  # Obtener el ID de jugador de df
        
        # Comprobar si el ID de jugador existe en df_jugadores
        if jugador_id in df_jugadores['token'].values:
            cluster_valor = row['cluster']  # Obtener el valor de la columna "cluster" de df
            
            # Asignar el valor correspondiente a la fila correspondiente en df_jugadores
            df_jugadores.loc[df_jugadores['token'] == jugador_id, 'cluster'] = cluster_valor

    jugadoresCluster = df_jugadores.to_dict()
    jugadoresClusterDict = defaultdict()
    for j in jugadoresCluster['token']:
        jugadoresClusterDict[jugadoresCluster['token'][j]] = jugadoresCluster['cluster'][j]

    with open("./datos/" + nombreInstituto + "/cluster.json", 'w') as json_file:
        json.dump(jugadoresClusterDict, json_file)
 

#####################################################################################################################

JSONFile = open('./datos/' + nombreInstituto + '/trazasOrdenadas.json')
rawData = json.load(JSONFile)
JSONFile.close()

resultados_Tiempos_Nivel_Jugador = extraerTiemposPorNivelJugador(rawData)

with open('./datos/'+ nombreInstituto +'/erroresVar.json', 'w') as json_file:
    json.dump(resultados_Tiempos_Nivel_Jugador["erroresVar"], json_file)

with open('./datos/'+ nombreInstituto +'/erroresCod.json', "w") as f:
    json.dump(resultados_Tiempos_Nivel_Jugador["erroresCod"], f)

tiemposIntentosJugadores, tiemposIntentosJugadoresSerializable = tiempoPorNiveles_Jugador(resultados_Tiempos_Nivel_Jugador["tiempos"])
with open('./datos/'+ nombreInstituto +'/tiemposIntentosJugador.json', "w") as f:
    json.dump({"tiempo" : tiemposIntentosJugadoresSerializable, "intentos" : resultados_Tiempos_Nivel_Jugador["intentosNecesarios"]}, f)

soloPrimerExito = True
tiemposOrdenados = False
tiemposMedios = getMediaTiempoPorNivel(tiemposIntentosJugadores, soloPrimerExito, tiemposOrdenados)

ultNivelAlcanzado = getUltimoNivelAlcanzado(tiemposMedios["tiemposIndividuales"])
tiempoTotalJuego(resultados_Tiempos_Nivel_Jugador["inicioYFinJuego"], ultNivelAlcanzado)

categorias = getListaCategorias(tiemposMedios["listaNiveles"])

intentosOrdenados = False
intentosMedios_Individual = getIntentosMedios_HastaCompletarNivel(resultados_Tiempos_Nivel_Jugador["intentosNecesarios"], intentosOrdenados)

tiemposList = extraerArray(tiemposMedios["tiemposIndividuales"])
intentosList = extraerArray(intentosMedios_Individual["intentosIndividual"])

intentosListNombres = extraerArrayConNombres(intentosMedios_Individual["intentosIndividual"])
tiemposListNombres = extraerArrayConNombres(tiemposMedios["tiemposIndividuales"])

generateChartNivelesAlcanzados(tiemposMedios["listaNiveles"], ultNivelAlcanzado)

create_boxplots(intentosListNombres, 'Intentos')

create_boxplots(parseTiemposDictConNombresToInteger(tiemposListNombres), "Tiempo(s)")

getChartsComparativas(tiemposMedios["listaNiveles"], tiemposMedios["mediaTiempos"], ultNivelAlcanzado, len(ultNivelAlcanzado), resultados_Tiempos_Nivel_Jugador["tiempoInteraccion_Interaccion_Jugador"])

getMediaCategorias(tiemposMedios["mediaTiempos"], intentosMedios_Individual["intentosMedios"], tiemposMedios["mediaEstrellas"])

getDatosMediosPorCategoria(tiemposMedios["mediaTiempos"], intentosMedios_Individual["intentosMedios"])

print("Datos analizados con exito")
