import paho.mqtt.client as mqtt
from Config.fragmentos_registro import procesar_fragmento
from logs.logger_hmi import logger

ya_suscrito = False
cliente = mqtt.Client()

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
        procesar_fragmento(origen, dato)

def iniciar_mqtt():
    cliente.on_connect = on_connect
    cliente.on_message = on_message
    cliente.connect("localhost", 1883, 60)
    cliente.loop_start()
