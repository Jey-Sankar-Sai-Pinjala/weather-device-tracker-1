from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, 'positions.csv')

def parse_csv(filepath=CSV_FILE):
    data = []
    with open(filepath, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            try:
                data.append({
                    "fixTime": row["PositionFixTime"],
                    "obsTime": row["ObservationTime"],
                    "lat": float(row["Latitude"]),
                    "lon": float(row["Longitude"]),
                })
            except Exception as e:
                print(f"Skipping row due to error: {e}")
    return data

@app.route('/api/positions', methods=['GET'])
def get_positions():
    requested_date = request.args.get("date")
    all_data = parse_csv()

    if requested_date:
        filtered = [row for row in all_data if row["fixTime"].startswith(requested_date)]
        return jsonify(filtered)

    return jsonify(all_data)

if __name__ == '__main__':
    app.run(debug=True)
