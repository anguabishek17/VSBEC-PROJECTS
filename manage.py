#!/usr/bin/env python3
import os
from app import create_app, db
from app.models import Admin

app = create_app()

@app.cli.command('init-db')
def init_db():
    """Initialize database and seed admin if missing."""
    from app import db
    db.create_all()
    username = os.environ.get('ADMIN_USERNAME', 'admin')
    password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    admin = Admin.query.filter_by(username=username).first()
    if not admin:
        admin = Admin(username=username)
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"Seeded admin user '{username}' with default password.")
    else:
        print("Admin user already exists.")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
