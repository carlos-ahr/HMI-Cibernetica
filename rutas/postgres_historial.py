# Rutas/historial_postgres.py
from flask import Blueprint, render_template, request
from Config.postgres_conexion import obtener_conexion_pg, cursor_diccionario_pg
from datetime import datetime

ruta_historial_pg = Blueprint('ruta_historial_pg', __name__)

def formatear_fecha_legible(dt_obj):
    # Aquí dt_obj YA es datetime por venir de PostgreSQL
    return dt_obj.strftime("%Y-%m-%d %H:%M:%S")

@ruta_historial_pg.route("/historial_pg")
def mostrar_historial_pg():
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    dispositivo = request.args.get('dispositivo')
    sensor = request.args.get('sensor')

    conn = obtener_conexion_pg()
    cur = cursor_diccionario_pg(conn)

    consulta = """
        SELECT h.timestamp,
               d.identificador AS dispositivo,
               s.nombre AS nombre_sensor,
               s.topico,
               h.valor,
               s.unidad
        FROM historial h
        JOIN sensores s ON h.sensor_id = s.id
        JOIN dispositivos d ON s.dispositivo_id = d.id
        WHERE 1=1
    """
    params = []

    if fecha_inicio:
        consulta += " AND h.timestamp::date >= %s"
        params.append(fecha_inicio)

    if fecha_fin:
        consulta += " AND h.timestamp::date <= %s"
        params.append(fecha_fin)

    if dispositivo:
        consulta += " AND d.identificador = %s"
        params.append(dispositivo)

    if sensor:
        consulta += " AND (s.nombre ILIKE %s OR s.topico ILIKE %s)"
        like = f"%{sensor}%"
        params.extend([like, like])

    consulta += " ORDER BY h.timestamp DESC LIMIT 100"
    cur.execute(consulta, params)
    filas = cur.fetchall()

    registros = []
    for fila in filas:
        registros.append({
            "timestamp": formatear_fecha_legible(fila["timestamp"]),
            "dispositivo": fila["dispositivo"],
            "nombre_sensor": fila["nombre_sensor"],
            "topico": fila["topico"],
            "valor": fila["valor"],
            "unidad": fila["unidad"],
        })

    # lista de dispositivos para el combo
    cur.execute("SELECT DISTINCT identificador FROM dispositivos ORDER BY identificador ASC;")
    dispositivos = [row["identificador"] for row in cur.fetchall()]

    cur.close()
    conn.close()

    return render_template(
        "historial_pg.html",
        registros=registros,
        dispositivos=dispositivos
    )
