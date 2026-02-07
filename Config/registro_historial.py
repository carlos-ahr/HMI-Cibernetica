# ═══════════════════════════════════════════════════════════════
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  REGISTRO_HISTORIAL.PY ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
# ═══════════════════════════════════════════════════════════════
import sqlite3
import os
import time
from datetime import datetime
from functools import wraps

# ═══════════════════════════════════════════════════════════════
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  RUTA A LA BASE DE DATOS  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
# ═══════════════════════════════════════════════════════════════

ruta_historial = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'BaseDatos', 'historial', 'historial_sensores.db'))

# ═══════════════════════════════════════════════════════════════
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  CONEXIÓN A LA BASE DE DATOS  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
# ═══════════════════════════════════════════════════════════════

def conectar_historial():
    return sqlite3.connect(ruta_historial)

# ═══════════════════════════════════════════════════════════════
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  DECORADOR DE REINTENTO EN BLOQUEO  ▓▓▓▓▓▓▓▓▓
# ═══════════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════════
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  VERIFICACIÓN DE ESPACIO (HISTORIAL)  ▓▓▓▓▓▓▓
# ═══════════════════════════════════════════════════════════════

def verificar_limite_historial(max_bytes=6_442_450_944, margen=10000):
    try:
        if os.path.exists(ruta_historial):
            tamano_actual = os.path.getsize(ruta_historial)
            if tamano_actual >= max_bytes:
                print(f"[INFO] Límite historial alcanzado ({tamano_actual} bytes). Eliminando antiguos...")
                conn = conectar_historial()
                cursor = conn.cursor()
                cursor.execute("""
                    DELETE FROM historial
                    WHERE id IN (
                        SELECT id FROM historial
                        ORDER BY timestamp ASC
                        LIMIT ?
                    )
                """, (margen,))
                conn.commit()
                conn.close()
                print(f"[INFO] Eliminados {margen} registros de historial.")
    except Exception as e:
        print(f"[ERROR] verificación espacio historial: {e}")

# ═══════════════════════════════════════════════════════════════
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  GESTIÓN DE DISPOSITIVOS Y SENSORES  ▓▓▓▓▓▓▓▓
# ═══════════════════════════════════════════════════════════════

def obtener_dispositivo_id(identificador):
    conn = conectar_historial()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM dispositivos WHERE identificador = ?", (identificador,))
    resultado = cursor.fetchone()
    if resultado:
        conn.close()
        return resultado[0]
    cursor.execute("INSERT INTO dispositivos (identificador) VALUES (?)", (identificador,))
    conn.commit()
    nuevo_id = cursor.lastrowid
    conn.close()
    return nuevo_id

def obtener_sensor_id(dispositivo_id, nombre, topico, unidad):
    conn = conectar_historial()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM sensores WHERE dispositivo_id = ? AND topico = ?", (dispositivo_id, topico))
    resultado = cursor.fetchone()
    if resultado:
        conn.close()
        return resultado[0]
    cursor.execute("""
        INSERT INTO sensores (dispositivo_id, nombre, topico, unidad)
        VALUES (?, ?, ?, ?)
    """, (dispositivo_id, nombre, topico, unidad))
    conn.commit()
    nuevo_id = cursor.lastrowid
    conn.close()
    return nuevo_id

# ═══════════════════════════════════════════════════════════════
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  REGISTRO DE VALORES (HISTORIAL)  ▓▓▓▓▓▓▓▓▓▓▓
# ═══════════════════════════════════════════════════════════════

@reintentar_sqlite()
def registrar_valor(sensor_id, valor):
    try:
        verificar_limite_historial()
        timestamp = datetime.now().isoformat()
        conn = conectar_historial()
        cursor = conn.cursor()
        cursor.execute("BEGIN IMMEDIATE")
        cursor.execute("""
            INSERT INTO historial (sensor_id, valor, timestamp)
            VALUES (?, ?, ?)
        """, (sensor_id, str(valor), timestamp))
        conn.commit()
    except Exception as e:
        print(f"[ERROR] registrar_valor: {e}")
    finally:
        conn.close()
