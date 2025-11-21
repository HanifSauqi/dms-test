import { api } from './client';

export const documentApi = {
  // Upload documents
  upload: (formData) => {
    return api.upload('/documents/upload', formData);
  },

  // Get all documents with filters
  getAll: (options = {}) => {
    const params = new URLSearchParams();

    if (options.folderId !== undefined) {
      params.append('folderId', options.folderId);
    }
    if (options.search) {
      params.append('search', options.search);
    }
    if (options.labels) {
      const labelArray = Array.isArray(options.labels) ? options.labels : [options.labels];
      labelArray.forEach(label => params.append('labels', label));
    }
    if (options.page) {
      params.append('page', options.page);
    }
    if (options.limit) {
      params.append('limit', options.limit);
    }

    const query = params.toString();
    return api.get(`/documents${query ? `?${query}` : ''}`);
  },

  // Get document by ID
  getById: (id) => {
    return api.get(`/documents/${id}`);
  },

  // Update document
  update: (id, data) => {
    return api.put(`/documents/${id}`, data);
  },

  // Delete document
  delete: (id) => {
    return api.delete(`/documents/${id}`);
  },

  // Download document
  download: (id) => {
    return api.download(`/documents/${id}/download`);
  },

  // Get shared documents
  getShared: (options = {}) => {
    const params = new URLSearchParams();

    if (options.page) {
      params.append('page', options.page);
    }
    if (options.limit) {
      params.append('limit', options.limit);
    }

    const query = params.toString();
    return api.get(`/documents/shared${query ? `?${query}` : ''}`);
  },

  // Simple search
  search: (options = {}) => {
    const params = new URLSearchParams();

    if (options.query) {
      params.append('q', options.query);
    }
    if (options.labels) {
      const labelArray = Array.isArray(options.labels) ? options.labels : [options.labels];
      labelArray.forEach(label => params.append('labels', label));
    }
    if (options.folderId) {
      params.append('folderId', options.folderId);
    }
    if (options.page) {
      params.append('page', options.page);
    }
    if (options.limit) {
      params.append('limit', options.limit);
    }

    const query = params.toString();
    return api.get(`/documents/search${query ? `?${query}` : ''}`);
  },

  // RAG (AI-powered) search
  ragSearch: (options = {}) => {
    const params = new URLSearchParams();

    if (options.query) {
      params.append('q', options.query);
    }
    if (options.limit) {
      params.append('limit', options.limit);
    }

    const query = params.toString();
    return api.get(`/documents/rag-search${query ? `?${query}` : ''}`);
  },

  // Get recent documents
  getRecent: (limit = 10) => {
    return api.get(`/documents/recent?limit=${limit}`);
  },

  // Get document activity
  getActivity: (id, type = 'latest') => {
    return api.get(`/documents/${id}/activity${type ? `?type=${type}` : ''}`);
  },
};

export default documentApi;