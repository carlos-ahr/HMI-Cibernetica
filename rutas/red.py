from flask import Blueprint, jsonify, render_template
from Config.analisis_red import (
    escanear_red,
    analizar_dispositivo,
    dispositivos_por_tabla_arp
)
from logs.logger_hmi import logger

red = Blueprint("red", __name__)

@red.route('/analisis_red')
def mostrar_analisis_red():
    return render_template('analisis_red.html')

@red.route('/escaneo_red')
def escaneo_red_automatica():
    resultados = escanear_red()
    return jsonify(resultados)

@red.route('/escaneo_red/<subred>')
def escaneo_red_variable(subred):
    base = f"{subred}."
    resultados = escanear_red(base=base)
    return jsonify(resultados)

@red.route('/arp_rapido')
def obtener_por_arp():
    datos = dispositivos_por_tabla_arp()
    return jsonify(datos)

@red.route('/info_dispositivo/<ip>')
def info_dispositivo(ip):
    try:
        data = analizar_dispositivo(ip)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error al analizar el dispositivo con IP {ip}: {e}")
        return jsonify({"error": str(e)})
