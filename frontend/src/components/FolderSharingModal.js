'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, ShareIcon, UserIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function FolderSharingModal({ folder, isOpen, onClose, onUpdate }) {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [newUserPermission, setNewUserPermission] = useState('viewer');
  const [sharing, setSharing] = useState(false);

  const permissionLabels = {
    viewer: 'Viewer',
    editor: 'Editor'
  };

  const permissionColors = {
    viewer: 'text-gray-600 bg-gray-50',
    editor: 'text-blue-600 bg-blue-50'
  };

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      // Use list-for-sharing endpoint yang bisa diakses semua authenticated users
      const response = await api.get('/users/list-for-sharing');
      console.log('📊 Users API Response:', response.data);

      if (response.data.success) {
        const users = response.data.data;
        console.log('👥 Users data:', users);
        console.log('👥 Is Array?:', Array.isArray(users));

        // Pastikan users adalah array
        if (Array.isArray(users)) {
          setAllUsers(users);
          console.log('✅ Set users array:', users.length, 'users');
        } else if (users && typeof users === 'object') {
          // Jika response.data.data adalah object dengan property users
          const usersList = users.users || [];
          setAllUsers(usersList);
          console.log('✅ Set users from object.users:', usersList.length, 'users');
        } else {
          setAllUsers([]);
          console.log('⚠️ No valid users data, set empty array');
        }
      } else {
        setAllUsers([]);
        console.log('❌ API response not successful');
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Jika gagal fetch users (misal tidak punya akses), gunakan mode input email manual
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [api]);

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
      fetchAllUsers();
      setSelectedUserId('');
      setSearchQuery('');
      setShowDropdown(false);
    }
  }, [isOpen, folder, fetchPermissions, fetchAllUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Filter users yang belum memiliki akses (dengan defensive check)
  const availableUsers = Array.isArray(allUsers)
    ? allUsers.filter(user =>
        !permissions.some(perm => perm.user && perm.user.id === user.id)
      )
    : [];

  // Filter users berdasarkan search query (dengan defensive check)
  const filteredUsers = Array.isArray(availableUsers)
    ? availableUsers.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Get selected user (dengan defensive check)
  const selectedUser = Array.isArray(allUsers)
    ? allUsers.find(user => user.id === parseInt(selectedUserId))
    : null;

  const shareFolder = async () => {
    if (!selectedUserId) return;

    const userToShare = Array.isArray(allUsers)
      ? allUsers.find(user => user.id === parseInt(selectedUserId))
      : null;
    if (!userToShare) {
      alert('Selected user not found');
      return;
    }

    try {
      setSharing(true);
      const response = await api.post(`/folders/${folder.id}/share`, {
        userEmail: userToShare.email,
        permissionLevel: newUserPermission
      });

      if (response.data.success) {
        // Refresh permissions list
        await fetchPermissions();
        setSelectedUserId('');
        setSearchQuery('');
        setNewUserPermission('viewer');
        setShowDropdown(false);

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
            <ShareIcon className="h-5 w-5 text-orange-600" />
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

          {loadingUsers ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              <div className="flex space-x-2 mb-2">
                {/* Searchable User Dropdown */}
                <div className="flex-1 relative user-dropdown-container">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Search user by name or email"}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                    <ChevronDownIcon
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                    />
                  </div>

                  {/* Dropdown List */}
                  {showDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(user.id.toString());
                            setSearchQuery('');
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No users found */}
                  {showDropdown && searchQuery && filteredUsers.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                      <p className="text-sm text-gray-500 text-center">No users found</p>
                    </div>
                  )}
                </div>

                {/* Permission Selector */}
                <select
                  value={newUserPermission}
                  onChange={(e) => setNewUserPermission(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>

              {/* Selected User Display */}
              {selectedUser && (
                <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-3 w-3 text-orange-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                      <p className="text-xs text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUserId('');
                      setSearchQuery('');
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Share Button */}
              <button
                onClick={shareFolder}
                disabled={!selectedUserId || sharing}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>

              {/* Available Users Count */}
              {availableUsers.length === 0 && !loadingUsers && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  All users already have access to this folder
                </p>
              )}
            </>
          )}
        </div>

        {/* Current permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            People with access ({permissions.length})
          </label>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
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
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
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