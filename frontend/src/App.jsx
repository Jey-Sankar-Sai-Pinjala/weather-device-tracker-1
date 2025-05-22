import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function App() {
  const [positions, setPositions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [uniqueDays, setUniqueDays] = useState([]);
  const [currentDay, setCurrentDay] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/positions')
      .then(response => {
        const data = response.data;
        setPositions(data);

        const days = [...new Set(data.map(p => p.fixTime.split(' ')[0]))];
        setUniqueDays(days);
        setCurrentDay(days[0]); // Set to first day
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Animate through days (optional)
  /*
  useEffect(() => {
    let interval;
    if (uniqueDays.length > 0) {
      interval = setInterval(() => {
        setCurrentDay(prev => {
          const idx = uniqueDays.indexOf(prev);
          return uniqueDays[(idx + 1) % uniqueDays.length];
        });
      }, 2000); // every 2 seconds
    }
    return () => clearInterval(interval);
  }, [uniqueDays]);
  */

  const filteredPositions = positions.filter(p => p.fixTime.startsWith(currentDay));
  const polyline = filteredPositions.map(p => [p.lat, p.lon]);

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Select Day: </label>
          <select value={currentDay} onChange={(e) => setCurrentDay(e.target.value)}>
            {uniqueDays.map((day, index) => (
              <option key={index} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <MapContainer center={[8.74, 69.15]} zoom={5} scrollWheelZoom={true} style={{ height: '600px', borderRadius: '1rem' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Polyline positions={polyline} color="red" />
          {filteredPositions.map((pos, index) => (
            <Marker key={index} position={[pos.lat, pos.lon]} eventHandlers={{ click: () => setSelected(pos) }}>
              <Popup>
                <div>
                  <strong>Fix Time:</strong> {pos.fixTime}<br />
                  <strong>Obs Time:</strong> {pos.obsTime}<br />
                  <strong>ΔTime (min):</strong> {Math.round((new Date(pos.fixTime) - new Date(pos.obsTime)) / 60000)}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ flex: 1 }}>
        {selected ? (
          <div>
            <h2>Selected Point</h2>
            <p><strong>Latitude:</strong> {selected.lat}</p>
            <p><strong>Longitude:</strong> {selected.lon}</p>
            <p><strong>Position Fix Time:</strong> {selected.fixTime}</p>
            <p><strong>Observation Time:</strong> {selected.obsTime}</p>
            <p><strong>Time Difference:</strong> {Math.round((new Date(selected.fixTime) - new Date(selected.obsTime)) / 60000)} minutes</p>
          </div>
        ) : (
          <p>Select a marker on the map to view details.</p>
        )}
      </div>
    </div>
  );
}
