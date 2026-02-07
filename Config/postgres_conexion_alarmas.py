import psycopg2
from psycopg2.extras import RealDictCursor

def get_conn_alarmas():
    return psycopg2.connect(
        dbname="alarmas_hmi",
        user="hmi_lab45",
        password="cibernetica2025",
        host="localhost",
        port=5432
    )

def get_cursor_dict(conn):
    return conn.cursor(cursor_factory=RealDictCursor)
