from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import os
from datetime import datetime

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

# @app.route('/api/timeseries', methods=['GET'])
# def get_timeseries():
#     lat = float(request.args.get("lat"))
#     lon = float(request.args.get("lon"))

#     data = parse_csv('positions.csv')
#     series = [row for row in data if abs(row["lat"] - lat) < 0.0001 and abs(row["lon"] - lon) < 0.0001]

#     return jsonify(series)



@app.route('/api/positions', methods=['GET'])
def get_positions():
    month_param = request.args.get("month")  # format: MM-YYYY
    all_data = parse_csv()

    if month_param:
        filtered = [row for row in all_data if row["fixTime"][6:9] == month_param]
        return jsonify(filtered)

    return jsonify(all_data)

if __name__ == '__main__':
    app.run(debug=True)
