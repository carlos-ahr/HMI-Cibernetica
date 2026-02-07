import os
import json
import time
from registro_alarmas import registrar_alarma, registrar_evento_alarma
from registro_historial import obtener_dispositivo_id, obtener_sensor_id

# ────────────────────────────────
# Rutas y variables globales
# ────────────────────────────────
ruta_base = os.path.dirname(__file__)
ruta_alertas = os.path.abspath(os.path.join(ruta_base, '..', 'BaseDatos', 'alarmas', 'config_alertas.json'))

alertas_prioritarias = set()
alertas_personalizadas = {}
ultima_modificacion = 0

estado_anteriores = {}
historial = {}
N = 10
UMBRAL_INESTABILIDAD = 100

# ────────────────────────────────
# Cargar configuración de alertas
# ────────────────────────────────
def cargar_configuracion_alertas():
    global alertas_prioritarias, alertas_personalizadas, ultima_modificacion

    try:
        nueva_modificacion = os.path.getmtime(ruta_alertas)
        if nueva_modificacion != ultima_modificacion:
            with open(ruta_alertas, 'r') as f:
                configuracion = json.load(f)

            alertas_prioritarias.clear()
            alertas_personalizadas.clear()

            for dispositivo, alertas in configuracion.items():
                for topico in alertas.get('alertas_prioritarias', []):
                    alertas_prioritarias.add(topico)
                for topico, limites in alertas.get('alertas_personalizadas', {}).items():
                    try:
                        min_v = float(limites.get('límite mínimo', 0))
                        max_v = float(limites.get('límite máximo', 0))
                        alertas_personalizadas[topico] = (min_v, max_v)
                    except (ValueError, TypeError) as e:
                        print(f"[ERROR] Límites inválidos para {topico}: {e}")

            ultima_modificacion = nueva_modificacion
            print(f"[CONFIG] Configuración de alertas recargada ({len(alertas_prioritarias)} prioritarias, {len(alertas_personalizadas)} personalizadas)")
    except Exception as e:
        print(f"[ERROR] No se pudo cargar config_alertas.json: {e}")

# ────────────────────────────────
# Evaluar una alerta individual
# ────────────────────────────────
def evaluar_alerta(topico, valor_raw, identificador, nombre_sensor, unidad):
    eventos = []
    cargar_configuracion_alertas()

    # Ignorar tópicos no registrados
    if topico not in alertas_prioritarias and topico not in alertas_personalizadas:
        return []

    try:
        valor = float(valor_raw)
    except (ValueError, TypeError):
        print(f"[ERROR] Valor inválido en {topico}: {valor_raw}")
        return []

    dispositivo_id = obtener_dispositivo_id(identificador)
    sensor_id = obtener_sensor_id(dispositivo_id, nombre_sensor, topico, unidad)
    if sensor_id is None:
        return []

    if topico not in estado_anteriores:
        estado_anteriores[topico] = {}

    # ───────────── ALERTA PERSONALIZADA ─────────────
    if topico in alertas_personalizadas:
        min_v, max_v = alertas_personalizadas[topico]
        fuera_rango = valor < min_v or valor > max_v
        if estado_anteriores[topico].get("personalizada") != fuera_rango:
            estado_anteriores[topico]["personalizada"] = fuera_rango
            if fuera_rango:
                mensaje = f"{topico}: Valor fuera de límites ({valor})"
                registrar_alarma(sensor_id, topico, "ADVERTENCIA", mensaje, "amarillo")
                registrar_evento_alarma(topico, "ADVERTENCIA", mensaje, "amarillo", identificador)
                eventos.append(("ADVERTENCIA", mensaje))

    # ───────────── ALERTA PRIORITARIA ─────────────
    if topico in alertas_prioritarias:
        # Desconexión
        desconectado = valor == 0
        if estado_anteriores[topico].get("desconexion") != desconectado:
            estado_anteriores[topico]["desconexion"] = desconectado
            if desconectado:
                mensaje = f"{topico}: Sensor desconectado (valor = 0)"
                registrar_alarma(sensor_id, topico, "desconexion", mensaje, "rojo")
                registrar_evento_alarma(topico, "desconexion", mensaje, "rojo", identificador)
                eventos.append(("desconexion", mensaje))

        # Inestabilidad
        historial.setdefault(topico, []).append(valor)
        if len(historial[topico]) > N:
            historial[topico].pop(0)

        if len(historial[topico]) == N:
            rango = max(historial[topico]) - min(historial[topico])
            inestable = rango > UMBRAL_INESTABILIDAD
            if estado_anteriores[topico].get("inestabilidad") != inestable:
                estado_anteriores[topico]["inestabilidad"] = inestable
                if inestable:
                    mensaje = f"{topico}: Sensor inestable (variación = {rango})"
                    registrar_alarma(sensor_id, topico, "inestabilidad", mensaje, "amarillo")
                    registrar_evento_alarma(topico, "inestabilidad", mensaje, "amarillo", identificador)
                    eventos.append(("inestabilidad", mensaje))

    return eventos
