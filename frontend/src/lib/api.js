import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: (search) => api.get('/users', { params: { search } }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Topics API
export const topicsAPI = {
  getAll: (params) => api.get('/topics', { params }),
  getById: (id) => api.get(`/topics/${id}`),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  delete: (id) => api.delete(`/topics/${id}`),
  subscribe: (id) => api.post(`/topics/${id}/subscribe`),
  unsubscribe: (id) => api.delete(`/topics/${id}/unsubscribe`),
  addMember: (topicId, data) => api.post(`/topics/${topicId}/members`, data),
  removeMember: (topicId, userId) => api.delete(`/topics/${topicId}/members/${userId}`),
};

// Tasks API
export const tasksAPI = {
  getMyTasks: () => api.get('/tasks'),
  getTopicTasks: (topicId) => api.get(`/topics/${topicId}/tasks`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  assignToUsers: (taskId, workerIds) => api.post(`/tasks/${taskId}/assign`, { worker_ids: workerIds }),
};

export default api;
