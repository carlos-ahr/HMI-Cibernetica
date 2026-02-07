from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as PgEnum
from flask_login import UserMixin
from extensions import db

class Role(str, Enum):
    ADMIN = "admin"
    VIEWER = "viewer"

class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(PgEnum(Role, name="role_enum"), nullable=False, default=Role.VIEWER)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login_at = db.Column(db.DateTime)

    def get_id(self):
        return str(self.id)
