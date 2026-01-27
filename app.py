from flask import Flask, render_template, jsonify, redirect, url_for
import json
import os

app = Flask(__name__)

def load_json(filename):
    filepath = os.path.join('static', 'data', filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# ==================== HERO ANIMATION ROUTE ====================
@app.route("/")
def index():
    """Redirect to hero animation page"""
    return redirect(url_for('hero'))

@app.route("/hero")
def hero():
    """Hero animation landing page"""
    return render_template("hero.html")

# ==================== MAIN PAGES ====================
@app.route("/home")
def home():
    """Main home page"""
    return render_template("home.html")

@app.route("/movie/<int:movie_id>")
def movie(movie_id):
    """Movie detail page"""
    return render_template("movie.html", movie_id=movie_id)

@app.route("/timeline")
def timeline():
    """Timeline page"""
    return render_template("timeline.html")

@app.route("/fanmeeting")
def fanmeeting():
    """Fanmeeting page"""
    return render_template("fanmeeting.html")

# ==================== API ENDPOINTS ====================
@app.route("/api/movies")
def api_movies():
    """Get all movies"""
    return jsonify(load_json('movies.json'))

@app.route("/api/movie/<int:movie_id>")
def api_movie(movie_id):
    """Get single movie by ID"""
    movies = load_json('movies.json')
    movie = next((m for m in movies if m['id'] == movie_id), None)
    return jsonify(movie)

@app.route("/api/quotes")
def api_quotes():
    """Get all quotes"""
    return jsonify(load_json('quotes.json'))

@app.route("/api/songs")
def api_songs():
    """Get all songs"""
    return jsonify(load_json('songs.json'))

@app.route("/api/timeline")
def api_timeline():
    """Get timeline data"""
    return jsonify(load_json('timeline.json'))

@app.route("/api/fanmeetings")
def api_fanmeetings():
    """Get all fanmeetings"""
    return jsonify(load_json('fanmeetings.json'))

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    """Handle 500 errors"""
    return render_template('500.html'), 500

# ==================== RUN APPLICATION ====================
if __name__ == "__main__":
    print("=" * 50)
    print("🎬 YOONA MEMORY APP WITH HERO ANIMATION")
    print("=" * 50)
    print("✅ Server đang chạy tại:")
    print("   🌐 http://localhost:5000")
    print("   🌐 http://127.0.0.1:5000")
    print("=" * 50)
    print("📍 Routes:")
    print("   / (Hero Animation)")
    print("   /hero (Hero Animation)")
    print("   /home (Main Page)")
    print("   /timeline (Timeline)")
    print("   /fanmeeting (Fanmeeting)")
    print("   /movie/<id> (Movie Detail)")
    print("=" * 50)
    print("🚀 Press Ctrl+C to stop server")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
