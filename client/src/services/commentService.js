import api from './api';

export const commentService = {
  getByEntity: (entityId) => api.get(`/comments/entity/${entityId}`),
  create: (data) => api.post('/comments', data),
  remove: (id) => api.delete(`/comments/${id}`),
};
