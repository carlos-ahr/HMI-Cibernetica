from flask import Blueprint, jsonify
import os
import json
from Config.mapa_dispositivos import cargar_dispositivos

topicos = Blueprint('topicos', __name__)

@topicos.route('/topicos_dispositivo/<nombre>')
def topicos_dispositivo(nombre):
    dispositivos = cargar_dispositivos()
    if nombre in dispositivos:
        data = dispositivos[nombre]
        return jsonify({
            "topics_pub": data.get("topics_pub", []),
            "topics_sub": data.get("topics_sub", [])
        })
    return jsonify({"error": "No encontrado"}), 404

@topicos.route('/topicos_disponibles')
def obtener_topicos_disponibles():
    ruta_reg = os.path.join('Config', 'reg.json')
    if not os.path.exists(ruta_reg):
        return jsonify({"error": "Archivo reg.json no encontrado"}), 404

    with open(ruta_reg, 'r') as archivo:
        data = json.load(archivo)

    respuesta = {
        "topics_pub": [],
        "topics_sub": []
    }

    for dispositivo, info in data.items():
        for topico in info.get("topics_pub", []):
            respuesta["topics_pub"].append(f"{dispositivo} → {topico}")
        for topico in info.get("topics_sub", []):
            respuesta["topics_sub"].append(f"{dispositivo} → {topico}")

    return jsonify(respuesta)
