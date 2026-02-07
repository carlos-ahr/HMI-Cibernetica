from flask import Blueprint, render_template, request
import sqlite3
import os
import json
import numpy as np
from datetime import datetime

ruta_historial = Blueprint('ruta_historial', __name__)

RUTA_DB = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', 'BaseDatos', 'historial', 'historial_sensores.db'
))

RUTA_REG_JSON = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', 'Config', 'reg.json' 
))

# Traducción manual
dias_semana = {
    'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
    'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
}

meses = {
    'January': 'enero', 'February': 'febrero', 'March': 'marzo', 'April': 'abril',
    'May': 'mayo', 'June': 'junio', 'July': 'julio', 'August': 'agosto',
    'September': 'septiembre', 'October': 'octubre', 'November': 'noviembre', 'December': 'diciembre'
}

def formatear_fecha_legible(iso_str):
    try:
        dt = datetime.fromisoformat(iso_str)
        dia = dias_semana[dt.strftime('%A')]
        mes = meses[dt.strftime('%B')]
        return f"{dia}, {dt.day} de {mes} de {dt.year} – {dt.strftime('%H:%M:%S')}"
    except:
        return iso_str

# ─────────────────────────────────────────────────────────────
def obtener_datos_filtrados(fecha_inicio=None, fecha_fin=None, dispositivo=None, sensor=None, limit=100):
    try:
        conn = sqlite3.connect(RUTA_DB)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        consulta = """
            SELECT h.timestamp, d.identificador AS dispositivo,
                   s.nombre AS nombre_sensor, s.topico, h.valor, s.unidad
            FROM historial h
            JOIN sensores s ON h.sensor_id = s.id
            JOIN dispositivos d ON s.dispositivo_id = d.id
            WHERE 1=1
        """
        params = []

        if fecha_inicio:
            consulta += " AND DATE(h.timestamp) >= ?"
            params.append(fecha_inicio)

        if fecha_fin:
            consulta += " AND DATE(h.timestamp) <= ?"
            params.append(fecha_fin)

        if dispositivo:
            consulta += " AND d.identificador = ?"
            params.append(dispositivo)

        if sensor:
            consulta += " AND (s.nombre LIKE ? OR s.topico LIKE ?)"
            params.extend([f"%{sensor}%", f"%{sensor}%"])

        consulta += " ORDER BY h.timestamp DESC LIMIT ?"
        params.append(limit)

        cursor.execute(consulta, params)
        filas = cursor.fetchall()

        registros = []
        for fila in filas:
            registros.append({
                "timestamp": formatear_fecha_legible(fila["timestamp"]),
                "dispositivo": fila["dispositivo"],
                "nombre_sensor": fila["nombre_sensor"],
                "topico": fila["topico"],
                "valor": fila["valor"],
                "unidad": fila["unidad"]
            })

        return registros

    except Exception as e:
        print(f"[ERROR] Al obtener historial filtrado: {e}")
        return []

    finally:
        if conn:
            conn.close()

# ─────────────────────────────────────────────────────────────
def obtener_lista_dispositivos():
    try:
        conn = sqlite3.connect(RUTA_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT identificador FROM dispositivos ORDER BY identificador ASC")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        print(f"[ERROR] Al obtener dispositivos: {e}")
        return []
    finally:
        if conn:
            conn.close()

# ─────────────────────────────────────────────────────────────
@ruta_historial.route("/historial")
def mostrar_historial():
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    dispositivo = request.args.get('dispositivo')
    sensor = request.args.get('sensor')

    registros = obtener_datos_filtrados(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        dispositivo=dispositivo,
        sensor=sensor,
        limit=100
    )

    dispositivos = obtener_lista_dispositivos()
    return render_template("historial.html", registros=registros, dispositivos=dispositivos)

# ─────────────────────────────────────────────────────────────
@ruta_historial.route("/proyecto/<nombre>/historial")
def historial_por_proyecto(nombre):
    try:
        with open(RUTA_REG_JSON, 'r') as f:
            dispositivos = json.load(f)

        if nombre in dispositivos:
            dispositivo_id = dispositivos[nombre]["id"]
        else:
            return render_template("Plantillas/historialProyecto.html", registros=[], dispositivos=[], error="Dispositivo no encontrado")

        registros = obtener_datos_filtrados(dispositivo=dispositivo_id, limit=100)
        return render_template("Plantillas/historialProyecto.html", registros=registros, dispositivos=[dispositivo_id], nombre=nombre)

    except Exception as e:
        print(f"[ERROR] en historial_por_proyecto: {e}")
        return render_template("Plantillas/historialProyecto.html", registros=[], dispositivos=[], error="Error al cargar historial")

# ─────────────────────────────────────────────────────────────
@ruta_historial.route("/proyecto/<nombre>/histograma")
def ver_histograma(nombre):
    sensor_topico = request.args.get("sensor")
    fecha_inicio = request.args.get("fecha_inicio")
    fecha_fin = request.args.get("fecha_fin")

    datos_histograma = {
        "bins": [],
        "frecuencias": []
    }

    estadisticas = {
        "promedio": None,
        "minimo": None,
        "maximo": None,
        "desviacion": None,
        "ultimo_valor": None,
        "total": 0
    }

    try:
        conn = sqlite3.connect(RUTA_DB)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT s.nombre, s.topico FROM sensores s
            JOIN dispositivos d ON s.dispositivo_id = d.id
            WHERE d.identificador = ?
            ORDER BY s.nombre ASC
        """, (nombre,))
        sensores = cursor.fetchall()

        mensaje_error = None

        if sensor_topico:
            consulta = """
                SELECT h.valor, h.timestamp FROM historial h
                JOIN sensores s ON h.sensor_id = s.id
                JOIN dispositivos d ON s.dispositivo_id = d.id
                WHERE d.identificador = ? AND s.topico = ?
            """
            params = [nombre, sensor_topico]

            if fecha_inicio:
                consulta += " AND DATE(h.timestamp) >= ?"
                params.append(fecha_inicio)
            if fecha_fin:
                consulta += " AND DATE(h.timestamp) <= ?"
                params.append(fecha_fin)

            consulta += " ORDER BY h.timestamp DESC LIMIT 10000"
            cursor.execute(consulta, params)

            rows = cursor.fetchall()
            valores_crudos = [row["valor"] for row in rows if row["valor"] is not None]

            valores = []
            for v in valores_crudos:
                try:
                    valores.append(float(v))
                except:
                    continue

            if valores:
                # Histograma
                minimo = min(valores)
                maximo = max(valores)
                if minimo == maximo:
                    minimo -= 0.5
                    maximo += 0.5
                bins = np.arange(minimo, maximo + 0.5, 0.5)
                hist, bin_edges = np.histogram(valores, bins=bins)
                datos_histograma["bins"] = [f"{round(bin_edges[i], 2)} - {round(bin_edges[i+1], 2)}"
                                            for i in range(len(bin_edges) - 1)]
                datos_histograma["frecuencias"] = hist.tolist()

                # Estadísticas
                estadisticas["promedio"] = round(np.mean(valores), 2)
                estadisticas["minimo"] = round(min(valores), 2)
                estadisticas["maximo"] = round(max(valores), 2)
                estadisticas["desviacion"] = round(np.std(valores), 2)
                estadisticas["ultimo_valor"] = round(valores[0], 2)
                estadisticas["total"] = len(valores)
            else:
                mensaje_error = "No se encontraron datos válidos para ese sensor y rango de fechas."

        return render_template("/Plantillas/histogramas.html",
                               nombre=nombre,
                               sensores=sensores,
                               datos_histograma=datos_histograma,
                               estadisticas=estadisticas,
                               sensor_seleccionado=sensor_topico,
                               fecha_inicio=fecha_inicio,
                               fecha_fin=fecha_fin,
                               error=mensaje_error)

    except Exception as e:
        print(f"[ERROR INTERNO EN HISTOGRAMA] {e}")
        return "Error interno", 500

    finally:
        if conn:
            conn.close()
