from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# Load JSON data
def load_json(filename):
    filepath = os.path.join('static', 'data', filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/movie/<int:movie_id>")
def movie(movie_id):
    return render_template("movie.html", movie_id=movie_id)

@app.route("/timeline")
def timeline():
    return render_template("timeline.html")

# API endpoints for JSON data
@app.route("/api/movies")
def api_movies():
    return jsonify(load_json('movies.json'))

@app.route("/api/movie/<int:movie_id>")
def api_movie(movie_id):
    movies = load_json('movies.json')
    movie = next((m for m in movies if m['id'] == movie_id), None)
    return jsonify(movie)

@app.route("/api/quotes")
def api_quotes():
    return jsonify(load_json('quotes.json'))

@app.route("/api/songs")
def api_songs():
    return jsonify(load_json('songs.json'))

@app.route("/api/timeline")
def api_timeline():
    return jsonify(load_json('timeline.json'))

if __name__ == "__main__":
    print("=" * 50)
    print("🎬 YOONA MEMORY APP")
    print("=" * 50)
    print("✅ Server đang chạy tại:")
    print("   http://localhost:5000")
    print("   http://127.0.0.1:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
