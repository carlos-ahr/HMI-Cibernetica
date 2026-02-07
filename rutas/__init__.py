# rutas/__init__.py

from flask import Blueprint

from .base import base
from .proyectos import proyectos
from .dispositivos import dispositivos
from .red import red
from .logs import logs
from .topicos import topicos
from .plantilla import plantilla
from .visual import visual
from .registros import registros
from .historial import ruta_historial
from .rutas_admin_sensores import ruta_admin_sensores
from .rutas_alarmas import ruta_alarmas

# --- NUEVO: sistema de usuarios modular ---
#from usuarios.auth import bp as auth_bp           # /auth/login, /auth/logout, /auth/register
#from usuarios.admin import bp as admin_bp         # /admin/users (gestión usuarios)

#----POSTGRES BASE DE DATOS --------
from .postgres_historial import ruta_historial_pg

def registrar_rutas(app):
    # Registrar autentificacion y administracion (blueprints)
    #app.register_blueprint(auth_bp,  url_prefix="/auth")
    #app.register_blueprint(admin_bp, url_prefix="/admin")

    # Registrar blueprints HMI.1.0.v.
    app.register_blueprint(base)
    app.register_blueprint(proyectos)
    app.register_blueprint(dispositivos)
    app.register_blueprint(red)
    app.register_blueprint(logs)
    app.register_blueprint(topicos)
    app.register_blueprint(plantilla)
    app.register_blueprint(visual)
    app.register_blueprint(registros)
    app.register_blueprint(ruta_historial) #-----SQLite
    app.register_blueprint(ruta_admin_sensores)
    app.register_blueprint(ruta_alarmas)
    app.register_blueprint(ruta_historial_pg)#-----PostgreSQL