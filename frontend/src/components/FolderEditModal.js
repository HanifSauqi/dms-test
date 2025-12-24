'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function FolderEditModal({ folder, isOpen, onClose, onUpdate }) {
  const { api } = useAuth();
  const [folderName, setFolderName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && folder) {
      setFolderName(folder.name || '');
    }
  }, [isOpen, folder]);

  const updateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      setUpdating(true);
      const response = await api.put(`/folders/${folder.id}`, {
        name: folderName.trim()
      });

      if (response.data.success) {
        if (onUpdate) onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      alert(error.response?.data?.message || 'Failed to update folder');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateFolder();
  };

  if (!isOpen || !folder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-4 sm:p-6 w-full max-w-md bg-white rounded-lg shadow-xl m-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Rename folder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 md:h-5 md:w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
              Folder name
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              required
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || updating || folderName.trim() === folder.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {updating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}