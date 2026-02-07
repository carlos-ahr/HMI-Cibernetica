from flask import Blueprint, render_template
import glob

logs = Blueprint('logs', __name__)

@logs.route('/logs')
def mostrar_logs():
    import re

    lista_logs = sorted(glob.glob("logs/archivos/HMI_*.log"), reverse=True)
    if not lista_logs:
        return "No hay archivos de logs disponibles."

    archivo_log = lista_logs[0]
    lineas_formateadas = []

    with open(archivo_log, "r") as f:
        for linea in f:
            tipo = "info"
            if "[ERROR]" in linea or "[CRITICAL]" in linea:
                tipo = "error"
            elif "[WARNING]" in linea:
                tipo = "warning"
            elif "[DEBUG]" in linea:
                tipo = "debug"
            elif "[SUCCESS]" in linea:
                tipo = "success"
            lineas_formateadas.append({
                "texto": linea.strip(),
                "tipo": tipo
            })

    return render_template("visualizador_logs.html", logs=lineas_formateadas)
