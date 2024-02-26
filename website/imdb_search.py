import requests

def search_movie(movie_title, movie_year):
    """
    connects to obdm API to get movie information
    :param movie_title: movie title string
    :param movie_year: movie year string
    :return: json with list of movies and their information
    """
    api_url = "https://www.omdbapi.com/"
    api_key = "fadb4745"

    url = f"{api_url}?apikey={api_key}&s={movie_title}&y={movie_year}"

    response = requests.get(url)

    if response.status_code == 200:
        movie_data = response.json()
        return movie_data
    else:
        return None
