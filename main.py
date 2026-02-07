# main.py

from flask import Flask
from flask_socketio import SocketIO
from rutas import registrar_rutas
from mqtt_handler import iniciar_mqtt
from websocket_handler import configurar_websocket
from Config.postgres_registro_h import iniciar_registro
import subprocess
import sys
import threading
import time
import json
import os


app = Flask(__name__, template_folder='HMI_Interfaz', static_folder='Estaticos')
app.secret_key = "clave-super-secreta-para-mensajes"

socketio = SocketIO(app)
configurar_websocket(socketio)
registrar_rutas(app)

def iniciar_registros_background():
    try:
        iniciar_registro()
        print("[OK_PG] Registro PostgreSQL iniciado")
    except Exception as e:
        print(f"[Error] Registro PostgreSQL no pudo iniciar: {e}")

# Iniciar el proceso de alarmas MQTT
def lanzar_alarmas():
    try:
        ruta_alarma = os.path.join(os.path.dirname(__file__), "Config", "alarma_mqtt.py")
        python_path = sys.executable  # Esto usa el Python del entorno activo
        subprocess.Popen([python_path, ruta_alarma])
        print("[HMI] Proceso de alarmas_mqtt.py lanzado correctamente.")
    except Exception as e:
        print(f"[HMI] Error al iniciar alarmas_mqtt.py: {e}")

if __name__ == '__main__':
    from werkzeug.serving import is_running_from_reloader
    if not is_running_from_reloader():
        
        iniciar_registros_background()
        lanzar_alarmas()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
