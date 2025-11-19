import { useEffect, useState } from 'react';
import { dashboardApi, datasetsApi, openapiApi, sensorsApi } from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import Metric from '../components/Metric';
import SensorChart from '../components/SensorChart';
import SimpleIcon from '../components/SimpleIcon';
import './Dashboard.css';

interface DashboardSummary {
  sensors: { total: number; recent: any[] };
  actuators: { total: number };
  robots: { total: number };
  rules: { active: number };
  alarms: { unread: number };
  timestamp: string;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [apiFormData, setApiFormData] = useState({
    organization: '',
    email: '',
    phone: '',
    purpose: '',
    description: '',
    expected_usage: '',
    data_types: [] as string[],
    agreement: false,
  });
  const [sensorData, setSensorData] = useState<Map<number, any[]>>(new Map());
  const [mainSensors, setMainSensors] = useState<any[]>([]);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    loadSummary();
    loadDatasets();
    loadMainSensors();
    const interval = setInterval(loadSummary, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMainSensors = async () => {
    try {
      const response = await sensorsApi.getAll();
      const sensors = response.data;
      // 주요 센서만 선택 (온도, 습도, 토양수분, CO2 등)
      const mainTypes = ['temperature', 'humidity', 'soil_moisture', 'co2', 'soil_ec'];
      const filtered = sensors.filter((s: any) => mainTypes.includes(s.type)).slice(0, 4);
      setMainSensors(filtered);
      
      // 초기 데이터 로드
      for (const sensor of filtered) {
        try {
          const dataResponse = await sensorsApi.getData(
            sensor.id,
            new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 최근 1시간
            new Date().toISOString()
          );
          const data = dataResponse.data.data || [];
          setSensorData((prev) => {
            const newData = new Map(prev);
            newData.set(sensor.id, data.map((d: any) => ({
              time: d.time,
              value: d.value,
            })));
            return newData;
          });
        } catch (error) {
          console.error(`Failed to load data for sensor ${sensor.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load main sensors:', error);
    }
  };

  const loadDatasets = async () => {
    try {
      const response = await datasetsApi.getAll();
      setDatasets(response.data);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const handleApiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await openapiApi.apply(apiFormData);
      alert(`API 신청이 제출되었습니다. 신청 ID: ${response.data.applicationId}`);
      setApiFormData({
        organization: '',
        email: '',
        purpose: '',
        description: '',
      });
    } catch (error) {
      console.error('Failed to submit API application:', error);
      alert('API 신청 제출에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (lastMessage) {
      // Refresh summary on important updates
      if (['sensor_update', 'alarm', 'actuator_update', 'robot_update'].includes(lastMessage.type)) {
        loadSummary();
      }
      
      // Update sensor data in real-time
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

  const loadSummary = async () => {
    try {
      const response = await dashboardApi.getSummary();
      setSummary(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">로딩 중...</div>;
  }

  if (!summary) {
    return <div className="dashboard-error">대시보드 로드에 실패했습니다</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">대시보드</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? '실시간 연결됨' : '연결 끊김'}</span>
        </div>
      </div>

      <div className="dashboard-metrics">
        <Metric
          label="센서"
          value={summary.sensors.total}
          icon={<SimpleIcon name="sensors" size={28} />}
        />
        <Metric
          label="액추에이터"
          value={summary.actuators.total}
          icon={<SimpleIcon name="actuator" size={28} />}
        />
        <Metric
          label="로봇"
          value={summary.robots.total}
          icon={<SimpleIcon name="robot" size={28} />}
        />
        <Metric
          label="활성 규칙"
          value={summary.rules.active}
          icon={<SimpleIcon name="rule" size={28} />}
        />
        <Metric
          label="미확인 알람"
          value={summary.alarms.unread}
          icon={<SimpleIcon name="alarm" size={28} />}
          status={summary.alarms.unread > 0 ? 'warning' : 'normal'}
        />
      </div>

      <div className="dashboard-section">
        <h2>최근 센서</h2>
        <div className="sensor-list">
          {summary.sensors.recent.length > 0 ? (
            summary.sensors.recent.map((sensor: any) => (
              <div key={sensor.id} className="sensor-item">
                <span className="sensor-name">{sensor.name}</span>
                <span className="sensor-type">{sensor.type}</span>
                <span className="sensor-unit">{sensor.unit || ''}</span>
              </div>
            ))
          ) : (
            <p>센서가 없습니다</p>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>실시간 센서 데이터</h2>
        <div className="dashboard-charts">
          {mainSensors.length > 0 ? (
            mainSensors.map((sensor) => {
              const data = sensorData.get(sensor.id) || [];
              return (
                <div key={sensor.id} className="dashboard-chart-card">
                  <SensorChart
                    data={data}
                    name={sensor.name}
                    unit={sensor.unit || ''}
                    color={getSensorColor(sensor.type)}
                  />
                </div>
              );
            })
          ) : (
            <div className="dashboard-chart-placeholder">
              <p>센서 데이터를 불러오는 중...</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>데이터 마트 · OPEN API</h2>
        <div className="datamart-grid">
          <div className="datamart-card">
            <h3>사용 가능한 데이터셋</h3>
            {datasets.length > 0 ? (
              <ul className="dataset-list">
                {datasets.map((dataset) => (
                  <li key={dataset.id}>
                    {dataset.name} ({dataset.size})
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="dataset-list">
                <li>시설원예 데이터셋</li>
                <li>AI 경진대회용 이미지셋</li>
                <li>기상융복합 서비스 데이터(로컬)</li>
              </ul>
            )}
            <div className="datamart-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  // Navigate to datasets page or open modal
                  alert('데이터 카탈로그 페이지로 이동 (구현 예정)');
                }}
              >
                데이터 카탈로그로 이동
              </button>
              <button
                className="btn-secondary"
                onClick={async () => {
                  try {
                    if (datasets.length > 0) {
                      const response = await datasetsApi.download(datasets[0].id);
                      alert(`다운로드 시작: ${response.data.downloadUrl}`);
                    } else {
                      alert('데이터셋 다운로드 (시뮬레이션)');
                    }
                  } catch (error) {
                    alert('데이터셋 다운로드 (시뮬레이션)');
                  }
                }}
              >
                다운로드 (시뮬레이션)
              </button>
            </div>
          </div>

          <div className="datamart-card">
            <h3>OPEN API 신청</h3>
            <p className="datamart-description">
              API Key 신청·사용목적·기관 정보를 입력해 신청서를 제출할 수 있습니다.
            </p>
            <form className="api-form" onSubmit={handleApiSubmit}>
              <div className="form-group">
                <label>기관명 *</label>
                <input
                  type="text"
                  placeholder="기관명을 입력하세요"
                  className="form-input"
                  value={apiFormData.organization}
                  onChange={(e) =>
                    setApiFormData({ ...apiFormData, organization: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>담당자 이메일 *</label>
                <input
                  type="email"
                  placeholder="example@domain.com"
                  className="form-input"
                  value={apiFormData.email}
                  onChange={(e) =>
                    setApiFormData({ ...apiFormData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>연락처</label>
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  className="form-input"
                  value={apiFormData.phone}
                  onChange={(e) =>
                    setApiFormData({ ...apiFormData, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>데이터 활용 목적 *</label>
                <select
                  className="form-input"
                  value={apiFormData.purpose}
                  onChange={(e) =>
                    setApiFormData({ ...apiFormData, purpose: e.target.value })
                  }
                  required
                >
                  <option value="">목적 선택</option>
                  <option value="research">연구(논문/분석)</option>
                  <option value="product">제품개발</option>
                  <option value="education">교육</option>
                  <option value="commercial">상업적 활용</option>
                  <option value="government">정부기관</option>
                </select>
              </div>
              <div className="form-group">
                <label>활용 계획 *</label>
                <textarea
                  className="form-input"
                  placeholder="데이터를 어떻게 활용할 계획인지 상세히 설명해주세요"
                  value={apiFormData.description}
                  onChange={(e) =>
                    setApiFormData({ ...apiFormData, description: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>
              <div className="form-group">
                <label>예상 사용량</label>
                <input
                  type="text"
                  placeholder="예: 일일 1,000건, 월간 30,000건"
                  className="form-input"
                  value={apiFormData.expected_usage}
                  onChange={(e) =>
                    setApiFormData({ ...apiFormData, expected_usage: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>필요한 데이터 유형 (복수 선택 가능)</label>
                <div className="checkbox-group">
                  {['센서 데이터', '알람 데이터', '제어 이력', '리포트 데이터', '이미지 데이터'].map((type) => (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={apiFormData.data_types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setApiFormData({
                              ...apiFormData,
                              data_types: [...apiFormData.data_types, type],
                            });
                          } else {
                            setApiFormData({
                              ...apiFormData,
                              data_types: apiFormData.data_types.filter((t) => t !== type),
                            });
                          }
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={apiFormData.agreement}
                    onChange={(e) =>
                      setApiFormData({ ...apiFormData, agreement: e.target.checked })
                    }
                    required
                  />
                  <span>개인정보 수집 및 이용에 동의합니다 *</span>
                </label>
              </div>
              <button type="submit" className="btn-primary" disabled={!apiFormData.agreement}>
                신청 제출
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSensorColor(type: string): string {
  const colors: { [key: string]: string } = {
    temperature: '#e74c3c',
    humidity: '#3498db',
    co2: '#9b59b6',
    soil_moisture: '#16a085',
    soil_ec: '#f39c12',
    light: '#f1c40f',
    par: '#2ecc71',
    solar_radiation: '#e67e22',
  };
  return colors[type] || '#3498db';
}
