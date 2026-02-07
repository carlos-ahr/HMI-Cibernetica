import sqlite3
import os
import time
from datetime import datetime
from functools import wraps

# ═════════════════════════════════════════════════════
# CONFIGURACIÓN
# ═════════════════════════════════════════════════════
DEBUG = True  # ← Cambia a False en producción
ruta_alarmas = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', 'BaseDatos', 'alarmas', 'alarmas_eventos.db'
))

# ═════════════════════════════════════════════════════
# CONEXIÓN A LA BASE DE DATOS
# ═════════════════════════════════════════════════════
def conectar_alarmas():
    return sqlite3.connect(ruta_alarmas)

# ═════════════════════════════════════════════════════
# DECORADOR DE REINTENTO POR BLOQUEO
# ═════════════════════════════════════════════════════
def reintentar_sqlite(reintentos=3, espera_inicial=0.2):
    def decorador(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            espera = espera_inicial
            for intento in range(reintentos):
                try:
                    return func(*args, **kwargs)
                except sqlite3.OperationalError as e:
                    if "database is locked" in str(e):
                        print(f"[REINTENTO {intento+1}] Esperando {espera}s por bloqueo en {func.__name__}...")
                        time.sleep(espera)
                        espera *= 2
                    else:
                        print(f"[ERROR inesperado] {func.__name__}: {e}")
                        break
            print(f"[FALLO] No se pudo completar {func.__name__} tras {reintentos} intentos.")
        return wrapper
    return decorador

# ═════════════════════════════════════════════════════
# LIMPIEZA DE BASE DE DATOS AL ALCANZAR LÍMITE
# ═════════════════════════════════════════════════════
def verificar_limite_alarmas(max_bytes=6_442_450_944, margen=5000):
    try:
        if os.path.exists(ruta_alarmas):
            tamano_actual = os.path.getsize(ruta_alarmas)
            if tamano_actual >= max_bytes:
                print(f"[INFO] Límite de alarmas alcanzado ({tamano_actual} bytes). Eliminando registros antiguos...")
                with conectar_alarmas() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        DELETE FROM alarmas
                        WHERE id IN (
                            SELECT id FROM alarmas
                            ORDER BY timestamp ASC
                            LIMIT ?
                        )
                    """, (margen,))
                    conn.commit()
                print(f"[INFO] Eliminados {margen} registros antiguos.")
    except Exception as e:
        print(f"[ERROR] al verificar el espacio: {e}")

# ═════════════════════════════════════════════════════
# REGISTRO DE ALARMAS ÚNICAS
# ═════════════════════════════════════════════════════
último_registro_alarma = {}

@reintentar_sqlite()
def registrar_alarma(sensor_id, topico, tipo, mensaje, color):
    if sensor_id is None:
        print(f"[ADVERTENCIA] sensor_id es None para {topico}. No se registrará la alarma.")
        return

    ahora = datetime.now()
    clave = f"{sensor_id}_{topico}_{tipo}"

    # Evitar duplicados inmediatos
    if clave in último_registro_alarma:
        delta = (ahora - último_registro_alarma[clave]).total_seconds()
        if delta < 1:
            if DEBUG:
                print(f"[DEBUG] Alarma duplicada ignorada: {mensaje}")
            return
    último_registro_alarma[clave] = ahora

    verificar_limite_alarmas()

    timestamp = ahora.isoformat()
    try:
        with conectar_alarmas() as conn:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE")
            cursor.execute("""
                INSERT INTO alarmas (sensor_id, topico, tipo, mensaje, color, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (sensor_id, topico, tipo, mensaje, color, timestamp))
            conn.commit()
            if DEBUG:
                print(f"[OK] Alarma registrada en DB: {mensaje}")
    except Exception as e:
        print(f"[ERROR] registrar_alarma: {e}")

# ═════════════════════════════════════════════════════
# REGISTRO VISUAL PARA INTERFAZ (Ahora con dispositivo)
# ═════════════════════════════════════════════════════
@reintentar_sqlite()
def registrar_evento_alarma(topico, tipo, mensaje, color, dispositivo):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        with conectar_alarmas() as conn:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE")
            cursor.execute("""
                INSERT INTO eventos_alarma (timestamp, topico, tipo, mensaje, color, dispositivo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (timestamp, topico, tipo, mensaje, color, dispositivo))
            conn.commit()
            if DEBUG:
                print(f"[OK] Evento visual registrado: {mensaje} [Dispositivo: {dispositivo}]")
    except Exception as e:
        print(f"[ERROR] registrar_evento_alarma: {e}")
