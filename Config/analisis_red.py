#analisis_red.py

import subprocess
import socket
import sys
import os
import re
from concurrent.futures import ThreadPoolExecutor

# Ruta base del proyecto para permitir importaciones cruzadas
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from Config.mapa_dispositivos import cargar_dispositivos
from logs.logger_hmi import logger

def escanear_ip(ip, puerto, timeout=0.2):
    try:
        with socket.create_connection((ip, puerto), timeout=timeout):
            return (ip, True)
    except:
        return (ip, False)

def escanear_red(base="192.168.1.", timeout=0.2, max_threads=50):
    dispositivos = cargar_dispositivos()
    rango = range(1, 255)

    resultados = {
        "activos": [],
        "inactivos": [],
        "nuevos_no_registrados": []
    }

    conocidos = {
        info["ip"]: info.get("puerto", 5000)
        for info in dispositivos.values()
    }

    tareas = []
    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        for i in rango:
            ip = f"{base}{i}"
            puerto = conocidos.get(ip, 5000)
            tareas.append(executor.submit(escanear_ip, ip, puerto, timeout))

        for tarea in tareas:
            ip, esta_activo = tarea.result()
            if esta_activo:
                if ip in conocidos:
                    resultados["activos"].append(ip)
                else:
                    resultados["nuevos_no_registrados"].append(ip)
            else:
                if ip in conocidos:
                    resultados["inactivos"].append(ip)

    logger.info(f"[Análisis Red] Resultados: {resultados}")
    return resultados


def dispositivos_por_tabla_arp():
    dispositivos_registrados = {
        info["ip"]
        for info in cargar_dispositivos().values()
    }

    detectados = set()

    try:
        salida = subprocess.check_output(['ip', 'neigh'], text=True)
        lineas = salida.splitlines()
        for linea in lineas:
            partes = linea.strip().split()
            if "lladdr" in partes and ("REACHABLE" in partes or "STALE" in partes or "DELAY" in partes):
                detectados.add(partes[0])
        logger.debug(f"[ARP] Dispositivos detectados por ip neigh: {detectados}")
    except Exception as e:
        logger.warning(f"[ARP] Falló ip neigh: {e}")
        try:
            salida = subprocess.check_output(['arp', '-a'], text=True)
            ips = re.findall(r"\d+\.\d+\.\d+\.\d+", salida)
            detectados.update(ips)
            logger.debug(f"[ARP] Detectados por arp -a: {ips}")
        except Exception as e2:
            logger.error(f"[ARP] Falló también arp -a: {e2}")

    no_registrados = detectados - dispositivos_registrados
    return sorted(no_registrados)


def analizar_dispositivo(ip):
    info = {
        "ip": ip,
        "hostname": None,
        "mac": None,
        "puertos_abiertos": []
    }

    try:
        info["hostname"] = socket.gethostbyaddr(ip)[0]
    except:
        info["hostname"] = "Desconocido"

    try:
        salida = subprocess.check_output(["arp", "-a"], text=True)
        patron = rf"{ip}.*?([0-9a-f]{{2}}:[0-9a-f]{{2}}:[0-9a-f]{{2}}:[0-9a-f]{{2}}:[0-9a-f]{{2}}:[0-9a-f]{{2}})"
        resultado = re.search(patron, salida, re.IGNORECASE)
        if resultado:
            info["mac"] = resultado.group(1)
        else:
            info["mac"] = "No encontrada"
    except:
        info["mac"] = "No disponible"

    puertos_comunes = [22, 80, 1883, 5000, 502, 8266]
    for puerto in puertos_comunes:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.2)
        try:
            if sock.connect_ex((ip, puerto)) == 0:
                info["puertos_abiertos"].append(puerto)
        except:
            pass
        finally:
            sock.close()

    logger.info(f"[Análisis IP] {ip} → Host: {info['hostname']}, MAC: {info['mac']}, Puertos abiertos: {info['puertos_abiertos']}")
    return info
