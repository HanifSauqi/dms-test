import { api } from './client';

export const labelApi = {
  // Create label
  create: (data) => {
    return api.post('/labels', data);
  },

  // Get all labels
  getAll: (options = {}) => {
    const params = new URLSearchParams();

    if (options.search) {
      params.append('search', options.search);
    }
    if (options.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    if (options.sortOrder) {
      params.append('sortOrder', options.sortOrder);
    }

    const query = params.toString();
    return api.get(`/labels${query ? `?${query}` : ''}`);
  },

  // Get label by ID
  getById: (id) => {
    return api.get(`/labels/${id}`);
  },

  // Update label
  update: (id, data) => {
    return api.put(`/labels/${id}`, data);
  },

  // Delete label
  delete: (id) => {
    return api.delete(`/labels/${id}`);
  },

  // Assign label to document
  assignToDocument: (data) => {
    return api.post('/labels/assign', data);
  },

  // Remove label from document
  removeFromDocument: (documentId, labelId) => {
    return api.delete(`/labels/remove/${documentId}/${labelId}`);
  },
};

export default labelApi;