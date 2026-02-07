# administracion_sql.py

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.expanduser("~"), "HMI_Proyecto", "MQTT_Comunicacion", "base_datos_sql.db")
MAX_REGISTROS = 100

# Crear base de datos y tabla si no existen
def inicializar_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lecturas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            origen TEXT NOT NULL,
            dato TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# Guardar nuevo dato y borrar si excede
def guardar_dato_sqlite(origen, dato):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Insertar nuevo dato
    cursor.execute("INSERT INTO lecturas (timestamp, origen, dato) VALUES (?, ?, ?)",
                   (timestamp, origen, dato))

    # Borrar registros más antiguos si exceden el máximo permitido
    cursor.execute("SELECT COUNT(*) FROM lecturas")
    total = cursor.fetchone()[0]

    if total > MAX_REGISTROS:
        exceso = total - MAX_REGISTROS
        cursor.execute("DELETE FROM lecturas WHERE id IN (SELECT id FROM lecturas ORDER BY id ASC LIMIT ?)", (exceso,))

    conn.commit()
    conn.close()
