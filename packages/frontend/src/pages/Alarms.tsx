import { useEffect, useState } from 'react';
import { alarmsApi } from '../api/client';
import './Alarms.css';

export default function Alarms() {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlarms();
    const interval = setInterval(loadAlarms, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAlarms = async () => {
    try {
      const response = await alarmsApi.getAll({ limit: 100 });
      setAlarms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load alarms:', error);
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await alarmsApi.markRead(id);
      loadAlarms();
    } catch (error) {
      console.error('Failed to mark alarm as read:', error);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alarmsApi.resolve(id);
      loadAlarms();
    } catch (error) {
      console.error('Failed to resolve alarm:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#e74c3c';
      case 'warning':
        return '#f39c12';
      default:
        return '#3498db';
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="alarms-page">
      <h1>알람</h1>
      <div className="alarms-list">
        {alarms.map((alarm) => (
          <div
            key={alarm.id}
            className={`alarm-card alarm-${alarm.status}`}
            style={{ borderLeftColor: getSeverityColor(alarm.severity) }}
          >
            <div className="alarm-header">
              <div>
                <span
                  className="alarm-severity"
                  style={{ color: getSeverityColor(alarm.severity) }}
                >
                  {alarm.severity.toUpperCase()}
                </span>
                <span className="alarm-type">{alarm.type}</span>
              </div>
              <span className="alarm-time">
                {new Date(alarm.created_at).toLocaleString()}
              </span>
            </div>
            <div className="alarm-message">{alarm.message}</div>
            {alarm.sensor_name && (
              <div className="alarm-sensor">센서: {alarm.sensor_name}</div>
            )}
            <div className="alarm-actions">
              {alarm.status === 'unread' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleMarkRead(alarm.id)}
                >
                  읽음 표시
                </button>
              )}
              {alarm.status !== 'resolved' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleResolve(alarm.id)}
                >
                  해결
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {alarms.length === 0 && (
        <div className="empty-state">알람이 없습니다</div>
      )}
    </div>
  );
}

