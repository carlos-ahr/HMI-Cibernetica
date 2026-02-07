from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, User, Role

def _norm(e: str) -> str:
    return (e or "").strip().lower()

def crear_usuario(email: str, password: str, role: Role = Role.VIEWER) -> User:
    email = _norm(email)
    if User.query.filter_by(email=email).first():
        raise ValueError("El correo ya está registrado")
    u = User(email=email, password_hash=generate_password_hash(password), role=role)
    db.session.add(u)
    db.session.commit()
    return u

def autenticar(email: str, password: str):
    u = User.query.filter_by(email=_norm(email)).first()
    if not u or not u.is_active: return None
    if not check_password_hash(u.password_hash, password): return None
    u.last_login_at = datetime.utcnow()
    db.session.commit()
    return u

def cambiar_rol(user_id: int, role: Role):
    u = User.query.get(user_id)
    if not u: raise ValueError("Usuario no encontrado")
    u.role = role
    db.session.commit()
    return u
