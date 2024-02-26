from . import db
from flask_login import UserMixin
from sqlalchemy import Column, Integer, String, Text, ForeignKey


class User(db.Model, UserMixin):
    __tablename__ = 'user'

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)

    def get_id(self):
        return str(self.user_id)


class Hangout(db.Model):
    __tablename__ = 'hangout'

    hangout_id = Column(Integer, primary_key=True, autoincrement=True)
    hangout_name = Column(String(255), nullable=False, unique=True, index=True)
    hangout_password = Column(String(255), nullable=False)
    hangout_user_no = Column(Integer, nullable=False)
    hangout_desc = Column(Text, nullable=True)
    users = db.relationship('UserHangout', backref='hangout', lazy=True)


class UserHangout(db.Model):
    __tablename__ = 'user_hangout'

    user_id = Column(Integer, ForeignKey('user.user_id'), primary_key=True)
    hangout_id = Column(Integer, ForeignKey('hangout.hangout_id'), primary_key=True)


class Movie(db.Model):
    __tablename__ = 'movie'

    imdb_id = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    year = Column(String(255))
    poster_url = Column(String(1024))
    type = Column(String(255))
    website = Column(String(1024))
    added_by = Column(Integer, ForeignKey('user.user_id'))
    added_by_user = Column(String(225))
    movie_id = Column(Integer, primary_key=True, autoincrement=True)


class MovieHangout(db.Model):
    __tablename__ = 'movie_hangout'

    movie_id = Column(Integer, ForeignKey('movie.movie_id', ondelete='CASCADE'), primary_key=True, nullable=False)
    hangout_id = Column(Integer, ForeignKey('hangout.hangout_id'), primary_key=True, nullable=False)


class Vote(db.Model):
    __tablename__ = 'vote'

    user_id = db.Column(db.Integer, nullable=False)
    hangout_id = db.Column(db.Integer, nullable=False)
    movie_id = db.Column(db.Integer, nullable=False)
    vote_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'hangout_id', name='vote_uq'),
    )
