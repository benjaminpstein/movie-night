from flask import Blueprint, render_template, redirect, url_for, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc, func

from .models import db, User, Hangout, UserHangout, Movie, MovieHangout


views = Blueprint('views', __name__)

@views.route('/')
def public():
    """
    base page
    :return: redirect to the home page if authenticated, and the public facing page if not
    """
    user = current_user if current_user.is_authenticated else None
    if current_user.is_authenticated:
        return redirect(url_for('views.home'))
    else:
        return render_template('public.html', user=user)

@views.route('/home')
@login_required
def home():
    """
    home page with links to hangouts and options to join/make new hangouts.
    :return: home page with user information and hangout information
    """
    user_hangouts = db.session.query(Hangout).join(UserHangout).filter(
        UserHangout.user_id == current_user.user_id).order_by(desc(Hangout.hangout_id)).all()

    hangout_info = {}

    for hangout in user_hangouts:
        subquery = (
            db.session.query(
                UserHangout.hangout_id,
                Hangout.hangout_name,
                Hangout.hangout_desc,
                User.username
            )
            .join(User, UserHangout.user_id == User.user_id)
            .join(Hangout, UserHangout.hangout_id == Hangout.hangout_id)
            .filter(UserHangout.hangout_id == hangout.hangout_id)
            .group_by(UserHangout.hangout_id, Hangout.hangout_name, User.username, Hangout.hangout_desc)
            .order_by(UserHangout.hangout_id)
            .subquery()
        )

        users_in_hangout = (
            db.session.query(
                subquery.c.hangout_id,
                subquery.c.hangout_name,
                subquery.c.hangout_desc,
                func.group_concat(subquery.c.username).label('usernames_list')
            )
            .group_by(subquery.c.hangout_id, subquery.c.hangout_name)
            .order_by(subquery.c.hangout_id)
            .all()
        )

        hangout_info[hangout.hangout_id] = [
            dict(row._asdict()) for row in users_in_hangout
        ]

    return render_template('home.html', user=current_user, hangout_info=hangout_info)

@views.route('/leave-hangout', methods=['POST'])
@login_required
def leave_hangout():
    """
    sends the hangout id of the hangout a user is leaving, removes user hangout relationship in database,
    and re-renders home page
    :return: updated hangout info
    """
    hangout_data = request.get_json()
    id_to_delete = hangout_data['hangout_id']

    hangout_row = db.session.query(Hangout).filter(Hangout.hangout_id == id_to_delete).first()

    db.session.query(UserHangout).filter(UserHangout.user_id == current_user.user_id,
                                         UserHangout.hangout_id == id_to_delete).delete()
    db.session.commit()

    if hangout_row and hangout_row.hangout_user_no > 0:
        hangout_row.hangout_user_no -= 1
        db.session.commit()

        if hangout_row.hangout_user_no == 0:
            recommended_movies = (
                Movie.query
                .join(MovieHangout)
                .filter(MovieHangout.hangout_id == hangout_row.hangout_id)
                .all()
            )
            for movie in recommended_movies:
                db.session.delete(movie)
                db.session.commit()
                print(movie)
            movie_hangouts_to_delete = db.session.query(MovieHangout).filter(MovieHangout.hangout_id == hangout_row.hangout_id).all()
            for to_delete in movie_hangouts_to_delete:
                db.session.delete(to_delete)
                db.session.commit()
            db.session.delete(hangout_row)
            db.session.commit()

    user_hangouts = db.session.query(Hangout).join(UserHangout).filter(
        UserHangout.user_id == current_user.user_id).order_by(desc(Hangout.hangout_id)).all()

    hangout_info = {}

    for hangout in user_hangouts:
        subquery = (
            db.session.query(
                UserHangout.hangout_id,
                Hangout.hangout_name,
                User.username
            )
            .join(User, UserHangout.user_id == User.user_id)
            .join(Hangout, UserHangout.hangout_id == Hangout.hangout_id)
            .filter(UserHangout.hangout_id == hangout.hangout_id)
            .group_by(UserHangout.hangout_id, Hangout.hangout_name, User.username)
            .order_by(UserHangout.hangout_id)
            .subquery()
        )

        users_in_hangout = (
            db.session.query(
                subquery.c.hangout_id,
                subquery.c.hangout_name,
                func.group_concat(subquery.c.username).label('usernames_list')
            )
            .group_by(subquery.c.hangout_id, subquery.c.hangout_name)
            .order_by(subquery.c.hangout_id)
            .all()
        )

        hangout_info[hangout.hangout_id] = [
            dict(row._asdict()) for row in users_in_hangout
        ]

    return jsonify(hangout_info=hangout_info)