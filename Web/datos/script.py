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

sys.stdout.flush()
print("Analizando datos...")

nombreInstituto = sys.argv[1]

if not os.path.exists("./datos/" + nombreInstituto + "/plots"):
    os.makedirs("./datos/" + nombreInstituto + "/plots")

def extraerTiemposPorNivelJugador(rawData):
    
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

    erLevel = re.compile(r'\blevel$\b')
    erIdLevel = re.compile(r'/')
    
    erInitialized = re.compile(r'\binitialized$\b')
    erCompleted = re.compile(r'\bcompleted$\b')
    erAccessed = re.compile(r'\baccessed$\b')
    erProgressed = re.compile(r'\bprogressed$\b')

    erSeriousGame = re.compile(r'\bserious-game$\b')  
    erCategoryMain = re.compile(r'\bcategories_main$\b') 

    estandarNombreVar = re.compile(r'^_*[a-zA-Z][a-zA-Z0-9_]*$')
 
    
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
                    else:
                        intentosNecesarios[name][levelCode][-1]["intentos"] += 1

                elif erProgressed.search(verb):
                    cod = ET.fromstring(evento['result']['extensions']['code'])
                    codJugadores[name] = cod
                    codUltNivel[name] = levelCode

                elif erCompleted.search(verb):
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
        
        elif erSeriousGame.search(obj) and erInitialized.search(verb):
            if name in inicioYFinJuego:
                inicioYFinJuego[name].append({"inicio" : timestamp, "fin" : None})
            else:
                inicioYFinJuego[name] = [{"inicio" : timestamp, "fin" : None}]
        
        if not(erAccessed.search(verb) and erCategoryMain.search(objectId)):
            try:
                inicioYFinJuego[name][-1]["fin"] = timestamp
            except:
                None
    
    return {"tiempos" : tiempos, "intentosNecesarios" : intentosNecesarios, "inicioYFinJuego" : inicioYFinJuego, "erroresVar" : erroresVar, "erroresCod" : erroresCod}

def tiempoPorNiveles_Jugador(data):
    tiemposJugados = defaultdict(defaultdict)
    for player in data:
        for level in data[player]:
            for times in data[player][level]:
                if times["fin"] != None: #Si no se aborto el intento del nivel
                    timeDifference = Tiempo(times["ini"], times["fin"])
                    if level in tiemposJugados[player]:
                        tiemposJugados[player][level].append({"time" : timeDifference, "stars" : times["stars"]})
                    else:
                        tiemposJugados[player][level] = [{"time" : timeDifference, "stars" : times["stars"]}]
    return tiemposJugados

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
                if t["stars"] != -1:
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
        json.dump({"categorias" : categorias, "niveles" : list(listaNiveles), "nErroresVar" : listVar, "nErroresCod" : listCod}, json_file)
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

def getChartsComparativas(niveles, tiemposMedios, ultNivelCompletado, jugClase):
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

#####################################################################################################################

JSONFile = open('./datos/' + nombreInstituto + '/trazasOrdenadas.json')
rawData = json.load(JSONFile)
JSONFile.close()

resultados_Tiempos_Nivel_Jugador = extraerTiemposPorNivelJugador(rawData)

with open('./datos/'+ nombreInstituto +'/erroresVar.json', 'w') as json_file:
    json.dump(resultados_Tiempos_Nivel_Jugador["erroresVar"], json_file)

with open('./datos/'+ nombreInstituto +'/erroresCod.json', "w") as f:
    json.dump(resultados_Tiempos_Nivel_Jugador["erroresCod"], f)

tiemposIntentosJugadores = tiempoPorNiveles_Jugador(resultados_Tiempos_Nivel_Jugador["tiempos"])

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

getChartsComparativas(tiemposMedios["listaNiveles"], tiemposMedios["mediaTiempos"], ultNivelAlcanzado, len(ultNivelAlcanzado))

getMediaCategorias(tiemposMedios["mediaTiempos"], intentosMedios_Individual["intentosMedios"], tiemposMedios["mediaEstrellas"])

getDatosMediosPorCategoria(tiemposMedios["mediaTiempos"], intentosMedios_Individual["intentosMedios"])

print("Datos analizados con exito")
