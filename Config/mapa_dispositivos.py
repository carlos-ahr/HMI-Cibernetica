import json
import os
import socket
import platform
import subprocess
import sys

# Ruta base del proyecto para permitir importaciones cruzadas
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from logs.logger_hmi import logger

RUTA_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Config/reg.json"))


def asegurar_json():
    if not os.path.exists(RUTA_JSON):
        with open(RUTA_JSON, "w") as f:
            json.dump({}, f)
        logger.info("Archivo dispositivos.json creado vacío.")

def cargar_dispositivos():
    try:
        with open(RUTA_JSON, "r") as archivo:
            dispositivos = json.load(archivo)
        logger.debug(f"Archivo dispositivos.json cargado con {len(dispositivos)} dispositivos.")
        return dispositivos
    except Exception as e:
        logger.error(f"No se pudo cargar dispositivos.json: {e}")
        return {}

def guardar_json(diccionario):
    try:
        with open(RUTA_JSON, "w") as archivo:
            json.dump(diccionario, archivo, indent=4)
        logger.debug("Archivo dispositivos.json guardado correctamente.")
    except Exception as e:
        logger.error(f"Error al guardar dispositivos.json: {e}")

def agregar_dispositivo(nombre, datos):
    dispositivos = cargar_dispositivos()
    nueva_ip = datos.get("ip")

    if not nueva_ip:
        logger.error(f"Dispositivo '{nombre}' no tiene IP, no se puede registrar.")
        return False

    campos_importantes = ["hostname", "tipo", "comunicacion", "topics_pub", "topics_sub"]

    for otro_nombre, info in dispositivos.items():
        if info.get("ip") == nueva_ip:
            cambios_detectados = []

            for campo in campos_importantes:
                valor_anterior = info.get(campo)
                valor_nuevo = datos.get(campo)
                if valor_anterior != valor_nuevo:
                    cambios_detectados.append((campo, valor_anterior, valor_nuevo))

            if cambios_detectados:
                logger.warning(f"Se detectaron cambios en el dispositivo con IP {nueva_ip}:")
                for campo, antes, despues in cambios_detectados:
                    logger.warning(f" - {campo}: antes='{antes}', ahora='{despues}'")

            if otro_nombre != nombre:
                logger.info(f"Actualizando nombre del dispositivo de '{otro_nombre}' a '{nombre}' por coincidencia de IP.")
                dispositivos.pop(otro_nombre)

            dispositivos[nombre] = datos
            guardar_json(dispositivos)
            logger.info(f"Dispositivo '{nombre}' actualizado con IP {nueva_ip}.")
            return True

    # Si la IP no estaba registrada
    dispositivos[nombre] = datos
    guardar_json(dispositivos)
    logger.info(f"Dispositivo '{nombre}' registrado con nueva IP {nueva_ip}.")
    return True
    
def eliminar_dispositivo(nombre):
    dispositivos = cargar_dispositivos()
    if nombre in dispositivos:
        del dispositivos[nombre]
        guardar_json(dispositivos)
        logger.info(f"Dispositivo '{nombre}' eliminado.")
        return True
    logger.warning(f"Intento de eliminar dispositivo no existente: '{nombre}'.")
    return False

# ---------- Hacer ping a una IP ----------
def hacer_ping(ip):
    try:
        resultado = subprocess.run(['ping', '-c', '1', '-W', '1', ip],
                                   stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL)
        return resultado.returncode == 0
    except Exception as e:
        logger.warning(f"Fallo al hacer ping a {ip}: {e}")
        return False

# ---------- Verificar estado de todos los dispositivos ----------
def obtener_dispositivos_con_estado():
    dispo = cargar_dispositivos()
    resul = []

    logger.info("Verificando estado de conexión de los dispositivos...")

    for nombre, info in dispo.items():
        ip = info.get("ip")
        puerto = info.get("puerto", 5000)
        esta_activo = hacer_ping(ip)
        estado = "Conectado" if esta_activo else "Desconectado"

        logger.debug(f"Dispositivo: {nombre} | IP: {ip} | Estado: {estado}")

        resul.append({
            "nombre": nombre,
            "info": info,
            "estado": estado
        })

    return resul

        
def get_info(nombre):
    dispositivos = cargar_dispositivos()
    return dispositivos.get(nombre, None)

def get_ip_puerto(nombre):
    info = get_info(nombre)
    if info:
        return info.get("ip"), info.get("puerto")
    return None, None

def listar_dispositivos():
    dispositivos = cargar_dispositivos()
    return list(dispositivos.keys())

