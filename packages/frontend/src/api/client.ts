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

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  test: (id: number, sensorData: any) =>
    apiClient.post(`/rules/${id}/test`, { sensorData }),
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

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),
  register: (username: string, email: string, password: string, role?: string) =>
    apiClient.post('/auth/register', { username, email, password, role }),
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/token/refresh', { refreshToken }),
  getMe: () =>
    apiClient.get('/auth/me'),
};

// OpenAPI API
export const openapiApi = {
  apply: (data: any) =>
    shouldUseMock()
      ? mockApiClient.openapi.apply(data)
      : apiClient.post('/openapi/apply', data),
  getStatus: () =>
    shouldUseMock()
      ? mockApiClient.openapi.getStatus()
      : apiClient.get('/openapi/status'),
  getKeys: () =>
    apiClient.get('/openapi/keys'),
  createKey: (name: string, scopes: string[] = []) =>
    apiClient.post('/openapi/keys', { name, scopes }),
  deactivateKey: (id: number) =>
    apiClient.post(`/openapi/keys/${id}/deactivate`),
  deleteKey: (id: number) =>
    apiClient.delete(`/openapi/keys/${id}`),
  getDocs: () =>
    shouldUseMock()
      ? mockApiClient.openapi.getDocs()
      : apiClient.get('/openapi/docs'),
};

// Datasets API
export const datasetsApi = {
  getAll: (params?: any) =>
    apiClient.get('/datasets', { params }),
  getById: (id: number) =>
    apiClient.get(`/datasets/${id}`),
  download: (id: number) =>
    apiClient.get(`/datasets/${id}/download`),
  create: (data: any) =>
    apiClient.post('/datasets', data),
};

// AI Jobs API
export const aiJobsApi = {
  getAll: (params?: any) =>
    apiClient.get('/ai/jobs', { params }),
  getById: (id: number) =>
    apiClient.get(`/ai/jobs/${id}`),
  create: (type: string, datasetId: number, parameters?: any) =>
    apiClient.post('/ai/jobs', { type, dataset_id: datasetId, parameters }),
  getStatus: (id: number) =>
    apiClient.get(`/ai/jobs/${id}/status`),
  getLogs: (id: number) =>
    apiClient.get(`/ai/jobs/${id}/logs`),
};

// AI Models API
export const aiModelsApi = {
  getAll: () =>
    apiClient.get('/ai/models'),
  getById: (id: number) =>
    apiClient.get(`/ai/models/${id}`),
};

// Images API
export const imagesApi = {
  upload: (file: File, metadata?: any) => {
    const formData = new FormData();
    formData.append('image', file);
    if (metadata) {
      Object.keys(metadata).forEach((key) => {
        formData.append(key, metadata[key]);
      });
    }
    return apiClient.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (params?: any) =>
    apiClient.get('/images', { params }),
  getById: (id: number) =>
    apiClient.get(`/images/${id}`),
  getFile: (id: number) =>
    `${apiClient.defaults.baseURL?.replace('/api', '')}/images/${id}/file`,
  getLabels: (id: number) =>
    apiClient.get(`/images/${id}/labels`),
  createLabel: (id: number, label: string, bbox?: any, confidence?: number) =>
    apiClient.post(`/images/${id}/labels`, { label, bbox, confidence }),
  updateLabel: (labelId: number, data: any) =>
    apiClient.put(`/images/labels/${labelId}`, data),
  deleteLabel: (labelId: number) =>
    apiClient.delete(`/images/labels/${labelId}`),
  delete: (id: number) =>
    apiClient.delete(`/images/${id}`),
};

