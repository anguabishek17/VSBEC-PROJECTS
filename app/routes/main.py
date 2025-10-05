from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_required
from sqlalchemy import func
from ..forms import StudentRegistrationForm, ActivityForm
from ..models import Student, Activity
from .. import db
import time

bp = Blueprint('main', __name__)


@bp.route('/')
def landing():
    return render_template('landing.html')


@bp.route('/loading')
def loading():
    # simple one-second loading page after login
    return render_template('loading.html')


@bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')


@bp.route('/register', methods=['GET', 'POST'])
@login_required
def register_student():
    form = StudentRegistrationForm()
    if form.validate_on_submit():
        if Student.query.filter_by(registration_number=form.registration_number.data.strip()).first():
            flash('Registration number already exists', 'warning')
            return render_template('register.html', form=form)
        student = Student(
            name=form.name.data.strip(),
            registration_number=form.registration_number.data.strip(),
            department=form.department.data.strip(),
            section=form.section.data.strip(),
            year_of_study=form.year_of_study.data,
        )
        db.session.add(student)
        db.session.commit()
        flash('Student registered successfully!', 'success')
        return redirect(url_for('main.register_student'))
    return render_template('register.html', form=form)


@bp.route('/profiles', methods=['GET', 'POST'])
@login_required
def profiles():
    form = ActivityForm()
    query = Student.query

    search = request.args.get('q', '').strip()
    if search:
        query = query.filter(
            (Student.registration_number.ilike(f"%{search}%")) |
            (Student.name.ilike(f"%{search}%"))
        )

    # Sorting: by section then name
    students = query.order_by(Student.section.asc(), Student.name.asc()).all()

    selected_reg = request.args.get('reg')
    selected_student = None
    activities = []
    total_points = 0

    if selected_reg:
        selected_student = Student.query.filter_by(registration_number=selected_reg).first()
        if selected_student:
            activities = Activity.query.filter_by(student_id=selected_student.id).order_by(Activity.created_at.desc()).all()
            total_points = sum(a.points for a in activities)

    if form.validate_on_submit() and selected_student:
        points = Activity.points_for_position(form.position.data)
        activity = Activity(
            student_id=selected_student.id,
            category=form.category.data,
            event_name=form.event_name.data.strip(),
            position=form.position.data,
            points=points,
        )
        db.session.add(activity)
        db.session.commit()
        flash('Activity added', 'success')
        return redirect(url_for('main.profiles', reg=selected_student.registration_number))

    return render_template('profiles.html', students=students, selected_student=selected_student,
                           activities=activities, total_points=total_points, form=form, search=search)


@bp.route('/dept-toppers')
@login_required
def dept_toppers():
    # rank within each department
    subq = db.session.query(
        Activity.student_id.label('student_id'),
        func.sum(Activity.points).label('points')
    ).group_by(Activity.student_id).subquery()

    rows = db.session.query(
        Student.department, Student.name, Student.registration_number, subq.c.points
    ).join(subq, Student.id == subq.c.student_id).order_by(Student.department.asc(), subq.c.points.desc(), Student.name.asc()).all()

    # organize by department
    result = {}
    for dept, name, reg, pts in rows:
        result.setdefault(dept, []).append({'name': name, 'reg': reg, 'points': int(pts or 0)})

    return render_template('dept_toppers.html', result=result)


@bp.route('/college-toppers')
@login_required
def college_toppers():
    rows = db.session.query(
        Student.name, Student.registration_number, func.coalesce(func.sum(Activity.points), 0).label('points')
    ).outerjoin(Activity, Student.id == Activity.student_id).group_by(Student.id).order_by(func.sum(Activity.points).desc().nullslast(), Student.name.asc()).all()

    toppers = [{'name': name, 'reg': reg, 'points': int(pts or 0)} for name, reg, pts in rows]
    return render_template('college_toppers.html', toppers=toppers)


@bp.route('/below-average')
@login_required
def below_average():
    # compute per-section lowest students
    rows = db.session.query(
        Student.section, Student.name, Student.registration_number, func.coalesce(func.sum(Activity.points), 0).label('points')
    ).outerjoin(Activity, Student.id == Activity.student_id).group_by(Student.id).order_by(Student.section.asc(), func.sum(Activity.points).asc().nullslast(), Student.name.asc()).all()

    # collect lowest per section
    lowest_by_section = {}
    for section, name, reg, pts in rows:
        pts = int(pts or 0)
        if section not in lowest_by_section:
            lowest_by_section[section] = []
        if not lowest_by_section[section] or pts == lowest_by_section[section][0]['points']:
            lowest_by_section[section].append({'name': name, 'reg': reg, 'points': pts})
        elif pts > lowest_by_section[section][0]['points']:
            continue

    return render_template('below_average.html', lowest_by_section=lowest_by_section)
