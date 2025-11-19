import axios from 'axios';
import { mockApiClient } from './mockClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || false;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock 모드 활성화 여부 확인
const shouldUseMock = () => {
  return USE_MOCK || !API_BASE_URL || API_BASE_URL.includes('localhost');
};

// Sensors API
export const sensorsApi = {
  getAll: () =>
    shouldUseMock()
      ? mockApiClient.sensors.getAll()
      : apiClient.get('/sensors'),
  getById: (id: number) =>
    shouldUseMock()
      ? mockApiClient.sensors.getById(id)
      : apiClient.get(`/sensors/${id}`),
  getData: (id: number, start?: string, end?: string) =>
    shouldUseMock()
      ? mockApiClient.sensors.getData(id, start, end)
      : apiClient.get(`/sensors/${id}/data`, { params: { start, end } }),
  create: (data: any) =>
    shouldUseMock()
      ? mockApiClient.sensors.create(data)
      : apiClient.post('/sensors', data),
  update: (id: number, data: any) =>
    shouldUseMock()
      ? mockApiClient.sensors.update(id, data)
      : apiClient.put(`/sensors/${id}`, data),
  delete: (id: number) =>
    shouldUseMock()
      ? mockApiClient.sensors.delete(id)
      : apiClient.delete(`/sensors/${id}`),
};

// Control API
export const controlApi = {
  getActuators: () =>
    shouldUseMock()
      ? mockApiClient.control.getActuators()
      : apiClient.get('/control/actuators'),
  getActuator: (id: number) =>
    shouldUseMock()
      ? mockApiClient.control.getActuator(id)
      : apiClient.get(`/control/actuators/${id}`),
  create: (data: any) =>
    shouldUseMock()
      ? mockApiClient.control.create(data)
      : apiClient.post('/control/actuators', data),
  update: (id: number, data: any) =>
    shouldUseMock()
      ? mockApiClient.control.update(id, data)
      : apiClient.put(`/control/actuators/${id}`, data),
  delete: (id: number) =>
    shouldUseMock()
      ? mockApiClient.control.delete(id)
      : apiClient.delete(`/control/actuators/${id}`),
  controlActuator: (id: number, status: string, value?: number) =>
    shouldUseMock()
      ? mockApiClient.control.controlActuator(id, status, value)
      : apiClient.post(`/control/actuators/${id}/control`, { status, value }),
};

// Robots API
export const robotsApi = {
  getAll: () =>
    shouldUseMock()
      ? mockApiClient.robots.getAll()
      : apiClient.get('/robots'),
  getById: (id: number) =>
    shouldUseMock()
      ? mockApiClient.robots.getById(id)
      : apiClient.get(`/robots/${id}`),
  create: (data: any) =>
    shouldUseMock()
      ? mockApiClient.robots.create(data)
      : apiClient.post('/robots', data),
  update: (id: number, data: any) =>
    shouldUseMock()
      ? mockApiClient.robots.update(id, data)
      : apiClient.put(`/robots/${id}`, data),
  delete: (id: number) =>
    shouldUseMock()
      ? mockApiClient.robots.delete(id)
      : apiClient.delete(`/robots/${id}`),
  sendCommand: (id: number, command: string, parameters?: any) =>
    shouldUseMock()
      ? mockApiClient.robots.sendCommand(id, command, parameters)
      : apiClient.post(`/robots/${id}/command`, { command, parameters }),
  getStatus: (id: number) =>
    shouldUseMock()
      ? mockApiClient.robots.getStatus(id)
      : apiClient.get(`/robots/${id}/status`),
};

// Rules API
export const rulesApi = {
  getAll: () =>
    shouldUseMock()
      ? mockApiClient.rules.getAll()
      : apiClient.get('/rules'),
  getById: (id: number) =>
    shouldUseMock()
      ? mockApiClient.rules.getById(id)
      : apiClient.get(`/rules/${id}`),
  create: (data: any) =>
    shouldUseMock()
      ? mockApiClient.rules.create(data)
      : apiClient.post('/rules', data),
  update: (id: number, data: any) =>
    shouldUseMock()
      ? mockApiClient.rules.update(id, data)
      : apiClient.put(`/rules/${id}`, data),
  delete: (id: number) =>
    shouldUseMock()
      ? mockApiClient.rules.delete(id)
      : apiClient.delete(`/rules/${id}`),
  toggle: (id: number) =>
    shouldUseMock()
      ? mockApiClient.rules.toggle(id)
      : apiClient.post(`/rules/${id}/toggle`),
};

// Alarms API
export const alarmsApi = {
  getAll: (params?: any) =>
    shouldUseMock()
      ? mockApiClient.alarms.getAll(params)
      : apiClient.get('/alarms', { params }),
  getById: (id: number) =>
    shouldUseMock()
      ? mockApiClient.alarms.getById(id)
      : apiClient.get(`/alarms/${id}`),
  markRead: (id: number) =>
    shouldUseMock()
      ? mockApiClient.alarms.markRead(id)
      : apiClient.post(`/alarms/${id}/read`),
  resolve: (id: number) =>
    shouldUseMock()
      ? mockApiClient.alarms.resolve(id)
      : apiClient.post(`/alarms/${id}/resolve`),
  getStats: () =>
    shouldUseMock()
      ? mockApiClient.alarms.getStats()
      : apiClient.get('/alarms/stats/summary'),
};

// Dashboard API
export const dashboardApi = {
  getSummary: () =>
    shouldUseMock()
      ? mockApiClient.dashboard.getSummary()
      : apiClient.get('/dashboard/summary'),
  getRecentSensors: (limit?: number) =>
    shouldUseMock()
      ? mockApiClient.dashboard.getRecentSensors(limit)
      : apiClient.get('/dashboard/sensors/recent', { params: { limit } }),
  getStatus: () =>
    shouldUseMock()
      ? mockApiClient.dashboard.getStatus()
      : apiClient.get('/dashboard/status'),
};

// Datasets API
export const datasetsApi = {
  getAll: () =>
    shouldUseMock()
      ? mockApiClient.datasets.getAll()
      : apiClient.get('/datasets'),
  getById: (id: number) =>
    shouldUseMock()
      ? mockApiClient.datasets.getById(id)
      : apiClient.get(`/datasets/${id}`),
  download: (id: number) =>
    shouldUseMock()
      ? mockApiClient.datasets.download(id)
      : apiClient.get(`/datasets/${id}/download`),
};

// OPEN API
export const openapiApi = {
  apply: (data: any) =>
    shouldUseMock()
      ? mockApiClient.openapi.apply(data)
      : apiClient.post('/openapi/apply', data),
  getStatus: () =>
    shouldUseMock()
      ? mockApiClient.openapi.getStatus()
      : apiClient.get('/openapi/status'),
  getDocs: () =>
    shouldUseMock()
      ? mockApiClient.openapi.getDocs()
      : apiClient.get('/openapi/docs'),
};

// Reports API
export const reportsApi = {
  getAll: () =>
    shouldUseMock()
      ? mockApiClient.reports.getAll()
      : apiClient.get('/reports'),
  generate: (type: string, period: any) =>
    shouldUseMock()
      ? mockApiClient.reports.generate(type, period)
      : apiClient.post('/reports/generate', { type, period }),
};

