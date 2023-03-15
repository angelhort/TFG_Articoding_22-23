import json

JSONFile = open('./datosGlobalesEMPTY.json')
datosGlobales = json.load(JSONFile)
JSONFile.close()

for c in datosGlobales['tiempoMedio']:
    for l in datosGlobales['tiempoMedio'][c]:
        datosGlobales['tiempoMedio'][c][l] = {'tiempo' : 0, 'jugadores' : 0}

with open('./datosGlobalesEMPTY.json', 'w') as json_file:
    json.dump(datosGlobales, json_file)