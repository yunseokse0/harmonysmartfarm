// Mock Data for Frontend Development
// 스마트팜코리아 표준 기반 목 데이터

// 센서 데이터
export const mockSensors = [
  {
    id: 1,
    name: '온도 센서 1',
    type: 'temperature',
    location: '온실 A구역',
    unit: '℃',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 2,
    name: '습도 센서 1',
    type: 'humidity',
    location: '온실 A구역',
    unit: '%',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'CO₂ 센서 1',
    type: 'co2',
    location: '온실 A구역',
    unit: 'ppm',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'PAR 센서 1',
    type: 'par',
    location: '온실 A구역',
    unit: 'μmol/m²/s',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 5,
    name: '일사량 센서 1',
    type: 'solar_radiation',
    location: '온실 외부',
    unit: 'W/m²',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 6,
    name: '토양 수분 센서 1',
    type: 'soil_moisture',
    location: '온실 A구역 - 구역1',
    unit: '%',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 7,
    name: '토양 EC 센서 1',
    type: 'soil_ec',
    location: '온실 A구역 - 구역1',
    unit: 'dS/m',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 8,
    name: '토양 pH 센서 1',
    type: 'soil_ph',
    location: '온실 A구역 - 구역1',
    unit: 'pH',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 9,
    name: '풍속 센서 1',
    type: 'wind_speed',
    location: '온실 외부',
    unit: 'm/s',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 10,
    name: '풍향 센서 1',
    type: 'wind_direction',
    location: '온실 외부',
    unit: '°',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 11,
    name: '엽면 습도 센서 1',
    type: 'leaf_wetness',
    location: '온실 A구역',
    unit: '%',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 12,
    name: '감우 센서 1',
    type: 'rain',
    location: '온실 외부',
    unit: 'mm',
    status: 'active',
    lastUpdate: new Date().toISOString(),
  },
];

// 액추에이터 데이터
export const mockActuators = [
  {
    id: 1,
    name: '환기팬 1',
    type: 'fan',
    location: '온실 A구역',
    status: 'off',
    value: 0,
    maxValue: 100,
    unit: '%',
  },
  {
    id: 2,
    name: '난방기 1',
    type: 'heater',
    location: '온실 A구역',
    status: 'off',
    value: 0,
    maxValue: 100,
    unit: '%',
  },
  {
    id: 3,
    name: '관수 밸브 1',
    type: 'irrigation',
    location: '온실 A구역 - 구역1',
    status: 'off',
    value: 0,
    maxValue: 100,
    unit: '%',
  },
  {
    id: 4,
    name: '양액기 1',
    type: 'nutrient',
    location: '온실 A구역 - 구역1',
    status: 'off',
    value: 0,
    maxValue: 100,
    unit: '%',
  },
  {
    id: 5,
    name: '스크린 1',
    type: 'screen',
    location: '온실 A구역',
    status: 'closed',
    value: 0,
    maxValue: 100,
    unit: '%',
  },
  {
    id: 6,
    name: 'CO₂ 공급기 1',
    type: 'co2_supply',
    location: '온실 A구역',
    status: 'off',
    value: 0,
    maxValue: 100,
    unit: '%',
  },
  {
    id: 7,
    name: '인공광 1',
    type: 'led',
    location: '온실 A구역',
    status: 'off',
    value: 0,
    maxValue: 100,
    unit: '%',
  },
];

// 로봇 데이터
export const mockRobots = [
  {
    id: 1,
    name: '수확 로봇 1',
    type: 'harvest',
    location: '온실 A구역',
    status: 'idle',
    battery: 85,
    currentTask: null,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 2,
    name: '관수 로봇 1',
    type: 'irrigation',
    location: '온실 A구역',
    status: 'idle',
    battery: 92,
    currentTask: null,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 3,
    name: '모니터링 로봇 1',
    type: 'monitoring',
    location: '온실 A구역',
    status: 'patrolling',
    battery: 78,
    currentTask: '구역 순찰 중',
    lastUpdate: new Date().toISOString(),
  },
];

// 룰 데이터
export const mockRules = [
  {
    id: 1,
    name: '고온 환기 룰',
    description: '온도가 30℃ 이상일 때 환기팬 자동 가동',
    enabled: true,
    priority: 1,
    condition: {
      type: 'sensor',
      sensorId: 1,
      sensorType: 'temperature',
      operator: '>=',
      threshold: 30,
    },
    action: {
      type: 'actuator',
      actuatorId: 1,
      status: 'on',
      value: 80,
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: '저습도 가습 룰',
    description: '습도가 40% 이하일 때 가습기 자동 가동',
    enabled: true,
    priority: 2,
    condition: {
      type: 'sensor',
      sensorId: 2,
      sensorType: 'humidity',
      operator: '<=',
      threshold: 40,
    },
    action: {
      type: 'actuator',
      actuatorId: 4,
      status: 'on',
      value: 60,
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: '토양 수분 관수 룰',
    description: '토양 수분이 30% 이하일 때 관수 밸브 자동 가동',
    enabled: true,
    priority: 3,
    condition: {
      type: 'sensor',
      sensorId: 6,
      sensorType: 'soil_moisture',
      operator: '<=',
      threshold: 30,
    },
    action: {
      type: 'actuator',
      actuatorId: 3,
      status: 'on',
      value: 100,
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'CO₂ 부족 공급 룰',
    description: 'CO₂ 농도가 350ppm 이하일 때 CO₂ 공급기 자동 가동',
    enabled: false,
    priority: 4,
    condition: {
      type: 'sensor',
      sensorId: 3,
      sensorType: 'co2',
      operator: '<=',
      threshold: 350,
    },
    action: {
      type: 'actuator',
      actuatorId: 6,
      status: 'on',
      value: 50,
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 알람 데이터
export const mockAlarms = [
  {
    id: 1,
    type: 'temperature',
    severity: 'warning',
    message: '온도가 32℃로 상승했습니다. (임계값: 30℃)',
    sensorId: 1,
    status: 'unread',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
  },
  {
    id: 2,
    type: 'humidity',
    severity: 'info',
    message: '습도가 35%로 낮아졌습니다. (권장 범위: 40-80%)',
    sensorId: 2,
    status: 'read',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
  },
  {
    id: 3,
    type: 'soil_moisture',
    severity: 'critical',
    message: '토양 수분이 20%로 급격히 감소했습니다. (임계값: 30%)',
    sensorId: 6,
    status: 'unread',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
  },
  {
    id: 4,
    type: 'sensor',
    severity: 'warning',
    message: 'PAR 센서 1의 연결이 불안정합니다.',
    sensorId: 4,
    status: 'read',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
];

// 대시보드 요약 데이터
export const mockDashboardSummary = {
  sensors: {
    total: mockSensors.length,
    recent: mockSensors.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      unit: s.unit,
      value: getMockSensorValue(s.type),
    })),
  },
  actuators: {
    total: mockActuators.length,
  },
  robots: {
    total: mockRobots.length,
  },
  rules: {
    active: mockRules.filter((r) => r.enabled).length,
  },
  alarms: {
    unread: mockAlarms.filter((a) => a.status === 'unread').length,
  },
  timestamp: new Date().toISOString(),
};

// 데이터셋 데이터
export const mockDatasets = [
  {
    id: 1,
    name: '시설원예 데이터셋',
    description: '온실 환경 데이터 및 작물 생육 데이터',
    size: '2.5 GB',
    format: 'CSV',
    records: 125000,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    name: 'AI 경진대회용 이미지셋',
    description: '작물 질병 진단용 이미지 데이터셋',
    size: '15.8 GB',
    format: 'Images',
    records: 50000,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    name: '기상융복합 서비스 데이터(로컬)',
    description: '지역별 기상 데이터 및 농업 기상 정보',
    size: '8.2 GB',
    format: 'JSON',
    records: 250000,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// 센서 타입별 기본값
function getMockSensorValue(type: string): number {
  const baseValues: { [key: string]: number } = {
    temperature: 25.5,
    humidity: 65.0,
    co2: 420,
    par: 550,
    solar_radiation: 850,
    soil_moisture: 45.0,
    soil_ec: 1.8,
    soil_ph: 6.5,
    wind_speed: 2.8,
    wind_direction: 180,
    leaf_wetness: 15.0,
    rain: 0,
  };
  return baseValues[type] || 0;
}

// 센서 시계열 데이터 생성 함수
export function generateMockSensorData(
  _sensorId: number,
  sensorType: string,
  hours: number = 24
): Array<{ time: string; value: number }> {
  const data: Array<{ time: string; value: number }> = [];
  const baseValue = getMockSensorValue(sensorType);
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    // 자연스러운 변동을 위한 시뮬레이션
    const variation = (Math.sin(i * 0.1) + Math.random() * 0.5 - 0.25) * 3;
    const value = Math.max(0, baseValue + variation);
    
    data.push({
      time: time.toISOString(),
      value: Math.round(value * 10) / 10,
    });
  }
  
  return data;
}

// 실시간 센서 데이터 생성 (최근 50개 포인트)
export function generateRealtimeSensorData(
  sensorType: string,
  count: number = 50
): Array<{ time: string; value: number }> {
  const data: Array<{ time: string; value: number }> = [];
  const baseValue = getMockSensorValue(sensorType);
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 1000); // 30초 간격
    const variation = (Math.sin(i * 0.2) + Math.random() * 0.3 - 0.15) * 2;
    const value = Math.max(0, baseValue + variation);
    
    data.push({
      time: time.toISOString(),
      value: Math.round(value * 10) / 10,
    });
  }
  
  return data;
}

// 알람 통계 데이터
export const mockAlarmStats = {
  total: mockAlarms.length,
  unread: mockAlarms.filter((a) => a.status === 'unread').length,
  bySeverity: {
    critical: mockAlarms.filter((a) => a.severity === 'critical').length,
    warning: mockAlarms.filter((a) => a.severity === 'warning').length,
    info: mockAlarms.filter((a) => a.severity === 'info').length,
  },
  byType: {
    temperature: mockAlarms.filter((a) => a.type === 'temperature').length,
    humidity: mockAlarms.filter((a) => a.type === 'humidity').length,
    soil_moisture: mockAlarms.filter((a) => a.type === 'soil_moisture').length,
    sensor: mockAlarms.filter((a) => a.type === 'sensor').length,
  },
};

// 리포트 데이터
export const mockReports = [
  {
    id: 1,
    name: '일일 리포트 - 2024-11-19',
    type: 'daily',
    period: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    status: 'completed',
    downloadUrl: '/reports/daily-2024-11-19.pdf',
  },
  {
    id: 2,
    name: '주간 리포트 - 2024-11-12 ~ 2024-11-18',
    type: 'weekly',
    period: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    downloadUrl: '/reports/weekly-2024-11-18.pdf',
  },
  {
    id: 3,
    name: '월간 리포트 - 2024-10',
    type: 'monthly',
    period: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    downloadUrl: '/reports/monthly-2024-10.pdf',
  },
];

