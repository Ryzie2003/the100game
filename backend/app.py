from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

@app.route('/api/population', methods=['GET'])
def get_population():
    # URL of the Worldometer page
    url = "https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_population"

    headers = {"User-Agent": "Mozilla/5.0"}
    # Make an HTTP request to the Worldometers page
    response = requests.get(url)

    # If the request is successful
    if response.status_code == 200:
        # Parse the HTML using BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find the table rows (representing each country)
        table = soup.find("table", {"class": "wikitable"})

        if not table:
            return jsonify({"message": "Table not found"}), 500

        countries = []

        rows = table.find_all("tr")[1:101]  # Skip header row and limit to top 100

        for row in rows:
            cols = row.find_all("td")

            if len(cols) >= 2:
                country_name = cols[0].text.strip()  # Country name column
                population = cols[1].text.strip().split("[")[0]  # Remove references

                countries.append({
                    'country': country_name,
                    'population': population
                })

        return jsonify(countries)

    return jsonify({"message": "Failed to fetch data"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=8040)


