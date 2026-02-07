#proyecto_utils.py

import os
import json

def obtener_dispositivos_sin_proyecto():
    ruta_reg = "Config/reg.json"
    carpeta_proyectos = "HMI_Interfaz/Proyectos/"

    with open(ruta_reg, "r") as f:
        dispositivos = json.load(f)

    proyectos = {
        os.path.splitext(nombre)[0]
        for nombre in os.listdir(carpeta_proyectos)
        if nombre.endswith(".json")
    }

    return {
        nombre: info
        for nombre, info in dispositivos.items()
        if nombre not in proyectos
    }
