// Mock API Client for Frontend Development
// 백엔드 없이 프론트엔드 개발을 위한 목 API 클라이언트

import {
  mockSensors,
  mockActuators,
  mockRobots,
  mockRules,
  mockAlarms,
  mockDashboardSummary,
  mockDatasets,
  mockAlarmStats,
  mockReports,
  generateMockSensorData,
  generateRealtimeSensorData,
} from '../data/mockData';

// 지연 시뮬레이션 (네트워크 지연)
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API 클라이언트
export const mockApiClient = {
  // Sensors API
  sensors: {
    getAll: async () => {
      await delay();
      return { data: mockSensors };
    },
    getById: async (id: number) => {
      await delay();
      const sensor = mockSensors.find((s) => s.id === id);
      if (!sensor) throw new Error('Sensor not found');
      return { data: sensor };
    },
    getData: async (id: number, start?: string, end?: string) => {
      await delay();
      const sensor = mockSensors.find((s) => s.id === id);
      if (!sensor) throw new Error('Sensor not found');
      const data = generateMockSensorData(id, sensor.type, 24);
      return {
        data: {
          sensor,
          data,
          startTime: start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: end || new Date().toISOString(),
        },
      };
    },
    create: async (data: any) => {
      await delay();
      const newSensor = {
        id: mockSensors.length + 1,
        ...data,
        status: 'active',
        lastUpdate: new Date().toISOString(),
      };
      mockSensors.push(newSensor);
      return { data: newSensor };
    },
    update: async (id: number, data: any) => {
      await delay();
      const index = mockSensors.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Sensor not found');
      mockSensors[index] = { ...mockSensors[index], ...data };
      return { data: mockSensors[index] };
    },
    delete: async (id: number) => {
      await delay();
      const index = mockSensors.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Sensor not found');
      mockSensors.splice(index, 1);
      return { data: {} };
    },
  },

  // Control API
  control: {
    getActuators: async () => {
      await delay();
      return { data: mockActuators };
    },
    getActuator: async (id: number) => {
      await delay();
      const actuator = mockActuators.find((a) => a.id === id);
      if (!actuator) throw new Error('Actuator not found');
      return { data: actuator };
    },
    create: async (data: any) => {
      await delay();
      const newActuator = {
        id: mockActuators.length + 1,
        ...data,
        status: 'off',
        created_at: new Date().toISOString(),
      };
      mockActuators.push(newActuator);
      return { data: newActuator };
    },
    update: async (id: number, data: any) => {
      await delay();
      const index = mockActuators.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Actuator not found');
      mockActuators[index] = { ...mockActuators[index], ...data };
      return { data: mockActuators[index] };
    },
    delete: async (id: number) => {
      await delay();
      const index = mockActuators.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Actuator not found');
      mockActuators.splice(index, 1);
      return { data: {} };
    },
    controlActuator: async (id: number, status: string, value?: number) => {
      await delay();
      const actuator = mockActuators.find((a) => a.id === id);
      if (!actuator) throw new Error('Actuator not found');
      actuator.status = status;
      if (value !== undefined) actuator.value = value;
      return { data: actuator };
    },
  },

  // Robots API
  robots: {
    getAll: async () => {
      await delay();
      return { data: mockRobots };
    },
    getById: async (id: number) => {
      await delay();
      const robot = mockRobots.find((r) => r.id === id);
      if (!robot) throw new Error('Robot not found');
      return { data: robot };
    },
    create: async (data: any) => {
      await delay();
      const newRobot = {
        id: mockRobots.length + 1,
        ...data,
        status: 'idle',
        battery_level: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockRobots.push(newRobot);
      return { data: newRobot };
    },
    update: async (id: number, data: any) => {
      await delay();
      const index = mockRobots.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Robot not found');
      mockRobots[index] = { ...mockRobots[index], ...data, updated_at: new Date().toISOString() };
      return { data: mockRobots[index] };
    },
    delete: async (id: number) => {
      await delay();
      const index = mockRobots.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Robot not found');
      mockRobots.splice(index, 1);
      return { data: {} };
    },
    sendCommand: async (id: number, command: string, _parameters?: any) => {
      await delay();
      const robot = mockRobots.find((r) => r.id === id);
      if (!robot) throw new Error('Robot not found');
      robot.status = 'busy';
      robot.currentTask = command;
      robot.lastUpdate = new Date().toISOString();
      return { data: robot };
    },
    getStatus: async (id: number) => {
      await delay();
      const robot = mockRobots.find((r) => r.id === id);
      if (!robot) throw new Error('Robot not found');
      return { data: robot };
    },
  },

  // Rules API
  rules: {
    getAll: async () => {
      await delay();
      return { data: mockRules };
    },
    getById: async (id: number) => {
      await delay();
      const rule = mockRules.find((r) => r.id === id);
      if (!rule) throw new Error('Rule not found');
      return { data: rule };
    },
    create: async (data: any) => {
      await delay();
      const newRule = {
        id: mockRules.length + 1,
        ...data,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRules.push(newRule);
      return { data: newRule };
    },
    update: async (id: number, data: any) => {
      await delay();
      const index = mockRules.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Rule not found');
      mockRules[index] = { ...mockRules[index], ...data, updatedAt: new Date().toISOString() };
      return { data: mockRules[index] };
    },
    delete: async (id: number) => {
      await delay();
      const index = mockRules.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Rule not found');
      mockRules.splice(index, 1);
      return { data: {} };
    },
    toggle: async (id: number) => {
      await delay();
      const rule = mockRules.find((r) => r.id === id);
      if (!rule) throw new Error('Rule not found');
      rule.enabled = !rule.enabled;
      rule.updatedAt = new Date().toISOString();
      return { data: rule };
    },
  },

  // Alarms API
  alarms: {
    getAll: async (params?: any) => {
      await delay();
      let alarms = [...mockAlarms];
      
      if (params?.status) {
        alarms = alarms.filter((a) => a.status === params.status);
      }
      if (params?.severity) {
        alarms = alarms.filter((a) => a.severity === params.severity);
      }
      
      return { data: alarms };
    },
    getById: async (id: number) => {
      await delay();
      const alarm = mockAlarms.find((a) => a.id === id);
      if (!alarm) throw new Error('Alarm not found');
      return { data: alarm };
    },
    markRead: async (id: number) => {
      await delay();
      const alarm = mockAlarms.find((a) => a.id === id);
      if (!alarm) throw new Error('Alarm not found');
      alarm.status = 'read';
      return { data: alarm };
    },
    resolve: async (id: number) => {
      await delay();
      const alarm = mockAlarms.find((a) => a.id === id);
      if (!alarm) throw new Error('Alarm not found');
      alarm.status = 'resolved';
      alarm.resolvedAt = new Date().toISOString();
      return { data: alarm };
    },
    getStats: async () => {
      await delay();
      return { data: mockAlarmStats };
    },
  },

  // Dashboard API
  dashboard: {
    getSummary: async () => {
      await delay();
      return { data: mockDashboardSummary };
    },
    getRecentSensors: async (limit?: number) => {
      await delay();
      const sensors = mockSensors.slice(0, limit || 5);
      return {
        data: sensors.map((s) => ({
          ...s,
          value: generateRealtimeSensorData(s.type, 1)[0]?.value || 0,
        })),
      };
    },
    getStatus: async () => {
      await delay();
      return {
        data: {
          status: 'online',
          timestamp: new Date().toISOString(),
        },
      };
    },
  },

  // Datasets API
  datasets: {
    getAll: async () => {
      await delay();
      return { data: mockDatasets };
    },
    getById: async (id: number) => {
      await delay();
      const dataset = mockDatasets.find((d) => d.id === id);
      if (!dataset) throw new Error('Dataset not found');
      return { data: dataset };
    },
    download: async (id: number) => {
      await delay(1000);
      const dataset = mockDatasets.find((d) => d.id === id);
      if (!dataset) throw new Error('Dataset not found');
      return {
        data: {
          downloadUrl: `/datasets/${id}/download?token=mock-token-${Date.now()}`,
        },
      };
    },
  },

  // OPEN API
  openapi: {
    apply: async (data: any) => {
      await delay();
      return {
        data: {
          applicationId: `APP-${Date.now()}`,
          status: 'pending',
          ...data,
          createdAt: new Date().toISOString(),
        },
      };
    },
    getStatus: async () => {
      await delay();
      return {
        data: {
          applications: [],
          activeKeys: 0,
        },
      };
    },
    getDocs: async () => {
      await delay();
      return {
        data: {
          version: '1.0.0',
          endpoints: [],
        },
      };
    },
  },

  // Reports API
  reports: {
    getAll: async () => {
      await delay();
      return { data: mockReports };
    },
    generate: async (type: string, period: any) => {
      await delay(2000); // 리포트 생성 시뮬레이션
      const newReport = {
        id: mockReports.length + 1,
        name: `${type} 리포트 - ${new Date().toLocaleDateString()}`,
        type,
        period,
        createdAt: new Date().toISOString(),
        status: 'completed',
        downloadUrl: `/reports/${type}-${Date.now()}.pdf`,
      };
      mockReports.push(newReport);
      return { data: newReport };
    },
  },
};

