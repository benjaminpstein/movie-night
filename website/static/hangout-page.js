let movie_search = '#movie_search'
let year_search = '#year_search'

/*
option_movie_cancel empties the option movie container on user clicking the cancel button
 */
function option_movie_cancel() {
    $('#movie-info-container').empty();
    console.log("cancel")
}

/*
searchMovie parses search values for the movie search box and calls sendMovie to make the ajax call
 */
function searchMovie() {
    const movie_name = $(movie_search).val().trim();
    const movie_year = $(year_search).val().trim();
    let movie_query = {
        "movie_name": movie_name,
        "movie_year": movie_year
    };
    sendMovie(movie_query);
    $("#movie_search").val("");
    $("#year_search").val("");
}

/*
sendMovie sends the @param movie_query to the server and receives results, either calling displayOptionMovie
on success or flashing error messages on failure
 */
function sendMovie(movie_query) {
    $.ajax({
        type: "POST",
        url: "/hangout/send-movie",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(movie_query),
        success: function (result) {
            // Check if the response contains movie_info
            let movie_info = result['movie_info'];
            if (movie_info == null) {
                flashMessage('movie lookup failed :(', 'danger')
            } else if(movie_info.Response === 'False'){
                flashMessage('movie not found :(', 'danger')
            }else{
                displayOptionMovie(movie_info)
            }
        },
        error: function (request, status, error) {
            console.log("Error");
            console.log(request);
            console.log(status);
            console.log(error);
        }
    });
}

/*
displayOptionMovie fills the option movie container with information for the three movie search results
 */
function displayOptionMovie(movie_info) {
    let movie_arr = movie_info['Search'];

    const movieContainer = $("#movie-info-container");
    movieContainer.empty();
    const rowDiv = $('<div class="row"></div>');
    for (let i = 0; i < 3; i++) {
        let cur_movie = movie_arr[i];
        rowDiv.append(`<div class="col-3 recommended-movie">
                        <div class="movie-container recommend-btn pointer" data-info="${i}">
                            <div class="row" data-info="${i}">
                                <button type="button" class="btn btn-primary btn-sm float-end pointer">recommend</button>
                            </div>
                            <div class="row recommended-movie-poster">
                                <img src="${cur_movie.Poster}" class="rounded" alt="movie poster" width="100%">
                            </div>
                            <div class="row recommended-movie-title">
                                ${cur_movie.Title}
                            </div>
                            <div class="row recommended-movie-user">
                                ${cur_movie.Year}
                            </div>
                        </div>
                    </div>`);
    }
    rowDiv.append(`<div class="col-3">
                        <button id="cancel-btn" class="btn btn-outline-secondary" style="width: 80%" onclick="option_movie_cancel()">cancel</button>
                        <br>
                        <div id="search-info">
                        if you aren't getting the right movies, try adding the year. the search sometimes has trouble with numbers. 
                        movie database powered by omdbapi.
                        </div>
                    </div>`)
    movieContainer.append(rowDiv);
    $('.recommend-btn').on('click', function () {
        const index = parseInt($(this).data('info'));
        console.log(index);
        console.log(movie_arr);
        recommendMovie(movie_arr[index]);
    });
}

/*
recommendMovie sends @param movie_info to the server to be added to the hangouts recommended movies and
displays updated recommended movies
 */
function recommendMovie(movie_info) {
    refreshRecommendedMovies().then(() => {
        console.log(movie_info)
        let hangout_id = window.location.pathname.split('/').pop();

        if (hangout_id) {
            console.log(hangout_id);
        } else {
            console.log('hangout_id not found in URL');
        }
        movie_info['hangout_id'] = hangout_id
        $.ajax({
            type: "POST",
            url: "/hangout/recommend-movie",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(movie_info),
            success: function (result) {
                if (result.recommended_movies === null){
                    flashMessage("movie already recommended", "danger");
                    option_movie_cancel();
                }else{
                    console.log(result);
                    option_movie_cancel();
                    recommended_movies = result.recommended_movies;
                    displayRecommendedMovies();
                    flashMessage("movie recommended!", "primary")
                }
            },
            error: function (request, status, error) {
                console.log("Error");
                console.log(request);
                console.log(status);
                console.log(error);
            }
        });
    }).catch((error) => {
        console.error('Error:', error);
    });
}

/*
refreshRecommendedMovies gets updated movies to account for other user inputs. It uses a promise to
account for the asynchronous ajax call then displays the updated movies
 */
function refreshRecommendedMovies(){
    return new Promise((resolve, reject) => {
        let hangout_id = window.location.pathname.split('/').pop();
        let info = { 'hangout_id': hangout_id };
        $.ajax({
            type: "POST",
            url: "/hangout/refresh-movies",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(info),
            success: function (result) {
                recommended_movies = result.recommended_movies;
                displayRecommendedMovies();
                resolve();
            },
            error: function (request, status, error) {
                console.log("Error");
                console.log(request);
                console.log(status);
                console.log(error);
                reject(error);
            }
        });
    });
}

/*
displayRecommendedMovies fills the recommended movies container with movies and refreshes button containers to defaults
 */
function displayRecommendedMovies() {
    const deleteBtnContainer = $("#delete-mode-btn-container");
    deleteBtnContainer.empty();
    let btnDiv = $('<div class="row"></div>');
    btnDiv.append(`<button type="submit" class="btn btn-secondary btn-sm" onclick="deleteMode()">choose movies to delete</button>`);
    deleteBtnContainer.append(btnDiv);

    const movieContainer = $("#recommended-movies-container");
    movieContainer.empty();
    console.log('new' + recommended_movies);
    let rowDiv = $('<div class="row"></div>');
    let maxMoviesToShow = 16;

    for (let i = 0; i < Math.min(recommended_movies.length, maxMoviesToShow); i++) {
        let movie = recommended_movies[i];

        if (i % 4 === 0) {
            rowDiv = $('<div class="row recommended-movie-row"></div>');
        }

        rowDiv.append(`<div class="col-3 recommended-movie">
                        <div class="movie-container">
                        <div id="movie-btn-container-${movie.Movie_id}"></div>
                        <div class="row recommended-movie-poster">
                            <a href="${movie.Website}" target="_blank">
                            <img src="${movie.Poster_url}" class="rounded" alt="movie poster" width="100%">
                            </a>
                        </div>
                        <div class="row recommended-movie-title">
                            <a href="${movie.Website}" target="_blank" style="text-decoration: none; color: inherit; margin-left: -12px">
                            ${movie.Title}
                            </a>
                        </div>
                        <div class="row recommended-movie-user">
                            <a href="${movie.Website}" target="_blank" style="text-decoration: none; color: inherit; margin-left: -12px">
                                via ${movie.User}
                            </a>
                        </div>
                        </div>
                    </div>`);

        if ((i + 1) % 4 === 0 || i === recommended_movies.length - 1) {
            movieContainer.append(rowDiv);
        }
    }
}

/*
deleteMode refreshes movies then adds delete buttons to recommended movies
 */
function deleteMode(){
    refreshRecommendedMovies().then(() => {
        let maxMoviesToShow = 16;

        for (let i = 0; i < Math.min(recommended_movies.length, maxMoviesToShow); i++) {
            let movie = recommended_movies[i];

            const movieDeleteContainer = $("#movie-btn-container-" + movie.Movie_id);
            movieDeleteContainer.empty();
            let rowDiv = $('<div class="row"></div>');

            rowDiv.append(`<button type="button" class="btn btn-danger btn-sm float-end" onclick="deleteMovie(${movie.Movie_id})">delete</button>`);

            movieDeleteContainer.append(rowDiv);
        }
        let deleteBtnContainer = $("#delete-mode-btn-container");
        deleteBtnContainer.empty()
        let rowDiv = $('<div class="row"></div>');
        rowDiv.append(`<button type="submit" class="btn btn-primary btn-sm" onclick="displayRecommendedMovies()">done deleting!</button>`);
        deleteBtnContainer.append(rowDiv);
    }).catch((error) => {
        console.error('Error:', error);
    });

}

/*
deleteMovie sends @param movie_id to the server to be removed from the database, flashing the result
 */
function deleteMovie(movie_id){
    let hangout_id = window.location.pathname.split('/').pop();
    console.log(movie_id);
    let deleteData = {'movie_id': movie_id, 'hangout_id': hangout_id};
    $.ajax({
        type: "POST",
        url: "/hangout/delete-movie",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(deleteData),
        success: function (result) {
            if (result.error) {
                console.error(result.error);
                deleteMode();
                flashMessage("movie no longer exists, someone beat you to deleting this!", "danger");
            }else{
                recommended_movies = result.recommended_movies;
                deleteMode();
                flashMessage("movie deleted", "primary")
            }
        },
        error: function (request, status, error) {
            console.log("Error");
            console.log(request);
            console.log(status);
            console.log(error);
        }
    });
}

/*
randomMovie refreshes movies then chooses a random recommended movie to watch
 */
function randomMovie(){
    refreshRecommendedMovies().then(() => {
        let random = Math.floor(Math.random() * (recommended_movies.length));
        let random_movie = recommended_movies[random];
        displayMovieChoice(random_movie.Title);
    }).catch((error) => {
        console.error('Error:', error);
    });
}

/*
displayMovieChoice displays @param movie_name in the movie choice container
 */
function displayMovieChoice(movie_name){
    let movieChoiceContainer = $('#tonight-movie-container');
    movieChoiceContainer.empty();
    let rowDiv = $('<div class="row"></div>');
    rowDiv.append(`<div class="col-8">
                        <div class="tonight-container">
                            tonight's movie: ${movie_name}
                        </div>
                    </div>
                    <div class="col-2">
                        <button type="button" class="btn btn-outline-secondary" onclick="clearChoice()">clear</button>
                    </div>`);

    movieChoiceContainer.append(rowDiv);
}

/*
clearChoice clears the movie choice container
 */
function clearChoice(){
    $("#tonight-movie-container").empty();
}

/*
votingMode refreshes movies then adds a vote button to each recommended movie
 */
function votingMode(){
    refreshRecommendedMovies().then(() => {
        let maxMoviesToShow = 16;

        for (let i = 0; i < Math.min(recommended_movies.length, maxMoviesToShow); i++) {
            let movie = recommended_movies[i];

            const movieVoteContainer = $("#movie-btn-container-" + movie.Movie_id);
            movieVoteContainer.empty();
            let rowDiv = $('<div class="row"></div>');

            rowDiv.append(`<button type="button" class="btn btn-primary btn-sm float-end" onclick="voteForMovie(${movie.Movie_id})">vote</button>`);

            movieVoteContainer.append(rowDiv);
        }
        let votingBtnContainer = $("#voting-btn-container");
        votingBtnContainer.empty()
        let voteDiv = $('<div class="row"></div>');
        voteDiv.append(`<button class="btn btn-primary col-10 tonight-movie-btn" onclick="getResult()">see result</button>`);
        votingBtnContainer.append(voteDiv);
        let resetContainer = $("#reset-vote-container");
        let resetDiv = $('<div class="row"></div>');
        resetDiv.append(`<button class="btn btn-outline-secondary tonight-movie-btn reset-btn" onclick="resetVote()">reset vote</button>`);
        resetContainer.append(resetDiv);
        let randomBtnContainer = $("#random-btn-container");
        randomBtnContainer.empty();
        randomBtnContainer.append(`<button class="btn btn-outline-secondary col-10 tonight-movie-btn" onclick="exitVoteMode()">exit voting mode</button>`)
    }).catch((error) => {
        console.error('Error:', error);
    });

}

/*
voteForMovie sends the @param movie_id voted on to the server which registers the vote
 */
function voteForMovie(movie_id){
    let hangout_id = window.location.pathname.split('/').pop();
    console.log(movie_id);
    let voteData = {'movie_id': movie_id, 'hangout_id': hangout_id};
    $.ajax({
        type: "POST",
        url: "/hangout/vote-for-movie",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(voteData),
        success: function (result) {
            if (result['error'] === 'None') {
                flashMessageLong("voted! click 'see result' to view current winner", "primary")
                displayRecommendedMovies()
            }else if(result['error'] === 'Movie not found'){
                flashMessage("someone deleted this movie before you cast your vote. vote again?", "danger")
            }else{
                flashMessageLong("you already cast your vote. click 'reset' vote to vote again", "danger")
                displayRecommendedMovies()
            }
        },
        error: function (request, status, error) {
            console.log("Error");
            console.log(request);
            console.log(status);
            console.log(error);
        }
    });
}

/*
getResult queries the server for the result of the vote and calls displayMovieChoice for the winning movie
 */
function getResult(){
    let hangout_id = window.location.pathname.split('/').pop();
    let hangout = {'hangout_id': hangout_id};
    $.ajax({
        type: "POST",
        url: "/hangout/get-vote-result",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(hangout),
        success: function (result) {
            if (result['tie'] === 'True') {
                flashMessageLong("tie! please click 'reset' and vote again", "primary");
            }else if(result['vote']==='False'){
                flashMessage("no votes yet, vote to see result", "danger");
            }else{
                displayMovieChoice(result['name']);
                exitVoteMode();
            }
        },
        error: function (request, status, error) {
            console.log("Error");
            console.log(request);
            console.log(status);
            console.log(error);
        }
    });
}

/*
resetVote tells the server to delete hangout votes from the database so that new votes can be cast
 */
function resetVote(){
    refreshRecommendedMovies().then(() => {
    let hangout_id = window.location.pathname.split('/').pop();
    let hangout = {'hangout_id': hangout_id};
    $.ajax({
        type: "POST",
        url: "/hangout/reset-vote",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(hangout),
        success: function () {
            flashMessageLong("vote reset!", "primary");
            exitVoteMode();
            clearChoice();
        },
        error: function (request, status, error) {
            console.log("Error");
            console.log(request);
            console.log(status);
            console.log(error);
        }
    });
    }).catch((error) => {
        console.error('Error:', error);
    });
}

/*
exit voting mode clears voting containers and returns to refreshed state.
 */
function exitVoteMode(){
    refreshRecommendedMovies().then(() => {
        $('#reset-vote-container').empty();
        let votingBtnContainer = $("#voting-btn-container");
        votingBtnContainer.empty();
        votingBtnContainer.append(`<button class="btn btn-outline-primary col-10 tonight-movie-btn" onclick="votingMode()">enter voting mode</button>`)
        let randomBtnContainer = $("#random-btn-container");
        randomBtnContainer.empty();
        randomBtnContainer.append(`<button class="btn btn-outline-secondary col-10 tonight-movie-btn" onclick="randomMovie()">choose random movie</button>`)
    }).catch((error) => {
        console.error('Error:', error);
    });
}

$(document).ready(function () {
    $("#search-button").on("click", function () {
        searchMovie();
    });
    displayRecommendedMovies();

});