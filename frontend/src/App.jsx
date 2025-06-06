import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function App() {
  const [positions, setPositions] = useState([]);
  const [uniqueDays, setUniqueMonths] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [selected, setSelected] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);

  useEffect(() => {
  axios.get('http://localhost:5000/api/positions')
    .then(response => {
      const data = response.data;
      const months = [...new Set(data.map(p => p.fixTime.slice(6, 9)))]; // MM-YYYY
      setUniqueMonths(months);
      if (months.length > 0) setCurrentMonth(months[0]);
    })
    .catch(error => console.error('Error fetching months:', error));
}, []);

useEffect(() => {
  if (!currentMonth) return;
  axios.get(`http://localhost:5000/api/positions?month=${currentMonth}`)
    .then(response => {
      setPositions(response.data);
    })
    .catch(error => console.error('Error fetching month positions:', error));
}, [currentMonth]);



  const handleMarkerClick = (pos) => {
    setSelected(pos);
    const selectedDay = pos.fixTime.split(' ')[0];
    const seriesData = positions
      .filter(p => p.fixTime.startsWith(selectedDay))
      .map(p => ({
        time: p.fixTime,
        deltaMinutes: Math.round((new Date(p.fixTime) - new Date(p.obsTime)) / 60000)
      }));
    setTimeSeries(seriesData);
  };

  const polyline = positions.map(p => [p.lat, p.lon]);
  const start = positions[0];
  const end = positions[positions.length - 1];
  const middle = positions.slice(1, -1);

  const chartData = {
    labels: timeSeries.map(p => p.time),
    datasets: [{
      label: 'ΔTime (min)',
      data: timeSeries.map(p => ({ x: p.time, y: p.deltaMinutes })),
      borderColor: 'blue',
      backgroundColor: 'lightblue',
      tension: 0.4,
    }],
  };

  const chartOptions = {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute' },
      },
    },
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
      <div style={{ flex: 1 }}>
        {/* <div style={{ marginBottom: '1rem' }}>
          <label>Select Day: </label>
          <select value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)}>
            {uniqueDays.map((day, index) => (
              <option key={index} value={day}>{day}</option>
            ))}
          </select>
        </div> */}

        <MapContainer center={[8.74, 69.15]} zoom={5} scrollWheelZoom={true} style={{ height: '600px', borderRadius: '1rem' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Polyline positions={polyline} color="red" />

          {start && (
            <Marker position={[start.lat, start.lon]} eventHandlers={{ click: () => handleMarkerClick(start) }} icon={L.icon({
                    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',

                    iconSize: [25,41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                  })}
>
              <Popup>Start Point<br />{start.fixTime}</Popup>
            </Marker>
          )}

          {end && start !== end && (
            <Marker position={[end.lat, end.lon]} eventHandlers={{ click: () => handleMarkerClick(end) }} icon={L.icon({
                    iconUrl:'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    iconSize: [25,41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                  })}
>
              <Popup>End Point<br />{end.fixTime}</Popup>
            </Marker>
          )}

          {middle.map((pos, index) => (
            <CircleMarker
              key={index}
              center={[pos.lat, pos.lon]}
              pathOptions={{ color: 'yellow', dashArray: '3' }}
              radius={6}
              eventHandlers={{ click: () => handleMarkerClick(pos) }}
            />
          ))}
        </MapContainer>
      </div>

      <div style={{ flex: 1 }}>
        {selected ? (
          <div>
            <h2>Selected Point</h2>
            <p><strong>Latitude:</strong> {selected.lat}</p>
            <p><strong>Longitude:</strong> {selected.lon}</p>
            <p><strong>Fix Time:</strong> {selected.fixTime}</p>
            <p><strong>Obs Time:</strong> {selected.obsTime}</p>
            {/* <p><strong>ΔTime:</strong> {Math.round((new Date(selected.fixTime) - new Date(selected.obsTime)) / 60000)} minutes</p> */}

            {/* {timeSeries.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3>Time Series (ΔTime)</h3>
                <Line data={chartData} options={chartOptions} />
              </div>
            )} */}
          </div>
        ) : (
          <p>Select a marker on the map to view details.</p>
        )}
      </div>
    </div>
  );
}
