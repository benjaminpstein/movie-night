from flask import Blueprint, render_template, request, flash, redirect, url_for
from .models import User
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from flask_login import login_user, login_required, logout_user, current_user

auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    """
    login page
    :return: home page on success, login page with error flash on failure
    """
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = User.query.filter_by(email=email).first()
        if user:
            if check_password_hash(user.password, password):
                flash("we're so back", category='primary')
                login_user(user, remember=True)
                return redirect(url_for('views.home'))
            else:
                flash("WRONG PASSWORD!!!!!", category='error')
        else:
            flash("email does not exist", category='error')
    return render_template("login.html", user=current_user)

@auth.route('/logout')
@login_required
def logout():
    """
    logs user out
    :return: login page
    """
    logout_user()
    return redirect(url_for('auth.login'))

@auth.route('/sign-up', methods=['GET', 'POST'])
def sign_up():
    """
    sign up page, creates new user
    :return: home page on success, sign up page with error flash on failure
    """
    if request.method == 'POST':
        email = request.form.get('email')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        username = request.form.get('username')
        password1 = request.form.get('password1')
        password2 = request.form.get('password2')

        user = User.query.filter_by(email=email).first()

        if user is not None:
            flash('email already exists', category='error')
        elif len(email) < 1:
            flash('please put an email', category='error')
        elif len(first_name) < 1:
            flash('please give a first name', category='error')
        elif len(last_name) < 1:
            flash('please give a last name', category='error')
        elif len(username) < 1:
            flash('please give a username (funny!!!!!)', category='error')
        elif len(password1) < 1:
            flash('how u gonna log in without a password', category='error')
        elif len(password2) < 1:
            flash('please confirm password', category='error')
        elif password1 != password2:
            flash('ERROR: PASSWORDS DO NOT MATCH. STEALING YOUR CREDIT CARD INFORMATION!!!!', category='error')
        else:
            new_user = User(first_name=first_name, last_name=last_name, email=email, username=username, password=generate_password_hash(password1))
            db.session.add(new_user)
            db.session.commit()
            flash("we're in. thanks for making an account :)", category='primary')
            login_user(new_user, remember=True)
            return redirect(url_for('views.home'))
    return render_template("sign_up.html", user=current_user)