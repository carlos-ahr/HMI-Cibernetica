# main.py

from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
from flask_socketio import SocketIO, emit
from flask import render_template_string
from flask import send_from_directory
from flask import session

from Config.mapa_dispositivos import cargar_dispositivos, agregar_dispositivo, eliminar_dispositivo, cargar_dispositivos, obtener_dispositivos_con_estado
from Config.analisis_red import escanear_red, analizar_dispositivo
from Config.fragmentos_registro import procesar_fragmento

from Config.proyecto_utils import obtener_dispositivos_sin_proyecto

from logs.logger_hmi import logger
from bs4 import BeautifulSoup

import paho.mqtt.client as mqtt
from datetime import datetime
import paho.mqtt.publish as publish
import subprocess
import sys
import threading
import time
import json
import os

from functools import wraps



# ----------- CONFIGURACIÓN FLASK + SOCKETIO -----------

app = Flask(__name__, template_folder='HMI_Interfaz', static_folder='Estaticos')
socketio = SocketIO(app)
app.secret_key = "clave-super-secreta-para-mensajes"


# ----------- CALLBACKS MQTT -----------------

ya_suscrito = False  

CONTRASENA_CORRECTA = "hmi1234"  # cámbiala si deseas

def on_connect(client, userdata, flags, rc):
    global ya_suscrito
    if rc == 0:
        logger.info(f"[MQTT] Conectado exitosamente con código: {rc}")
        if not ya_suscrito:
            client.subscribe("dispositivos/registro/+/+")
            ya_suscrito = True
    else:
        logger.warning(f"[MQTT] Fallo al conectar con código: {rc}")

def on_message(client, userdata, msg):
    
    origen = msg.topic
    dato = msg.payload.decode("utf-8")
    logger.debug(f"[MQTT] {origen}: {dato}")

    if origen.startswith("dispositivos/registro/"):
        procesar_fragmento(origen,dato)
            

# ----------- CLIENTE MQTT EN SEGUNDO PLANO ----------
cliente = mqtt.Client()

def iniciar_mqtt():
    cliente.on_connect = on_connect
    cliente.on_message = on_message
    cliente.connect("localhost", 1883, 60)
    cliente.loop_start()

# ----------- ENVÍO CONTINUO POR WEBSOCKET -----------

@socketio.on('connect')
def cliente_conectado():
    logger.info('Cliente WeSocket conectado.')

# ----------- RUTAS FLASK ---------------------
# ----------- INICIO HMI ---------------------
@app.route('/')
def menu_principal():
    proyectos_dir = os.path.join("HMI_Interfaz", "Proyectos")
    proyectos = []

    for archivo in os.listdir(proyectos_dir):
        if archivo.endswith(".json"):
            nombre = os.path.splitext(archivo)[0]  
            proyectos.append(nombre)

    return render_template("index.html", proyectos=proyectos)
    

@app.route("/crear_proyecto")
def crear_proyecto():
    dispositivos = obtener_dispositivos_sin_proyecto()
    return render_template("crear_proyecto.html", dispositivos=dispositivos)
 
@app.route("/crear_proyecto/<nombre>", methods=["POST"])
def crear_proyecto_dispositivo(nombre):
    ruta = f"HMI_Interfaz/Proyectos/{nombre}.json"
    if os.path.exists(ruta):
        return redirect(url_for("crear_proyecto"))  # Ya existe

    contenido_inicial = {"bloques": []}
    with open(ruta, "w") as f:
        json.dump(contenido_inicial, f, indent=2)

    return redirect(url_for("login", nombre=nombre))  # o como se llame tu editor/menu
    
@app.route('/eliminar_proyecto/<nombre>', methods=['DELETE'])
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
        
@app.route("/listar_proyectos")
def listar_proyectos():
    ruta_proyectos = os.path.join("HMI_Interfaz", "Proyectos")
    archivos = [f for f in os.listdir(ruta_proyectos) if f.endswith(".json")]
    nombres = [os.path.splitext(f)[0] for f in archivos]
    return jsonify({"proyectos": nombres})



###################################

@app.route('/logs')
def mostrar_logs():
    import glob
    import re

    # Buscar el archivo de logs más reciente
    lista_logs = sorted(glob.glob("logs/archivos/HMI_*.log"), reverse=True)
    if not lista_logs:
        return "No hay archivos de logs disponibles."

    archivo_log = lista_logs[0]
    lineas_formateadas = []

    with open(archivo_log, "r") as f:
        for linea in f:
            tipo = "info"
            if "[ERROR]" in linea or "[CRITICAL]" in linea:
                tipo = "error"
            elif "[WARNING]" in linea:
                tipo = "warning"
            elif "[DEBUG]" in linea:
                tipo = "debug"
            elif "[SUCCESS]" in linea:
                tipo = "success"
            lineas_formateadas.append({
                "texto": linea.strip(),
                "tipo": tipo
            })

    return render_template("visualizador_logs.html", logs=lineas_formateadas)

# ----------- ADMINISTRACION COMUNICACION DISPOSITIVOS -----------

@app.route('/enviar_peticion_registro', methods=['POST'])
def enviar_peticion_registro():
    try:
        publish.single("hmi/registro", "REGISTRATE", hostname="localhost")
        flash("Se ha enviado la solicitud de registro a todos los dispositivos.", "exito")
    except Exception as e:
        logger.error(f"Error al enviar solicitud de registro: {e}")
        flash(f"Error al enviar solicitud: {e}", "error")
    return redirect(url_for('pagina_administrar_proyectos'))
    
@app.route('/administrar_proyectos')
def pagina_administrar_proyectos():
    dispositivos = obtener_dispositivos_con_estado()
    logger.info("DISPOSITIVOS CON ESTADO: {dispositivos}")
    return render_template('administrar_proyectos.html', dispositivos=dispositivos)
    
@app.route('/agregar_dispositivo', methods=['POST'])
def agregar_dispositivo_desde_formulario():
    nombre = request.form['nombre']
    dispositivos = cargar_dispositivos()

    # Validación de duplicados
    if nombre in dispositivos:
        logger.warning(f"Intento de agregar dispositivo con nombre duplicado: {nombre}")
        return "Error: Ya existe un dispositivo con ese nombre."

    ip_nueva = request.form['ip']
    for dispositivo in dispositivos.values():
        if dispositivo['ip'] == ip_nueva:
            logger.warning(f"Intento de agregar dispositivo con IP duplicada: {ip_nueva}")
            return "Error: Ya existe un dispositivo con esa IP."

    # Si no hay duplicado, agregar normalmente
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
    return redirect(url_for('pagina_administrar_proyectos'))  
    
@app.route('/eliminar_dispositivo/<nombre>')
def eliminar_dispositivo_web(nombre):
    eliminado = eliminar_dispositivo(nombre)
    if eliminado:
        flash(f"Dispositivo '{nombre}' eliminado correctamente.", "exito")
    else:
        logger.error(f"No se pudo eliminar el dispositivo: {nombre}")
        flash(f"No se pudo eliminar el dispositivo '{nombre}'.", "error")
    return redirect(url_for('pagina_administrar_proyectos'))  
    
#  --------------------------------------------******************************************************  

@app.route('/estado_dispositivos')
def estado_dispositivos():
    estados = obtener_dispositivos_con_estado()
    resultado = {disp["nombre"]: disp["estado"] for disp in estados}
    return jsonify(resultado)
    
   
    
@app.route('/analisis_red')
def mostrar_analisis_red():
    return render_template('analisis_red.html')

@app.route('/escaneo_red')
def escaneo_red():
    resultados = escanear_red()
    return jsonify(resultados)
    
@app.route('/escaneo_red/<subred>')
def escaneo_red_variable(subred):
    base = f"{subred}."
    resultados = escanear_red(base=base)
    return jsonify(resultados)
    
@app.route('/arp_rapido')
def obtener_por_arp():
    from Config.analisis_red import dispositivos_por_tabla_arp
    datos = dispositivos_por_tabla_arp()
    return jsonify(datos)

@app.route('/info_dispositivo/<ip>')
def info_dispositivo(ip):
    try:
        data = analizar_dispositivo(ip)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error al analizar el dispositivo con IP {ip}: {e}")
        return jsonify({"error": str(e)})
        
@app.route('/cambiar_visibilidad/<nombre>')
def cambiar_visibilidad(nombre):
    dispositivos = cargar_dispositivos()
    if nombre in dispositivos:
        dispositivos[nombre]["visible"] = not dispositivos[nombre].get("visible", True)
        guardar_dispositivos(dispositivos)
        flash(f"Visibilidad de {nombre} actualizada.", "exito")
    else:
        flash(f"Dispositivo '{nombre}' no encontrado.", "error")
    return redirect(url_for('pagina_administrar_proyectos'))


# ----------- EDICION DISPOSITIVOS ----------------------------------------------------------------



@app.route('/Proyectos/<path:filename>')
def servir_visual(filename):
    return send_from_directory('HMI_Interfaz/Proyectos', filename)

@app.route('/editor/<nombre>')
def editor_generico(nombre):
    return render_template('editor_nuevo.html', nombre=nombre)
        
@app.route('/cargar_hmi/<nombre>', methods=['GET'])
def cargar_hmi(nombre):
    ruta = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.json")
    if not os.path.exists(ruta):
        with open(ruta, 'w') as f:
            json.dump({}, f)
    with open(ruta, 'r') as f:
        return jsonify(json.load(f))

@app.route('/guardar_hmi_json/<nombre>', methods=['POST'])
def guardar_hmi_json(nombre):
    try:
        datos = request.get_json()
        ruta = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.json")
        with open(ruta, 'w', encoding='utf-8') as archivo:
            json.dump(datos, archivo, indent=2)
        return jsonify({"guardado": True})
    except Exception as e:
        return jsonify({"guardado": False, "error": str(e)})
    
        
@app.route('/ver_hmi/<nombre>')
def ver_hmi(nombre):
    ruta = os.path.join("HMI_Interfaz", "Proyectos", f"{nombre}.html")
    if os.path.exists(ruta):
        with open(ruta, "r") as archivo:
            return archivo.read()
    return "HMI no encontrada", 404
    
@app.route('/topicos_dispositivo/<nombre>')
def topicos_dispositivo(nombre):
    dispositivos = cargar_dispositivos()
    if nombre in dispositivos:
        data = dispositivos[nombre]
        return jsonify({
            "topics_pub": data.get("topics_pub", []),
            "topics_sub": data.get("topics_sub", [])
        })
    return jsonify({"error": "No encontrado"}), 404

@app.route('/topicos_disponibles')
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
    

# RUTAS DE PLANTILLAS

@app.route('/proyecto/<nombre>/visual')
def mostrar_visual(nombre):
    return render_template('/Plantillas/visual.html', nombre=nombre)
    
@app.route("/proyecto/<nombre>/menu")
def menu_proyecto(nombre):
    return render_template("/Plantillas/menu.html", nombre=nombre)

@app.route("/proyecto/<nombre>/alarmas")
def alarmas(nombre):
    return render_template("/Plantillas/alarmas.html", nombre=nombre)

@app.route("/proyecto/<nombre>/histograma")
def histograma(nombre):
    return render_template("/Plantillas/histograma.html", nombre=nombre)

@app.route("/proyecto/<nombre>/editar")
def editor(nombre):
    return render_template("editor_nuevo.html", nombre=nombre)

# Iniciar el proceso de alarmas MQTT
def lanzar_alarmas():
    try:
        ruta_alarma = os.path.join(os.path.dirname(__file__), "Config", "alarma_mqtt.py")
        python_path = sys.executable  # Esto usa el Python del entorno activo
        subprocess.Popen([python_path, ruta_alarma])
        print("[HMI] Proceso de alarmas_mqtt.py lanzado correctamente.")
    except Exception as e:
        print(f"[HMI] Error al iniciar alarmas_mqtt.py: {e}")

# ----------- ARRANCAR MQTT Y FLASK -----------
if __name__ == '__main__':
    from werkzeug.serving import is_running_from_reloader
    if not is_running_from_reloader():
        iniciar_mqtt()
        
        #hilo_socket = threading.Thread(target=emitir_datos_websocket)
        #hilo_socket.daemon = True
        #hilo_socket.start()
        
    lanzar_alarmas()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
