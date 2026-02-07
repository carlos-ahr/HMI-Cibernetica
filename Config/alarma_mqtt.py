# ─────────────────────────────────────────────────────────────
#  SEGUNDO SERVIDOR – MAIN MQTT  (Historial + evaluación de alarmas)
# ─────────────────────────────────────────────────────────────
import json
import os
import time
import paho.mqtt.client as mqtt
from registro_historial import (
    obtener_dispositivo_id,
    obtener_sensor_id,
    registrar_valor
)
from evaluar_alertas import evaluar_alerta

# ─────────────────────────────────────────────────────────────
# CONSTANTES Y VARIABLES GLOBALES
# ─────────────────────────────────────────────────────────────
BROKER      = "localhost"
PUERTO      = 1883
RUTA_BASE   = os.path.dirname(__file__)
RUTA_REG    = os.path.join(RUTA_BASE, "reg.json")

topico2id   = {}
topico2name = {}
topico2unit = {}
topicos_activos   = set()
ultima_mod_reg    = 0

cliente = mqtt.Client()

# ═════════════════════════════════════════════════════════════
# FUNCIÓN: cargar_dispositivos()  (dinámico)
# ═════════════════════════════════════════════════════════════
def cargar_dispositivos():
    """
    Lee reg.json.  Si hay cambios:
      • Actualiza diccionarios de mapeo.
      • Suscribe a nuevos tópicos.
      • Des-suscribe de tópicos que ya no existen.
    """
    global ultima_mod_reg, topicos_activos

    try:
        if not os.path.exists(RUTA_REG):
            print("[REG] reg.json no encontrado")
            return

        nueva_mod  = os.path.getmtime(RUTA_REG)
        if nueva_mod == ultima_mod_reg:
            return  # Sin cambios

        with open(RUTA_REG, "r", encoding="utf-8") as f:
            reg = json.load(f)

        nuevos = set()
        t2id, t2name, t2unit = {}, {}, {}

        for ident, datos in reg.items():
            for sensor in datos.get("topics_pub", []):
                if isinstance(sensor, dict):
                    topico = sensor.get("topico")
                    nombre = sensor.get("nombre", "Sensor")
                    unidad = sensor.get("unidad", "")
                else:
                    topico = sensor
                    nombre = topico.split("/")[-1].capitalize()
                    unidad = ""

                if topico:
                    t2id[topico]   = ident
                    t2name[topico] = nombre
                    t2unit[topico] = unidad
                    nuevos.add(topico)

        # ── (1) Suscribir nuevos tópicos
        nuevos_a_suscribir = nuevos - topicos_activos
        for t in nuevos_a_suscribir:
            cliente.subscribe(t)
            print(f"  [+] Suscrito: {t}")

        # ── (2) Des-suscribir tópicos eliminados
        eliminados = topicos_activos - nuevos
        for t in eliminados:
            cliente.unsubscribe(t)
            print(f"  [–] Des-suscrito: {t}")

        # Actualizar estructuras globales
        topicos_activos.clear()
        topicos_activos.update(nuevos)
        topico2id.clear();   topico2id.update(t2id)
        topico2name.clear(); topico2name.update(t2name)
        topico2unit.clear(); topico2unit.update(t2unit)

        ultima_mod_reg = nueva_mod
        print(f"[REG] reg.json cargado: {len(topicos_activos)} tópicos activos")

    except (json.JSONDecodeError, IOError) as e:
        print(f"[ERROR] cargando reg.json: {e}")

# ═════════════════════════════════════════════════════════════
# CALLBACKS MQTT
# ═════════════════════════════════════════════════════════════
def on_connect(client, userdata, flags, rc):
    estado = "OK" if rc == 0 else f"ERROR {rc}"
    print(f"[MQTT] Conexión al broker: {estado}")
    cargar_dispositivos()  # Suscribe a los tópicos iniciales

def on_message(client, userdata, msg):
    try:
        valor = float(msg.payload.decode())
    except ValueError:
        print(f"[WARN] Valor no numérico en {msg.topic}: {msg.payload}")
        return

    ident  = topico2id.get(msg.topic, "DESCONOCIDO")
    nombre = topico2name.get(msg.topic, "Sensor")
    unidad = topico2unit.get(msg.topic, "")

    dispositivo_id = obtener_dispositivo_id(ident)
    sensor_id      = obtener_sensor_id(dispositivo_id, nombre, msg.topic, unidad)
    registrar_valor(sensor_id, valor)

    for tipo, mensaje in evaluar_alerta(msg.topic, valor, ident, nombre, unidad):
        print(f"[ALERTA] {tipo.upper()} --> {mensaje}")

def on_disconnect(client, userdata, rc):
    print(f"[MQTT] Desconectado (rc={rc}). Reintentando en 5 s…")
    time.sleep(5)
    try:
        client.reconnect()
    except Exception as e:
        print(f"[MQTT] Error al reconectar: {e}")

# ═════════════════════════════════════════════════════════════
# INICIO
# ═════════════════════════════════════════════════════════════
cliente.on_connect    = on_connect
cliente.on_message    = on_message
cliente.on_disconnect = on_disconnect
cliente.connect(BROKER, PUERTO, keepalive=60)

print("[ALARMAS] Servidor MQTT de alarmas iniciado (modo dinámico)")

# Hilo MQTT + bucle de vigilancia de reg.json
cliente.loop_start()
try:
    while True:
        cargar_dispositivos()
        time.sleep(5)  # Periodo de verificación
except KeyboardInterrupt:
    print("\n[ALARMAS] Apagando servidor MQTT…")
finally:
    cliente.loop_stop()
    cliente.disconnect()
