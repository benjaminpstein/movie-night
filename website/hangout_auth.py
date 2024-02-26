from flask import Blueprint, render_template, request, flash, redirect, url_for
from .models import User, Hangout, UserHangout
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from flask_login import current_user, login_required


hangout_auth = Blueprint('hangout-auth', __name__)

@hangout_auth.route('/make-hangout', methods=['GET', 'POST'])
@login_required
def make_hangout():
    """
    form for user to create a hangout
    :return: home page on success, make hangout page with error flash on failure
    """
    user = current_user
    if request.method == 'POST':
        hangout_name = request.form.get('hangout_name')
        hangout_password = request.form.get('hangout_password')
        hangout_desc = request.form.get('hangout_desc')

        hangout = Hangout.query.filter_by(hangout_name=hangout_name).first()

        if hangout is not None:
            flash('hangout already exists', category='error')
        elif len(hangout_name) < 1:
            flash('please enter a hangout name', category='error')
        elif len(hangout_password) < 1:
            flash('please enter a hangout password', category='error')
        elif hangout_desc and len(hangout_desc) > 300:
            flash("description max 300 characters not an essay", category='error')
        else:
            new_hangout = Hangout(hangout_name=hangout_name,
                                  hangout_password=generate_password_hash(hangout_password,), hangout_user_no=1, hangout_desc=hangout_desc)
            db.session.add(new_hangout)
            db.session.commit()
            new_userhangout = UserHangout(user_id=user.user_id, hangout_id=new_hangout.hangout_id)
            db.session.add(new_userhangout)
            db.session.commit()
            flash("hangout created!", category='primary')
            return redirect(url_for('views.home'))
    return render_template("make-hangout.html", user=current_user)

@hangout_auth.route('/join-hangout', methods=['GET', 'POST'])
@login_required
def join_hangout():
    """
    form to join an existing hangout
    :return: home page on success, join hangout page with error flash on failure
    """
    user = current_user
    if request.method == 'POST':
        hangout_name = request.form.get('hangout_name')
        hangout_password = request.form.get('hangout_password')

        hangout = Hangout.query.filter_by(hangout_name=hangout_name).first()

        if hangout:
            users_in_hangout = (
                User.query.join(UserHangout)
                .filter(UserHangout.hangout_id == hangout.hangout_id)
                .all()
            )
            if current_user not in users_in_hangout:
                if hangout.hangout_user_no <= 12:
                    if check_password_hash(hangout.hangout_password, hangout_password):
                        hangout.hangout_user_no += 1
                        flash("welcome to the party", category='primary')
                        new_userhangout = UserHangout(user_id=user.user_id,
                                                      hangout_id=hangout.hangout_id)
                        db.session.add(new_userhangout)
                        db.session.commit()
                        return redirect(url_for('views.home'))
                    else:
                        flash("WRONG PASSWORD!!!!!", category='error')
                else:
                    flash("hangout is full (12 user max)", category='error')
            else:
                flash("already in this hangout", category='error')
        else:
            flash("hangout does not exist", category='error')

    return render_template("join-hangout.html", user=current_user)
