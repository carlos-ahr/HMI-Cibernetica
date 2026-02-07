from flask import Blueprint, render_template, request, redirect, url_for, jsonify
import os
import json

from Config.proyecto_utils import obtener_dispositivos_sin_proyecto

proyectos = Blueprint('proyectos', __name__)

@proyectos.route("/crear_proyecto")
def crear_proyecto():
    dispositivos = obtener_dispositivos_sin_proyecto()
    return render_template("crear_proyecto.html", dispositivos=dispositivos)

@proyectos.route("/crear_proyecto/<nombre>", methods=["POST"])
def crear_proyecto_dispositivo(nombre):
    ruta = f"HMI_Interfaz/Proyectos/{nombre}.json"
    if os.path.exists(ruta):
        return redirect(url_for("proyectos.crear_proyecto"))  # Ya existe

    contenido_inicial = {"bloques": []}
    with open(ruta, "w") as f:
        json.dump(contenido_inicial, f, indent=2)

    return redirect(url_for("auth.login", nombre=nombre))  # Ajusta si cambias el flujo

@proyectos.route('/eliminar_proyecto/<nombre>', methods=['DELETE'])
def eliminar_proyecto(nombre):
    ruta = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.json")
    try:
        if os.path.exists(ruta):
            os.remove(ruta)
            return jsonify({"eliminado": True})
        else:
            return jsonify({"eliminado": False, "error": "Archivo no encontrado"})
    except Exception as e:
        return jsonify({"eliminado": False, "error": str(e)})

@proyectos.route("/listar_proyectos")
def listar_proyectos():
    ruta_proyectos = os.path.join("HMI_Interfaz", "Proyectos")
    archivos = [f for f in os.listdir(ruta_proyectos) if f.endswith(".json")]
    nombres = [os.path.splitext(f)[0] for f in archivos]
    return jsonify({"proyectos": nombres})
