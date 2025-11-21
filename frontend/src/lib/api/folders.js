import { api } from './client';

export const folderApi = {
  // Create folder
  create: (data) => {
    return api.post('/folders', data);
  },

  // Get all folders
  getAll: (parentId = null) => {
    const params = parentId ? `?parentId=${parentId}` : '';
    return api.get(`/folders${params}`);
  },

  // Get folder by ID
  getById: (id) => {
    return api.get(`/folders/${id}`);
  },

  // Update folder
  update: (id, data) => {
    return api.put(`/folders/${id}`, data);
  },

  // Delete folder
  delete: (id, force = false) => {
    const params = force ? '?force=true' : '';
    return api.delete(`/folders/${id}${params}`);
  },

  // Share folder
  share: (id, data) => {
    return api.post(`/folders/${id}/share`, data);
  },

  // Get folder permissions
  getPermissions: (id) => {
    return api.get(`/folders/${id}/permissions`);
  },

  // Update folder permission
  updatePermission: (id, userId, data) => {
    return api.put(`/folders/${id}/permissions/${userId}`, data);
  },

  // Revoke folder access
  revokeAccess: (id, userId) => {
    return api.delete(`/folders/${id}/permissions/${userId}`);
  },

  // Get shared folders
  getShared: () => {
    return api.get('/folders/shared');
  },
};

export default folderApi;