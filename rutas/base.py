# rutas/base.py

from flask import Blueprint, render_template
import os

base = Blueprint('base', __name__)

@base.route('/')
def menu_principal():
    proyectos_dir = os.path.join("HMI_Interfaz", "Proyectos")
    proyectos = []

    for archivo in os.listdir(proyectos_dir):
        if archivo.endswith(".json"):
            nombre = os.path.splitext(archivo)[0]
            proyectos.append(nombre)

    return render_template("index.html", proyectos=proyectos)
