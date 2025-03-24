from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import os

app = Flask(__name__)
CORS(app)


@app.route('/api/songs', methods=['GET'])
def get_most_streamed_songs():
    url = "https://kworb.net/spotify/songs.html"
    headers = {"User-Agent": "Mozilla/5.0"}  # Mimic a real browser

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return jsonify({"message": "Failed to fetch page"}), 500

    # Parse the page HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Locate the main table - adjust the selector if there's a unique ID or class
    table = soup.find("table")
    if not table:
        return jsonify({"message": "Table not found"}), 500

    # Locate the table body (if it exists)
    tbody = table.find("tbody")
    if tbody:
        rows = tbody.find_all("tr")
    else:
        # If no <tbody>, take all <tr> after the header row
        rows = table.find_all("tr")[1:]  # skip the header row

    results = []
    # Limit to top 100 rows
    for i, row in enumerate(rows):
        if i >= 100:
            break

        cells = row.find_all("td")
        # We expect exactly 3 columns: Rank, Streams, Artist and Title
        if len(cells) < 3:
            continue

        
        streams = cells[1].get_text(strip=True)
        artist_title = cells[0].get_text(strip=True)

        
        parts = artist_title.split(" - ", 1)

        if len(parts) == 2:
            artist = parts[0]
            song_title = parts[1]

        results.append({
            "streams": streams,
            "song_title": song_title,
            "song_and_artist": artist_title
        })

    return jsonify(results)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3000))
    app.run(port=port)
