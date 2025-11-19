import { useEffect, useState } from 'react';
import { sensorsApi } from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import SensorChart from '../components/SensorChart';
import './Monitoring.css';

export default function Monitoring() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [sensorData, setSensorData] = useState<Map<number, any[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    loadSensors();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'sensor_update') {
        const { sensorId, data } = lastMessage;
        const sensorIdNum = parseInt(sensorId);
        
        setSensorData((prev) => {
          const newData = new Map(prev);
          const existing = newData.get(sensorIdNum) || [];
          const updated = [
            ...existing,
            {
              time: data.timestamp,
              value: data.value,
            },
          ].slice(-50); // Keep last 50 data points
          newData.set(sensorIdNum, updated);
          return newData;
        });
      }
    }
  }, [lastMessage]);

  const loadSensors = async () => {
    try {
      const response = await sensorsApi.getAll();
      setSensors(response.data);
      
      // Load initial data for each sensor
      for (const sensor of response.data) {
        try {
          const dataResponse = await sensorsApi.getData(sensor.id);
          if (dataResponse.data.data && Array.isArray(dataResponse.data.data)) {
            setSensorData((prev) => {
              const newData = new Map(prev);
              newData.set(sensor.id, dataResponse.data.data.map((d: any) => ({
                time: d._time || d.time,
                value: d._value || d.value,
              })));
              return newData;
            });
          }
        } catch (error) {
          // Ignore errors for individual sensor data
          console.warn(`Failed to load data for sensor ${sensor.id}:`, error);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load sensors:', error);
      setLoading(false);
    }
  };

  const getSensorColor = (type: string) => {
    const colors: { [key: string]: string } = {
      temperature: '#e74c3c',
      humidity: '#3498db',
      co2: '#2ecc71',
      light: '#f39c12',
      soil_moisture: '#9b59b6',
      soil_ec: '#1abc9c',
    };
    return colors[type] || '#3498db';
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="monitoring-page">
      <div className="monitoring-header">
        <h1>모니터링</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? '연결됨' : '연결 끊김'}</span>
        </div>
      </div>

      <div className="sensor-selector">
        <button
          className={`filter-btn ${selectedSensor === null ? 'active' : ''}`}
          onClick={() => setSelectedSensor(null)}
        >
          모든 센서
        </button>
        {sensors.map((sensor) => (
          <button
            key={sensor.id}
            className={`filter-btn ${selectedSensor === sensor.id ? 'active' : ''}`}
            onClick={() => setSelectedSensor(sensor.id)}
          >
            {sensor.name}
          </button>
        ))}
      </div>

      <div className="monitoring-grid">
        {sensors
          .filter((sensor) => selectedSensor === null || sensor.id === selectedSensor)
          .map((sensor) => {
            const data = sensorData.get(sensor.id) || [];
            const latestValue = data.length > 0 ? data[data.length - 1].value : null;

            return (
              <div key={sensor.id} className="monitoring-card">
                <div className="monitoring-card-header">
                  <h3>{sensor.name}</h3>
                  {latestValue !== null && (
                    <div className="latest-value">
                      {latestValue.toFixed(1)} {sensor.unit || ''}
                    </div>
                  )}
                </div>
                <p className="sensor-type">{sensor.type}</p>
                {data.length > 0 ? (
                  <SensorChart
                    data={data}
                    name={sensor.name}
                    unit={sensor.unit || ''}
                    color={getSensorColor(sensor.type)}
                  />
                ) : (
                  <div className="no-data">
                    <p>데이터가 없습니다</p>
                    <p className="no-data-note">센서 데이터를 기다리는 중...</p>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
