from flask import Blueprint, render_template, request, jsonify, send_file
import os
import json
import sqlite3
from datetime import datetime

ruta_alarmas = Blueprint('ruta_alarmas', __name__)

# ─────────────────────────────────────────────────────────────
# Rutas absolutas
# ─────────────────────────────────────────────────────────────
ruta_reg_json = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Config', 'reg.json'))
ruta_config_alertas = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'BaseDatos', 'alarmas', 'config_alertas.json'))
ruta_db_alarmas = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'BaseDatos', 'alarmas', 'alarmas_eventos.db'))

# ─────────────────────────────────────────────────────────────
# Página web de configuración de alertas para un proyecto
# ─────────────────────────────────────────────────────────────
@ruta_alarmas.route('/proyecto/<nombre>/alarmas')
def mostrar_pagina_alarmas(nombre):
    return render_template('/Plantillas/alarmas.html', nombre=nombre)

# ─────────────────────────────────────────────────────────────
# Servir el archivo reg.json (con tópicos de cada dispositivo)
# ─────────────────────────────────────────────────────────────
@ruta_alarmas.route("/reg_json")
def servir_reg_json():
    return send_file(ruta_reg_json)

# ─────────────────────────────────────────────────────────────
# Guardar configuración de alertas (por dispositivo)
# ─────────────────────────────────────────────────────────────
@ruta_alarmas.route("/guardar_json_alertas", methods=["POST"])
def guardar_json_alertas():
    nuevo_fragmento = request.get_json()

    if not nuevo_fragmento:
        return jsonify({"status": "error", "mensaje": "JSON vacío"}), 400

    try:
        # Cargar configuración existente
        if os.path.exists(ruta_config_alertas):
            with open(ruta_config_alertas, "r", encoding="utf-8") as archivo:
                config_actual = json.load(archivo)
        else:
            config_actual = {}

        # Agregar timestamp de modificación y fusionar
        for dispositivo, config in nuevo_fragmento.items():
            config["ultima_modificacion"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            config_actual[dispositivo] = config

        # Guardar el JSON completo
        with open(ruta_config_alertas, "w", encoding="utf-8") as archivo:
            json.dump(config_actual, archivo, indent=4, ensure_ascii=False)

        return jsonify({"status": "ok", "mensaje": "Configuración guardada correctamente"})

    except Exception as e:
        return jsonify({"status": "error", "mensaje": str(e)}), 500

# ─────────────────────────────────────────────────────────────
# Cargar configuración de alertas para un proyecto específico
# ─────────────────────────────────────────────────────────────
@ruta_alarmas.route("/proyecto/<nombre>/config_alertas")
def obtener_config_alertas(nombre):
    try:
        if not os.path.exists(ruta_config_alertas):
            return jsonify({})  # Retorna vacío si el archivo no existe

        with open(ruta_config_alertas, "r", encoding="utf-8") as archivo:
            config = json.load(archivo)

        # Devuelve solo la configuración del proyecto solicitado
        config_proyecto = config.get(nombre, {})
        return jsonify(config_proyecto)

    except Exception as e:
        print(f"[ERROR] al cargar config_alertas.json: {e}")
        return jsonify({"error": str(e)}), 500

# ─────────────────────────────────────────────────────────────
# Página de historial de eventos de alarmas
# ─────────────────────────────────────────────────────────────
@ruta_alarmas.route("/proyecto/<nombre>/historial_alarmas")
def historial_alarmas(nombre):
    try:
        print(f"[HISTORIAL] Cargando historial para el proyecto: {nombre}")

        conn = sqlite3.connect(ruta_db_alarmas)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT timestamp, topico, tipo, mensaje, color
            FROM eventos_alarma
            WHERE dispositivo = ?
            ORDER BY timestamp DESC
            LIMIT 100
        """, (nombre,))
        filas = cursor.fetchall()
        conn.close()

        eventos = [
            {
                "fecha_hora": fila[0],
                "topico": fila[1],
                "estado": fila[2],
                "mensaje": fila[3],
                "color": fila[4]
            }
            for fila in filas
        ]

        return render_template("Plantillas/historial_alarmas.html", eventos=eventos, nombre=nombre)

    except Exception as e:
        print(f"[ERROR HISTORIAL] {e}")
        return f"<h3>Error al cargar historial de alarmas: {e}</h3>", 500
