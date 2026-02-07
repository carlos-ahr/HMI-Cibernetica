from flask import Blueprint, render_template, request, redirect, url_for
import sqlite3
import os

ruta_admin_sensores = Blueprint('ruta_admin_sensores', __name__)

# Ruta de la base de datos
ruta_db = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'BaseDatos', 'historial', 'historial_sensores.db'))

# Obtener todos los sensores con su info
def obtener_sensores():
    conn = sqlite3.connect(ruta_db)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sensores.id, dispositivos.identificador, sensores.nombre, sensores.topico, sensores.unidad
        FROM sensores
        JOIN dispositivos ON sensores.dispositivo_id = dispositivos.id
        ORDER BY dispositivos.identificador, sensores.nombre
    """)
    sensores = cursor.fetchall()
    conn.close()
    return sensores

# Obtener sensores de un dispositivo específico
def obtener_sensores_por_dispositivo(nombre_dispositivo):
    conn = sqlite3.connect(ruta_db)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sensores.id, dispositivos.identificador, sensores.nombre, sensores.topico, sensores.unidad
        FROM sensores
        JOIN dispositivos ON sensores.dispositivo_id = dispositivos.id
        WHERE dispositivos.identificador = ?
        ORDER BY sensores.nombre
    """, (nombre_dispositivo,))
    sensores = cursor.fetchall()
    conn.close()
    return sensores

# Ruta para visualizar todos los sensores
@ruta_admin_sensores.route("/admin_sensores", methods=["GET"])
def admin_sensores():
    sensores = obtener_sensores()
    return render_template("admin_sensores.html", sensores=sensores)

# Ruta para visualizar sensores de un solo dispositivo
@ruta_admin_sensores.route("/proyecto/<nombre>/sensores", methods=["GET"])
def admin_sensores_dispositivo(nombre):
    sensores = obtener_sensores_por_dispositivo(nombre)
    return render_template("Plantillas/administrar_sensores.html", sensores=sensores, nombre=nombre)

# Ruta para guardar cambios desde vista general
@ruta_admin_sensores.route("/actualizar_sensor", methods=["POST"])
def actualizar_sensor():
    sensor_id = request.form.get("sensor_id")
    nuevo_nombre = request.form.get("nombre")
    nueva_unidad = request.form.get("unidad")

    conn = sqlite3.connect(ruta_db)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE sensores SET nombre = ?, unidad = ? WHERE id = ?
    """, (nuevo_nombre, nueva_unidad, sensor_id))
    conn.commit()
    conn.close()

    return redirect(url_for("ruta_admin_sensores.admin_sensores"))

# Ruta para guardar cambios desde vista por dispositivo
@ruta_admin_sensores.route("/proyecto/<nombre>/sensores/actualizar", methods=["POST"])
def actualizar_sensores_dispositivo(nombre):
    total = int(request.form.get("total", 0))
    conn = sqlite3.connect(ruta_db)
    cursor = conn.cursor()

    for i in range(1, total + 1):
        sensor_id = request.form.get(f"sensor_id_{i}")
        nuevo_nombre = request.form.get(f"nombre_{i}")
        nueva_unidad = request.form.get(f"unidad_{i}")
        if sensor_id and nuevo_nombre is not None:
            cursor.execute("UPDATE sensores SET nombre = ?, unidad = ? WHERE id = ?",
                           (nuevo_nombre, nueva_unidad, sensor_id))

    conn.commit()
    conn.close()
    return redirect(url_for("ruta_admin_sensores.admin_sensores_dispositivo", nombre=nombre))
