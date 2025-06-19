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
                    "barometricPressure": row.get("BarometricPressure"),
                    "seaSurfaceTemperature": row.get("SeaSurfaceTemperature"),
                    "submergence": row.get("Submergence"),
                })
            except Exception as e:
                print(f"Skipping row due to error: {e}")
    return data

@app.route('/api/timeseries', methods=['GET'])
def get_timeseries():
    data = parse_csv('positions.csv')

    series_sorted = sorted(data, key=lambda x: datetime.strptime(x["obsTime"], "%d-%m-%Y %H:%M:%S"))

    result = []
    for row in series_sorted:
        try:
            dt = datetime.strptime(row["obsTime"], "%d-%m-%Y %H:%M:%S")
            iso_time = dt.isoformat() 
            pressure = float(row["barometricPressure"]) if row["barometricPressure"] not in ["", "NaN", None] else None
            if pressure is not None:
                result.append({
                    "time": iso_time,
                    "pressure": pressure,
                    "seaSurfaceTemperature": float(row["seaSurfaceTemperature"]) if row.get("seaSurfaceTemperature") not in ["", "NaN", None] else None,
                    "submergence": float(row["submergence"]) if row.get("submergence") not in ["", "NaN", None] else None
                })
        except Exception as e:
            print(f"Skipping row due to error: {e}")
    
    return jsonify(result)



@app.route('/api/positions', methods=['GET'])
def get_positions():
    all_data = parse_csv()
    return jsonify(all_data)

if __name__ == '__main__':
    app.run(debug=True)
