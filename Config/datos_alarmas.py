import sqlite3
import os

def crear_base_alarmas():
    ruta_base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'BaseDatos', 'alarmas'))
    os.makedirs(ruta_base, exist_ok=True)

    ruta_db = os.path.join(ruta_base, 'alarmas_eventos.db')
    conn = sqlite3.connect(ruta_db)
    cursor = conn.cursor()

    # ─────────────────────────────────────────────────────────────
    # Tabla de dispositivos registrados en el sistema
    # ─────────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dispositivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identificador TEXT UNIQUE NOT NULL,
            nombre TEXT,
            ip TEXT,
            descripcion TEXT
        );
    ''')

    # ─────────────────────────────────────────────────────────────
    # Tabla de sensores asociados a dispositivos
    # ─────────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dispositivo_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            topico TEXT NOT NULL,
            unidad TEXT,
            FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
        );
    ''')

    # ─────────────────────────────────────────────────────────────
    # Tabla de definiciones de alarmas por sensor
    # ─────────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alarmas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER,
            topico TEXT NOT NULL,
            tipo TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            color TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (sensor_id) REFERENCES sensores(id)
        );
    ''')

    # ─────────────────────────────────────────────────────────────
    # Tabla para registrar cambios de estado de dispositivos
    # ─────────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS eventos_estado (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_hora TEXT NOT NULL,
            dispositivo TEXT NOT NULL,
            topico TEXT NOT NULL,
            estado TEXT NOT NULL
        );
    ''')

    # ─────────────────────────────────────────────────────────────
    # Configuraciones de alerta personalizadas por sensor
    # ─────────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS configuraciones_alerta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,  -- 'normal', 'prioritaria', 'personalizada'
            limite_min REAL,
            limite_max REAL,
            FOREIGN KEY (sensor_id) REFERENCES sensores(id),
            UNIQUE(sensor_id)
        );
    ''')

    # ─────────────────────────────────────────────────────────────
    # Registro final de eventos de alarma 
    # ─────────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS eventos_alarma (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            topico TEXT NOT NULL,
            tipo TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            color TEXT,
            dispositivo TEXT NOT NULL
        );
    ''')

    conn.commit()
    conn.close()
    print(f"[BD] Base de datos de alarmas creada o actualizada en: {ruta_db}")

if __name__ == "__main__":
    crear_base_alarmas()
