from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from .models import User, Role
from .services import crear_usuario, cambiar_rol

bp = Blueprint("admin", __name__, template_folder="templates")

def es_admin():
    return current_user.is_authenticated and current_user.role == Role.ADMIN

@bp.get("/users")
@login_required
def users_list():
    if not es_admin():
        flash("Permiso denegado", "error")
        return redirect(url_for("auth.login"))
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template("users_list.html", users=users, Role=Role)

@bp.post("/users/create")
@login_required
def users_create():
    if not es_admin():
        flash("Permiso denegado", "error")
        return redirect(url_for("auth.login"))
    try:
        crear_usuario(request.form["email"], request.form["password"], Role(request.form.get("role","viewer")))
        flash("Usuario creado", "success")
    except Exception as e:
        flash(f"No se pudo crear: {e}", "error")
    return redirect(url_for("admin.users_list"))

@bp.post("/users/role")
@login_required
def users_change_role():
    if not es_admin():
        flash("Permiso denegado", "error")
        return redirect(url_for("auth.login"))
    try:
        cambiar_rol(int(request.form["user_id"]), Role(request.form.get("role","viewer")))
        flash("Rol actualizado", "success")
    except Exception as e:
        flash(f"No se pudo actualizar: {e}", "error")
    return redirect(url_for("admin.users_list"))
