'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, ShareIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function FolderSharingModal({ folder, isOpen, onClose, onUpdate }) {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState('read');
  const [sharing, setSharing] = useState(false);

  const permissionLabels = {
    read: 'View only',
    write: 'Can edit',
    admin: 'Full access'
  };

  const permissionColors = {
    read: 'text-green-600 bg-green-50',
    write: 'text-blue-600 bg-blue-50',
    admin: 'text-purple-600 bg-purple-50'
  };

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/folders/${folder.id}/permissions`);
      if (response.data.success) {
        setPermissions(response.data.data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      alert('Failed to load sharing permissions');
    } finally {
      setLoading(false);
    }
  }, [api, folder]);

  useEffect(() => {
    if (isOpen && folder) {
      fetchPermissions();
    }
  }, [isOpen, folder, fetchPermissions]);

  const shareFolder = async () => {
    if (!newUserEmail.trim()) return;

    try {
      setSharing(true);
      const response = await api.post(`/folders/${folder.id}/share`, {
        userEmail: newUserEmail.trim(),
        permissionLevel: newUserPermission
      });

      if (response.data.success) {
        // Refresh permissions list
        await fetchPermissions();
        setNewUserEmail('');
        setNewUserPermission('read');
        
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error sharing folder:', error);
      alert(error.response?.data?.message || 'Failed to share folder');
    } finally {
      setSharing(false);
    }
  };

  const updatePermission = async (userId, newPermission) => {
    try {
      const response = await api.put(`/folders/${folder.id}/permissions/${userId}`, {
        permissionLevel: newPermission
      });

      if (response.data.success) {
        // Update local state
        setPermissions(permissions.map(perm => 
          perm.user.id === userId 
            ? { ...perm, permissionLevel: newPermission }
            : perm
        ));
        
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      alert('Failed to update permission');
    }
  };

  const revokeAccess = async (userId) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) return;

    try {
      const response = await api.delete(`/folders/${folder.id}/permissions/${userId}`);

      if (response.data.success) {
        // Remove from local state
        setPermissions(permissions.filter(perm => perm.user.id !== userId));
        
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access');
    }
  };

  if (!isOpen || !folder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-6 w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <ShareIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Share folder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Folder name */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{folder.name}</p>
          <p className="text-xs text-gray-500">Folder</p>
        </div>

        {/* Add new user */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add people
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && shareFolder()}
              />
            </div>
            <select
              value={newUserPermission}
              onChange={(e) => setNewUserPermission(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="read">View only</option>
              <option value="write">Can edit</option>
              <option value="admin">Full access</option>
            </select>
          </div>
          <button
            onClick={shareFolder}
            disabled={!newUserEmail.trim() || sharing}
            className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>

        {/* Current permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            People with access ({permissions.length})
          </label>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <UserIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p>No one else has access to this folder</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {permissions.map((permission) => (
                <div key={permission.user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {permission.user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {permission.user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={permission.permissionLevel}
                      onChange={(e) => updatePermission(permission.user.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="read">View only</option>
                      <option value="write">Can edit</option>
                      <option value="admin">Full access</option>
                    </select>
                    
                    <button
                      onClick={() => revokeAccess(permission.user.id)}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove access"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}