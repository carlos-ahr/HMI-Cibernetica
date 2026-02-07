# Config/postgres_registro.py
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from Config.postgres_conexion import obtener_conexion_pg
from mqtt_handler import cliente  # tu cliente MQTT existente

def registrar_muestra(topic, valor):
    """
    Guarda un dato en la tabla historial.
    """
    conn = obtener_conexion_pg()
    cur = conn.cursor()

    # 1. Buscar el sensor por su tópico
    cur.execute("SELECT id FROM sensores WHERE topico = %s", (topic,))
    sensor = cur.fetchone()

    if not sensor:
        print(f"[AVISO] No existe sensor para tópico {topic}")
        cur.close()
        conn.close()
        return

    sensor_id = sensor[0]

    # 2. Registrar el dato
    cur.execute("""
        INSERT INTO historial(sensor_id, valor)
        VALUES (%s, %s)
    """, (sensor_id, float(valor)))

    conn.commit()
    cur.close()
    conn.close()

def on_message(client, userdata, message):
    topic = message.topic
    payload = message.payload.decode()

    try:
        valor = float(payload)
        registrar_muestra(topic, valor)
    except Exception as e:
        print(f"[ERROR] No se pudo procesar '{topic}' -> {payload}: {e}")

def iniciar_registro():
    cliente.on_message = on_message
    cliente.subscribe("#")  # luego lo refinamos
    cliente.loop_start()
    print("[OK] Registro PostgreSQL activado")
