import json

def myFunc(e):
    return e['timestamp']

JSONFile = open('./data/trazasJuntas.json')
rawData = json.load(JSONFile)

rawData.sort(key = myFunc)
jsonString = json.dumps(rawData)

jsonFile = open("./data/trazasOrdenadas.json", "w")
jsonFile.write(jsonString)
jsonFile.close()