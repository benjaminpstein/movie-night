drop database if exists movie_night;

create database movie_night;

use movie_night;

create table user
(
    first_name varchar(255) not null,
    last_name  varchar(255) not null,
    username   varchar(255) not null,
    email      varchar(255) not null,
    password   varchar(255) not null,
    user_id    int auto_increment,
    constraint user_pk_id
        primary key (user_id),
    constraint user_uq_email
        unique (email),
    index username_idx (username),
    index email_idx (email)
);

create table hangout
(
    hangout_name varchar(255) not null,
    hangout_password varchar(255) not null,
    hangout_user_no int not null,
    hangout_desc TEXT null,
    hangout_id   int auto_increment,
    constraint hangout_pk_id
        primary key (hangout_id),
    constraint hangout_uq_name
        unique (hangout_name),
    index hangout_name_idx (hangout_name)
);

create table user_hangout
(
    user_id  int not null,
    hangout_id int not null,
    constraint user_hangout_pk
        primary key (user_id, hangout_id),
    constraint hangout_user_hangout
        foreign key (hangout_id) references hangout (hangout_id),
    constraint user_user_hangout
        foreign key (user_id) references user (user_id)
);

create table movie (
    imdb_id varchar(255) not null,
    title varchar(255) not null,
    year varchar(255),
    poster_url varchar(1024),
    type varchar(255),
    website varchar(1024),
    added_by int,
    added_by_user varchar(255),
    movie_id int auto_increment,
    index idx_title (title),
    index idx_imdb_id (imdb_id),
    constraint movie_pk
        unique (movie_id),
    constraint movie_added_by
        foreign key (added_by) references user (user_id)
);

create table movie_hangout
(
    movie_id int not null,
    hangout_id int not null,
    constraint movie_hangout_pk
        primary key (movie_id, hangout_id),
    constraint hangout_movie_hangout
        foreign key (hangout_id) references hangout (hangout_id),
    constraint movie_movie_hangout
        foreign key (movie_id) references movie (movie_id) on delete cascade
);

create table vote
(
    user_id int not null,
    hangout_id int not null,
    movie_id int not null,
    vote_id int auto_increment,
    constraint vote_pk
        primary key (vote_id),
    constraint vote_uq
        unique (user_id, hangout_id)
);
