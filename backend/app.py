from flask import Flask, jsonify
from flask_cors import CORS  
import csv,os

app = Flask(__name__,static_folder="build")
CORS(app) 

@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

