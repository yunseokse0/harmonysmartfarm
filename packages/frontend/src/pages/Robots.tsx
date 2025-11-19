import { useEffect, useState } from 'react';
import { robotsApi } from '../api/client';
import './Robots.css';

export default function Robots() {
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRobots();
  }, []);

  const loadRobots = async () => {
    try {
      const response = await robotsApi.getAll();
      setRobots(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load robots:', error);
      setLoading(false);
    }
  };

  const handleCommand = async (id: number, command: string) => {
    try {
      await robotsApi.sendCommand(id, command);
      loadRobots();
    } catch (error) {
      console.error('Failed to send command:', error);
      alert('명령 전송에 실패했습니다');
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="robots-page">
      <h1>로봇</h1>
      <div className="robots-grid">
        {robots.map((robot) => (
          <div key={robot.id} className="robot-card">
            <h3>{robot.name}</h3>
            <p className="robot-type">유형: {robot.type}</p>
            <p className="robot-status">상태: {robot.status === 'working' ? '작동 중' : robot.status === 'idle' ? '대기 중' : robot.status}</p>
            <p className="robot-battery">배터리: {robot.battery_level || 100}%</p>
            <div className="robot-controls">
              <button
                className="btn btn-primary"
                onClick={() => handleCommand(robot.id, 'start')}
                disabled={robot.status === 'working'}
              >
                시작
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleCommand(robot.id, 'stop')}
                disabled={robot.status === 'idle'}
              >
                중지
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

