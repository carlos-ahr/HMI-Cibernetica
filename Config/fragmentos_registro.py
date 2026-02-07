import json
import sys
import os
import time
# Asegura que podamos importar módulos del proyecto
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Config.mapa_dispositivos import agregar_dispositivo
from logs.logger_hmi import logger  

# Diccionarios globales
fragmentos_pendientes = {}
tiempos_fragmentos = {}  # Guarda cuándo llegó el primer fragmento

# Tiempo máximo de espera en segundos
TIMEOUT_FRAGMENTOS = 120

def limpiar_fragmentos_expirados(timeout=TIMEOUT_FRAGMENTOS):
    ahora = time.time()
    expirados = []

    for dispositivo_id, timestamp in tiempos_fragmentos.items():
        if ahora - timestamp > timeout:
            expirados.append(dispositivo_id)

    for dispositivo_id in expirados:
        fragmentos_pendientes.pop(dispositivo_id, None)
        tiempos_fragmentos.pop(dispositivo_id, None)
        logger.warning(f"Fragmentos expirados eliminados para '{dispositivo_id}' (timeout de {timeout}s)")


def procesar_fragmento(topic, payload):
    logger.warning(f"[DEBUG] procesar_fragmento llamado con: {topic}")
    limpiar_fragmentos_expirados()  # Limpia antes de procesar

    partes = topic.split("/")
    if len(partes) < 4:
        logger.warning(f"Tópico incompleto recibido: {topic}")
        return

    dispositivo_id = partes[2]
    subtopico = partes[3]
    
    if subtopico == "final":
        logger.warning(f"DEBUG: final recibido para {dispositivo_id}")
        logger.warning(f"DEBUG: claves activas: {list(fragmentos_pendientes.keys())}")
        if dispositivo_id in fragmentos_pendientes:
            
            try:
                reconstruido = "".join(fragmentos_pendientes[dispositivo_id])
                logger.debug(f"JSON RECONSTRUIDO COMPLETO para {dispositivo_id}:\n{reconstruido}")
                print(f"[DEBUG - JSON]: {reconstruido}")
                data = json.loads(reconstruido)

                if "ip" in data and "id" in data:
                    agregar_dispositivo(dispositivo_id, data)
                    logger.info(f"Dispositivo '{dispositivo_id}' registrado correctamente.")
                else:
                    logger.error(f"JSON incompleto: falta 'ip' o 'id' en {dispositivo_id}")

            except Exception as e:
                logger.exception(f"Error al procesar JSON de {dispositivo_id}: {e}")
            finally:
                del fragmentos_pendientes[dispositivo_id]
                tiempos_fragmentos.pop(dispositivo_id, None)
        else:
            logger.warning(f"Se recibió 'final' sin fragmentos previos para {dispositivo_id}")
    else:
        try:
            numero = int(subtopico)
            if dispositivo_id not in fragmentos_pendientes:
                fragmentos_pendientes[dispositivo_id] = []
                tiempos_fragmentos[dispositivo_id] = time.time()  # Se guarda el tiempo del primer fragmento

            # Asegurar que la lista tenga espacio suficiente
            while len(fragmentos_pendientes[dispositivo_id]) < numero:
                fragmentos_pendientes[dispositivo_id].append("")

            fragmentos_pendientes[dispositivo_id][numero - 1] = payload
            logger.debug(f"Fragmento #{numero} recibido de {dispositivo_id}")
        except ValueError:
            logger.warning(f"Subtópico no válido (no es número): {subtopico} del tópico {topic}")
