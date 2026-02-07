from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user
from .services import autenticar, crear_usuario
from .models import Role

bp = Blueprint("auth", __name__, template_folder="templates")

@bp.get("/login")
def login():
    return render_template("login.html")

@bp.post("/login")
def login_post():
    user = autenticar(request.form.get("email",""), request.form.get("password",""))
    if not user:
        flash("Usuario o contraseña inválidos", "error")
        return redirect(url_for("auth.login"))
    login_user(user, remember=True)
    # Redirige al dashboard principal (ajusta a tu ruta de inicio real)
    return redirect("/")

@bp.post("/logout")
def logout():
    logout_user()
    return redirect(url_for("auth.login"))

# Registro abierto para MVP; en prod, suele ser solo admin
@bp.get("/register")
def register():
    return render_template("register.html")

@bp.post("/register")
def register_post():
    email = request.form.get("email","")
    pwd   = request.form.get("password","")
    try:
        crear_usuario(email, pwd, Role.VIEWER)
        flash("Usuario creado, ahora puedes iniciar sesión", "success")
        return redirect(url_for("auth.login"))
    except Exception as e:
        flash(f"No se pudo registrar: {e}", "error")
        return redirect(url_for("auth.register"))
