# logs/logger_hmi.py

import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

# Crear carpeta de logs si no existe
LOG_DIR = os.path.join(os.path.dirname(__file__), "archivos")
os.makedirs(LOG_DIR, exist_ok=True)

# Nombre del archivo con fecha
nombre_log = datetime.now().strftime("HMI_%Y-%m-%d.log")
RUTA_LOG = os.path.join(LOG_DIR, nombre_log)

# Configuración del logger con rotación
logger = logging.getLogger("HMI")
logger.setLevel(logging.DEBUG)

# Evita agregar múltiples handlers si ya existe uno
if not logger.handlers:
    # Handler con rotación automática: 1 MB por archivo, máximo 5 archivos
    handler = RotatingFileHandler(RUTA_LOG, maxBytes=1_000_000, backupCount=5)
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", "%H:%M:%S")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Formato de salida (con colores para consola)
class ColoredFormatter(logging.Formatter):
    COLORS = {
        logging.DEBUG: "\033[94m",    # Azul
        logging.INFO: "\033[92m",     # Verde
        logging.WARNING: "\033[93m",  # Amarillo
        logging.ERROR: "\033[91m",    # Rojo
        logging.CRITICAL: "\033[95m"  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record):
        color = self.COLORS.get(record.levelno, self.RESET)
        mensaje = super().format(record)
        return f"{color}{mensaje}{self.RESET}"

# Configuración base del logger
logger = logging.getLogger("HMI_Logger")
logger.setLevel(logging.DEBUG)  # Puedes cambiar a INFO si prefieres menos verbosidad

# Formatos
formato = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", "%H:%M:%S")

# Handler para archivo
archivo_handler = logging.FileHandler(RUTA_LOG)
archivo_handler.setFormatter(formato)
logger.addHandler(archivo_handler)

# Handler para consola con colores
consola_handler = logging.StreamHandler()
consola_handler.setFormatter(ColoredFormatter("[%(asctime)s] [%(levelname)s] %(message)s", "%H:%M:%S"))
consola_handler.setLevel(logging.DEBUG)
logger.addHandler(consola_handler)
