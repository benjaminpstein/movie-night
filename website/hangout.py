from flask import Blueprint, render_template, request, abort, jsonify
from .models import User, Hangout, UserHangout, Movie, MovieHangout, Vote
from . import db
from flask_login import login_required, current_user
from .imdb_search import search_movie
from sqlalchemy import exists, func
from sqlalchemy.exc import IntegrityError


hangout = Blueprint('hangout', __name__)


@hangout.route('/<int:hangout_id>', methods=['GET', 'POST'])
@login_required
def hangout_page(hangout_id):
    """
    render hangout page
    :param hangout_id: id parsed from url to identify hangout.
    :return: hangout page with info for user, hangout, users in hangout, and recommended movies
    """

    hangout = Hangout.query.get(hangout_id)
    user = current_user
    is_member = UserHangout.query.filter_by(user_id=user.user_id, hangout_id=hangout_id).first()

    if not hangout:
        abort(404)
    elif not is_member:
        abort(403)

    users_in_hangout = (
        User.query.join(UserHangout)
        .filter(UserHangout.hangout_id == hangout_id)
        .all()
    )

    recommended_movies = (
        Movie.query
        .join(MovieHangout)  # Join with the movie_hangout table
        .filter(MovieHangout.hangout_id == hangout_id)
        .all()
    )
    serialized_movies = []
    for movie in recommended_movies:
        serialized_movie = {
            'Movie_id': movie.movie_id,
            'Title': movie.title,
            'Year': movie.year,
            'Poster_url': movie.poster_url,
            'Website': movie.website,
            'User': movie.added_by_user
        }
        serialized_movies.insert(0, serialized_movie)

    movie_info = None
    return render_template('hangout-page.html',
                           user=user,
                           hangout=hangout,
                           users_in_hangout=users_in_hangout,
                           movie_info=movie_info,
                           recommended_movies=serialized_movies,
                           hangout_id=hangout_id)


@hangout.route('/send-movie', methods=['POST'])
@login_required
def send_movie():
    """
    receives user movie search and returns search results
    :return: movie info for search results
    """

    search_data = request.get_json()

    movie_name = search_data['movie_name']
    movie_year = search_data['movie_year']

    movie_info = search_movie(movie_name, movie_year)

    return jsonify(movie_info=movie_info)


@hangout.route('/recommend-movie', methods=['POST'])
@login_required
def recommend_movie():
    """
    receives information for chosen movie and adds to database
    :return: updated list of recommended movies on success, none on failure
    """
    movie_data = request.get_json()
    hangout_id = movie_data['hangout_id']

    movie_exists = (
        db.session.query(exists().where(
            (MovieHangout.movie_id == Movie.movie_id) &
            (Movie.imdb_id == movie_data['imdbID']) &
            (MovieHangout.hangout_id == hangout_id)
        )).scalar()
    )

    if movie_exists:
        return jsonify(recommended_movies=None)

    new_movie = Movie(
        imdb_id=movie_data['imdbID'],
        title=movie_data['Title'],
        year=movie_data['Year'],
        poster_url=movie_data['Poster'],
        type=movie_data['Type'],
        website="https://imdb.com/title/"+movie_data['imdbID'],
        added_by=current_user.user_id,
        added_by_user=current_user.username
    )

    db.session.add(new_movie)
    db.session.commit()

    new_moviehangout = MovieHangout(movie_id=new_movie.movie_id, hangout_id=hangout_id)

    db.session.add(new_moviehangout)
    db.session.commit()

    recommended_movies = (
        Movie.query
        .join(MovieHangout)  # Join with the movie_hangout table
        .filter(MovieHangout.hangout_id == hangout_id)
        .all()
    )

    serialized_movies = []
    for movie in recommended_movies:
        serialized_movie = {
            'Movie_id': movie.movie_id,
            'Title': movie.title,
            'Year': movie.year,
            'Poster_url': movie.poster_url,
            'Website': movie.website,
            'User': movie.added_by_user
        }
        serialized_movies.insert(0, serialized_movie)

    return jsonify(recommended_movies=serialized_movies)


@hangout.route('/delete-movie', methods=['POST'])
@login_required
def delete_movie():
    """
    receives a movie id and deletes the movie from the database
    :return: updated recommended movies on success, error on failure
    """
    movie_data = request.get_json()
    id_to_delete = movie_data['movie_id']
    hangout_id = movie_data['hangout_id']

    movie_row = db.session.query(Movie).filter(Movie.movie_id == id_to_delete).first()

    if not movie_row:
        return jsonify({'error': 'Movie not found'})

    db.session.query(MovieHangout).filter(MovieHangout.movie_id == id_to_delete,
                                          MovieHangout.hangout_id == hangout_id).delete()
    db.session.commit()
    db.session.delete(movie_row)
    db.session.commit()

    recommended_movies = (
        Movie.query
        .join(MovieHangout)  # Join with the movie_hangout table
        .filter(MovieHangout.hangout_id == hangout_id)
        .all()
    )

    serialized_movies = []
    for movie in recommended_movies:
        serialized_movie = {
            'Movie_id': movie.movie_id,
            'Title': movie.title,
            'Year': movie.year,
            'Poster_url': movie.poster_url,
            'Website': movie.website,
            'User': movie.added_by_user
        }
        serialized_movies.insert(0, serialized_movie)
    return jsonify(recommended_movies=serialized_movies)


@hangout.route('/vote-for-movie', methods=['POST'])
@login_required
def vote_for_movie():
    """
    receives movie user wants to vote for and registers vote
    :return: success or error and info
    """

    movie_data = request.get_json()
    movie_id = movie_data['movie_id']
    hangout_id = movie_data['hangout_id']

    new_vote = Vote(user_id=current_user.user_id, hangout_id=hangout_id, movie_id=movie_id)

    movie_row = db.session.query(Movie).filter(Movie.movie_id == movie_id).first()

    if not movie_row:
        return jsonify({'error': 'Movie not found'})

    try:
        db.session.add(new_vote)
        db.session.commit()
        return jsonify({'success': True, 'error': 'None'})

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Duplicate vote'})

    finally:
        db.session.close()


@hangout.route('/get-vote-result', methods=['POST'])
@login_required
def get_vote_result():
    """
    receives hangout id and tallies votes for the hangout
    :return: winning movie
    """
    data = request.get_json()
    hangout_id = data['hangout_id']

    result_ids = (
        db.session.query(Vote.movie_id, func.count(Vote.movie_id).label('vote_count'))
        .filter_by(hangout_id=hangout_id)
        .group_by(Vote.movie_id)
        .order_by(func.count(Vote.movie_id).desc())
        .all()
    )

    if len(result_ids) > 1:
        return jsonify({'name': 'None', 'tie': 'True'})
    elif len(result_ids) < 1:
        return jsonify({'name': 'None', 'tie': 'False', 'vote': 'False'})

    result_movie_id = result_ids[0].movie_id
    result_movie = db.session.query(Movie).filter(Movie.movie_id == result_movie_id).first()

    return jsonify({'name': result_movie.title, 'tie': 'False', 'vote': 'True'})


@hangout.route('/reset-vote', methods=['POST'])
@login_required
def reset_vote():
    """
    receives hangout id and deletes past votes for the hangout
    :return: success
    """
    data = request.get_json()
    hangout_id = data['hangout_id']

    result_rows = (
        db.session.query(Vote).filter(Vote.hangout_id == hangout_id)
    )

    for result in result_rows:
        db.session.delete(result)

    db.session.commit()

    return jsonify({'success': 'True'})


@hangout.route('/refresh-movies', methods=['POST'])
@login_required
def refresh_movies():
    """
    updates recommended movies for a hangout page to account for live changes by other users
    :return: updated movie list
    """
    data = request.get_json()
    hangout_id = data['hangout_id']

    recommended_movies = (
        Movie.query
        .join(MovieHangout)
        .filter(MovieHangout.hangout_id == hangout_id)
        .all()
    )
    serialized_movies = []
    for movie in recommended_movies:
        serialized_movie = {
            'Movie_id': movie.movie_id,
            'Title': movie.title,
            'Year': movie.year,
            'Poster_url': movie.poster_url,
            'Website': movie.website,
            'User': movie.added_by_user
        }
        serialized_movies.insert(0, serialized_movie)

    return jsonify(recommended_movies=serialized_movies)
