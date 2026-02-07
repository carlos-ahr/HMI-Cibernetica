import sqlite3
import os

def crear_base_datos():
    # Ruta relativa a la carpeta actual (asumiendo que este archivo está en /HMI_Proyecto/Config/)
    ruta_base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'BaseDatos', 'historial'))
    os.makedirs(ruta_base, exist_ok=True)

    ruta_db = os.path.join(ruta_base, 'historial_sensores.db')
    conn = sqlite3.connect(ruta_db)
    cursor = conn.cursor()

    # Tabla de dispositivos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dispositivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identificador TEXT UNIQUE NOT NULL,
            nombre TEXT,
            ip TEXT,
            descripcion TEXT
        );
    ''')

    # Tabla de sensores
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

    # Tabla de historial
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS historial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER NOT NULL,
            valor TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (sensor_id) REFERENCES sensores(id)
        );
    ''')


    conn.commit()
    conn.close()
    print(f"[BD] Base de datos creada en: {ruta_db}")

if __name__ == "__main__":
    crear_base_datos()
