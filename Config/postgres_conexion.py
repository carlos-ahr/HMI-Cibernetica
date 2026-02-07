# Config/postgres_conexion.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def obtener_conexion_pg():
    """
    Devuelve una conexión a PostgreSQL lista para usar.
    Más adelante estos datos saldrán de .env.
    """
    conn = psycopg2.connect(
        dbname="hmi_historial",
        user="hmi_lab45",
        password="cibernetica2025",  # 
        host="localhost",            # o 10.8.0.1 VPN
        port=5432
    )
    return conn

def cursor_diccionario_pg(conn):
    """
    Devuelve un cursor que regresa dicts, útil para plantillas.
    """
    return conn.cursor(cursor_factory=RealDictCursor)
