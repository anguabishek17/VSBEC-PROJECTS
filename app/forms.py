from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, IntegerField, SelectField
from wtforms.validators import DataRequired, Length, NumberRange


class LoginForm(FlaskForm):
    username = StringField('User ID', validators=[DataRequired(), Length(min=3, max=80)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6, max=128)])
    submit = SubmitField('Login')


class StudentRegistrationForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(max=120)])
    registration_number = StringField('Registration Number', validators=[DataRequired(), Length(max=50)])
    department = StringField('Department', validators=[DataRequired(), Length(max=100)])
    section = StringField('Section', validators=[DataRequired(), Length(max=10)])
    year_of_study = IntegerField('Year of Study', validators=[DataRequired(), NumberRange(min=1, max=6)])
    submit = SubmitField('Register Student')


class ActivityForm(FlaskForm):
    category = SelectField('Category', choices=[
        ('academic', 'Academic'),
        ('co-curricular', 'Co-curricular'),
        ('extra-curricular', 'Extra-curricular'),
    ], validators=[DataRequired()])
    event_name = StringField('Event Name', validators=[DataRequired(), Length(max=200)])
    position = SelectField('Position', choices=[
        ('first', 'First - 10 pts'),
        ('second', 'Second - 5 pts'),
        ('third', 'Third - 3 pts'),
        ('participation', 'Participation - 1 pt'),
    ], validators=[DataRequired()])
    submit = SubmitField('Add Activity')
