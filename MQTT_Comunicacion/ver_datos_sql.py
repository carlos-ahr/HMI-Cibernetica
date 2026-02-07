# ver_datos_sql.py
import sqlite3
import pandas as pd
import os

# Obtener ruta absoluta de la base de datos
db_path = os.path.join(os.path.dirname(__file__), "base_datos_sql.db")

# Conexión a la base de datos
conn = sqlite3.connect(db_path)

# Leer los datos con pandas
df = pd.read_sql_query("SELECT * FROM lecturas ORDER BY id DESC", conn)

conn.close()

# Mostrar resultados
print(df)
