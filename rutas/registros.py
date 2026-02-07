from flask import Blueprint, render_template, request, redirect, url_for, flash
import sqlite3
from werkzeug.security import generate_password_hash
import os
import json

registros = Blueprint("registros", __name__)

BASE_DATOS = os.path.join("BaseDatos", "usuarios.db")
RUTA_REG_JSON = os.path.join('Config', 'reg.json')
CARPETA_PERFILES = os.path.join("BaseDatos", "perfiles")

# Asegurar que la carpeta de perfiles exista
os.makedirs(CARPETA_PERFILES, exist_ok=True)

def get_db():
    conn = sqlite3.connect(BASE_DATOS)
    conn.row_factory = sqlite3.Row
    return conn

# Crear la tabla de usuarios si no existe
with get_db() as db:
    db.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL,
            contrasena TEXT NOT NULL
        )
    ''')

# Ruta para registrar un nuevo usuario y asociarlo a un proyecto
@registros.route('/registrar/<proyecto>', methods=['GET', 'POST'])
def registrar_usuario(proyecto):
    ruta_perfil = os.path.join(CARPETA_PERFILES, f"{proyecto}.json")

    # Validar existencia del archivo reg.json
    if not os.path.exists(RUTA_REG_JSON):
        return "No se encuentra el archivo reg.json", 500

    with open(RUTA_REG_JSON, 'r', encoding='utf-8') as f:
        dispositivos = json.load(f)

    # Validar existencia del dispositivo
    if proyecto not in dispositivos:
        return f"No se encontró el dispositivo '{proyecto}' en reg.json", 404

    datos = dispositivos[proyecto]

    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip()
        contrasena = request.form.get('password', '')
        titulo = request.form.get('nombre_proyecto', '').strip()

        if not usuario or not contrasena or not titulo:
            flash("Todos los campos son obligatorios.", "error")
            return render_template('registrar.html', dispositivo=datos)

        # Verificar si el usuario ya existe
        db = get_db()
        existe = db.execute(
            'SELECT 1 FROM usuarios WHERE usuario = ?', (usuario,)
        ).fetchone()

        if existe:
            flash("El usuario ya existe. Por favor elige otro nombre.", "error")
            return render_template('registrar.html', dispositivo=datos)

        # Registrar usuario
        contrasena_hash = generate_password_hash(contrasena)
        db.execute(
            'INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)',
            (usuario, contrasena_hash)
        )
        db.commit()

        # Guardar perfil en archivo JSON
        datos["usuario"] = usuario
        datos["titulo"] = titulo

        with open(ruta_perfil, 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2)

        flash("Usuario registrado exitosamente. Ahora puedes iniciar sesión.", "exito")
        return redirect(url_for('plantilla.menu_proyecto', nombre=proyecto))

    # GET: mostrar formulario con datos precargados
    return render_template('registrar.html', dispositivo=datos)
