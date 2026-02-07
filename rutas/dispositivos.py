from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from Config.mapa_dispositivos import (
    cargar_dispositivos,
    agregar_dispositivo,
    eliminar_dispositivo,
    obtener_dispositivos_con_estado
)
from Config.proyecto_utils import obtener_dispositivos_sin_proyecto
import paho.mqtt.publish as publish
from logs.logger_hmi import logger

dispositivos = Blueprint("dispositivos", __name__)

@dispositivos.route('/administrar_proyectos')
def pagina_administrar_proyectos():
    dispositivos_con_estado = obtener_dispositivos_con_estado()
    logger.info("DISPOSITIVOS CON ESTADO: %s", dispositivos_con_estado)
    return render_template('administrar_proyectos.html', dispositivos=dispositivos_con_estado)

@dispositivos.route('/agregar_dispositivo', methods=['POST'])
def agregar_dispositivo_desde_formulario():
    nombre = request.form['nombre']
    dispositivos = cargar_dispositivos()

    if nombre in dispositivos:
        logger.warning(f"Intento de agregar dispositivo con nombre duplicado: {nombre}")
        return "Error: Ya existe un dispositivo con ese nombre."

    ip_nueva = request.form['ip']
    for dispositivo in dispositivos.values():
        if dispositivo['ip'] == ip_nueva:
            logger.warning(f"Intento de agregar dispositivo con IP duplicada: {ip_nueva}")
            return "Error: Ya existe un dispositivo con esa IP."

    datos = {
        "ip": ip_nueva,
        "puerto": int(request.form['puerto']),
        "tipo": request.form['tipo'],
        "comunicacion": request.form['comunicacion'],
        "senales": {
            "analogicos": int(request.form['analogicos']),
            "digitales_entrada": int(request.form['digitales_entrada']),
            "digitales_salida": int(request.form['digitales_salida'])
        }
    }

    agregar_dispositivo(nombre, datos)
    return redirect(url_for('dispositivos.pagina_administrar_proyectos'))

@dispositivos.route('/eliminar_dispositivo/<nombre>')
def eliminar_dispositivo_web(nombre):
    eliminado = eliminar_dispositivo(nombre)
    if eliminado:
        flash(f"Dispositivo '{nombre}' eliminado correctamente.", "exito")
    else:
        logger.error(f"No se pudo eliminar el dispositivo: {nombre}")
        flash(f"No se pudo eliminar el dispositivo '{nombre}'.", "error")
    return redirect(url_for('dispositivos.pagina_administrar_proyectos'))

@dispositivos.route('/cambiar_visibilidad/<nombre>')
def cambiar_visibilidad(nombre):
    dispositivos_cargados = cargar_dispositivos()
    if nombre in dispositivos_cargados:
        dispositivos_cargados[nombre]["visible"] = not dispositivos_cargados[nombre].get("visible", True)
        guardar_dispositivos(dispositivos_cargados)
        flash(f"Visibilidad de {nombre} actualizada.", "exito")
    else:
        flash(f"Dispositivo '{nombre}' no encontrado.", "error")
    return redirect(url_for('dispositivos.pagina_administrar_proyectos'))

@dispositivos.route('/enviar_peticion_registro', methods=['POST'])
def enviar_peticion_registro():
    try:
        publish.single("hmi/registro", "REGISTRATE", hostname="localhost")
        flash("Se ha enviado la solicitud de registro a todos los dispositivos.", "exito")
    except Exception as e:
        logger.error(f"Error al enviar solicitud de registro: {e}")
        flash(f"Error al enviar solicitud: {e}", "error")
    return redirect(url_for('dispositivos.pagina_administrar_proyectos'))

@dispositivos.route('/estado_dispositivos')
def estado_dispositivos():
    estados = obtener_dispositivos_con_estado()
    resultado = {disp["nombre"]: disp["estado"] for disp in estados}
    return jsonify(resultado)
