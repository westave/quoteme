import axios from 'axios';
import type {
  LoginRequest,
  RegisterForwarderRequest,
  RegisterImporterRequest,
  AuthResponse,
  User,
  Shipment,
  Bid,
} from '../types';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  registerForwarder: (data: RegisterForwarderRequest) =>
    api.post<AuthResponse>('/auth/register/forwarder', data),

  registerImporter: (data: RegisterImporterRequest) =>
    api.post<AuthResponse>('/auth/register/importer', data),

  getMe: () =>
    api.get<{ user: User }>('/auth/me'),
};

// User endpoints
export const users = {
  getPendingForwarders: () =>
    api.get<{ forwarders: User[] }>('/users/forwarders/pending'),

  getAllForwarders: () =>
    api.get<{ forwarders: User[] }>('/users/forwarders'),

  updateForwarderStatus: (id: string, status: string) =>
    api.patch<{ message: string; forwarder: User }>(`/users/forwarders/${id}/status`, { status }),
};

// Shipment endpoints
export const shipments = {
  create: (data: Partial<Shipment>) =>
    api.post<{ message: string; shipment: Shipment }>('/shipments', data),

  getAll: (status?: string) =>
    api.get<{ shipments: Shipment[] }>('/shipments', { params: { status } }),

  getById: (id: string) =>
    api.get<{ shipment: Shipment }>(`/shipments/${id}`),

  update: (id: string, data: Partial<Shipment>) =>
    api.patch<{ message: string; shipment: Shipment }>(`/shipments/${id}`, data),

  close: (id: string) =>
    api.post<{ message: string; shipment: Shipment }>(`/shipments/${id}/close`),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/shipments/${id}`),
};

// Bid endpoints
export const bids = {
  create: (data: Partial<Bid>) =>
    api.post<{ message: string; bid: Bid }>('/bids', data),

  getMyBids: () =>
    api.get<{ bids: Bid[] }>('/bids/my'),

  getById: (id: string) =>
    api.get<{ bid: Bid }>(`/bids/${id}`),

  update: (id: string, data: Partial<Bid>) =>
    api.patch<{ message: string; bid: Bid }>(`/bids/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/bids/${id}`),
};

export default api;
