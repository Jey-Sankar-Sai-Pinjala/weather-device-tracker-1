from flask import Flask, jsonify
from flask_cors import CORS  
import csv

app = Flask(__name__)
CORS(app) 

def parse_csv(filepath):
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
    return jsonify(parse_csv('positions.csv'))

if __name__ == '__main__':
    app.run(debug=True)
