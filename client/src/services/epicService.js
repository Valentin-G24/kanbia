import api from './api';

export const epicService = {
  getByProject: (projectId) => api.get(`/epics/project/${projectId}`),
  getById: (id) => api.get(`/epics/${id}`),
  create: (projectId, data) => api.post(`/epics/project/${projectId}`, data),
  update: (id, data) => api.put(`/epics/${id}`, data),
  remove: (id) => api.delete(`/epics/${id}`),
};
