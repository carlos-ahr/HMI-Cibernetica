# routes/visual.py

from flask import Blueprint, render_template, request, jsonify, send_from_directory
import os
import json

visual = Blueprint('visual', __name__)

@visual.route('/Proyectos/<path:filename>')
def servir_visual(filename):
    return send_from_directory('HMI_Interfaz/Proyectos', filename)

@visual.route('/editor/<nombre>')
def editor_generico(nombre):
    return render_template('editor_nuevo.html', nombre=nombre)

@visual.route('/cargar_hmi/<nombre>', methods=['GET'])
def cargar_hmi(nombre):
    ruta = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.json")
    if not os.path.exists(ruta):
        with open(ruta, 'w') as f:
            json.dump({}, f)
    with open(ruta, 'r') as f:
        return jsonify(json.load(f))

@visual.route('/guardar_hmi_json/<nombre>', methods=['POST'])
def guardar_hmi_json(nombre):
    try:
        datos = request.get_json()
        ruta = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.json")
        with open(ruta, 'w', encoding='utf-8') as archivo:
            json.dump(datos, archivo, indent=2)
        return jsonify({"guardado": True})
    except Exception as e:
        return jsonify({"guardado": False, "error": str(e)})

@visual.route('/ver_hmi/<nombre>')
def ver_hmi(nombre):
    ruta = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.html")
    if os.path.exists(ruta):
        with open(ruta, "r") as archivo:
            return archivo.read()
    return "HMI no encontrada", 404
    

@visual.route('/actualizar_bloque/<nombre>', methods=['POST'])
def actualizar_bloque(nombre):
    data = request.get_json()
    topico = data.get("topico")
    clave = data.get("clave")         # por ejemplo: "valor", "estado"
    nuevo_valor = data.get("valor")

    ruta_json = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.json")
    if not os.path.exists(ruta_json):
        return jsonify({"ok": False, "error": "Archivo no encontrado"})

    with open(ruta_json, "r") as f:
        contenido = json.load(f)

    actualizado = False
    for bloque in contenido.get("bloques", []):
        if (bloque.get("topicoSub") == topico or bloque.get("topicoPub") == topico):
            bloque[clave] = nuevo_valor
            actualizado = True
            break

    if not actualizado:
        return jsonify({"ok": False, "error": "Bloque no encontrado"})

    with open(ruta_json, "w") as f:
        json.dump(contenido, f, indent=2)

    return jsonify({"ok": True})
