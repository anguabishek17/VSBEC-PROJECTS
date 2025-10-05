from __future__ import annotations
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from . import db, login_manager


class Admin(UserMixin, db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


@login_manager.user_loader
def load_user(user_id: str):
    return Admin.query.get(int(user_id))


class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    registration_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    department = db.Column(db.String(100), nullable=False, index=True)
    section = db.Column(db.String(10), nullable=False, index=True)
    year_of_study = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    activities = db.relationship('Activity', backref='student', cascade='all, delete-orphan', lazy='dynamic')

    def total_points(self) -> int:
        return sum(activity.points for activity in self.activities)


class Activity(db.Model):
    __tablename__ = 'activities'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False)  # academic | co-curricular | extra-curricular
    event_name = db.Column(db.String(200), nullable=False)
    position = db.Column(db.String(20), nullable=False)  # first | second | third | participation
    points = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def points_for_position(position: str) -> int:
        mapping = {
            'first': 10,
            'second': 5,
            'third': 3,
            'participation': 1,
        }
        return mapping.get(position.lower(), 0)
