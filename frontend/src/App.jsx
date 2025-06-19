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

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function parseCustomDate(str) {
  const [datePart, timePart] = str.split(" ");
  const [day, month, year] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

function calculateStats(values) {
  if (!values.length) return null;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  const counts = {};
  let maxFreq = 0;
  let mode = null;
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > maxFreq) {
      maxFreq = counts[v];
      mode = v;
    }
  }

  const n = values.length;
  const stdDev = Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n);
  const skewness = values.reduce((acc, v) => acc + ((v - mean) / stdDev) ** 3, 0) / n;
  const kurtosis = values.reduce((acc, v) => acc + ((v - mean) / stdDev) ** 4, 0) / n - 3;

  return { mean, median, mode,stdDev, skewness, kurtosis };
}

function StatsDisplay({ values }) {
  const stats = calculateStats(values);
  if (!stats) return <p style={{ fontStyle: 'italic' }}>No data</p>;

  return (
    <ul style={{ fontSize: '0.9rem', color: '#555', listStyleType: 'none', paddingLeft: 0 }}>
      <li><strong>Mean:</strong> {stats.mean.toFixed(2)}</li>
      <li><strong>Median:</strong> {stats.median.toFixed(2)}</li>
      <li><strong>Mode:</strong> {stats.mode}</li>
      <li><strong>Standard Deviation:</strong> {stats.stdDev.toFixed(2)}</li>
      <li><strong>Skewness:</strong> {stats.skewness.toFixed(2)}</li>
      <li><strong>Kurtosis:</strong> {stats.kurtosis.toFixed(2)}</li>
    </ul>
  );
}

export default function App() {
  const [positions, setPositions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [series, setSeries] = useState([]);
  const [highlightTime, setHighlightTime] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/positions')
      .then(response => setPositions(response.data))
      .catch(error => console.error('Error fetching positions:', error));
  }, []);

  const handleMarkerClick = (pos) => {
    setSelected(pos);
    setHighlightTime(pos.obsTime);

    axios.get(`http://localhost:5000/api/timeseries`)
      .then(res => {
        const allSeries = res.data;
        const clickedTime = parseCustomDate(pos.obsTime);
        const rangeStart = new Date(clickedTime);
        rangeStart.setDate(rangeStart.getDate() - 3);
        const rangeEnd = new Date(clickedTime);
        rangeEnd.setDate(rangeEnd.getDate() + 3);

        const nearby = allSeries.filter(p => {
          const t = new Date(p.time);
          return t >= rangeStart && t <= rangeEnd;
        });

        setSeries(nearby);
      })
      .catch(err => console.error('Error fetching timeseries:', err));
  };

  const polyline = positions.map(p => [p.lat, p.lon]);
  const start = positions[0];
  const end = positions[positions.length - 1];
  const middle = positions.slice(1, -1);

  const parameterChart = (label, color, key) => {
    return {
      datasets: [
        {
          label,
          data: series.map(p => ({ x: new Date(p.time), y: p[key] })),
          borderColor: color,
          backgroundColor: color,
          pointRadius: 2,
          tension: 0.3,
        },
        {
          label: 'Selected Point',
          data: highlightTime ? [{
            x: parseCustomDate(highlightTime),
            y: series.find(p => new Date(p.time).getTime() === parseCustomDate(highlightTime).getTime())?.[key] || null,
          }] : [],
          pointBackgroundColor: 'red',
          pointBorderColor: 'red',
          pointRadius: 5,
          showLine: false,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'dd-MM-yyyy HH:mm',
          displayFormats: {
            day: 'yyyy-MM-dd',
            hour: 'MMM d, HH:mm',
          }
        },
        title: {
          display: true,
          text: 'Observation Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Value'
        }
      }
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'nearest', intersect: false }
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', background: '#f5f7fa', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Map Section */}
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', padding: '1rem' }}>
          <h3 style={{ color: '#34495e' , textAlign:"center"}}>Ocean Information Insight - A Real Time Motion Tracker</h3>
          <MapContainer center={[8.74, 69.15]} zoom={5} style={{ height: '400px', marginTop: '1rem', borderRadius: '6px', overflow: 'hidden' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Polyline positions={polyline} color="red" />
            {start && (
              <Marker position={[start.lat, start.lon]} icon={L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', iconSize: [25, 41], iconAnchor: [12, 41] })} eventHandlers={{ click: () => handleMarkerClick(start) }}>
                <Popup>Start: {start.fixTime}</Popup>
              </Marker>
            )}
            {end && (
              <Marker position={[end.lat, end.lon]} icon={L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', iconSize: [25, 41], iconAnchor: [12, 41] })} eventHandlers={{ click: () => handleMarkerClick(end) }}>
                <Popup>End: {end.fixTime}</Popup>
              </Marker>
            )}
            {middle.map((pos, i) => (
              <CircleMarker key={i} center={[pos.lat, pos.lon]} pathOptions={{ color: 'yellow' }} radius={5} eventHandlers={{ click: () => handleMarkerClick(pos) }} />
            ))}
          </MapContainer>
        </div>

        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#34495e' }}>Selected Point Info</h3>
              <p><strong>Latitude:</strong> {selected.lat}</p>
              <p><strong>Longitude:</strong> {selected.lon}</p>
              <p><strong>Fix Time:</strong> {selected.fixTime}</p>
              <p><strong>Observation Time:</strong> {selected.obsTime}</p>
            </div>

            {[
              { title: "Barometric Pressure", color: "blue", key: "pressure" },
              { title: "Sea Surface Temperature", color: "green", key: "seaSurfaceTemperature" },
              { title: "Submergence", color: "purple", key: "submergence" }
            ].map((param, idx) => (
              <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                <h4 style={{ color: param.color }}>{param.title} (±3 days)</h4>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: '300px', height: '250px' }}>
                    <Line data={parameterChart(param.title, param.color, param.key)} options={chartOptions} />
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <h5 style={{ marginBottom: '0.5rem', color: '#444' }}>Statistics</h5>
                    <StatsDisplay values={series.map(p => p[param.key]).filter(v => typeof v === 'number' && !isNaN(v))} />
                  </div>
                </div>
              </div>
            ))}

          </div>
        ) : (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ color: '#7f8c8d' }}>Select a marker to view graphs and statistics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
