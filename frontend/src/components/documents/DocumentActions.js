'use client';

import { useState } from 'react';
import {
  PlusCircleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import FileUpload from '@/components/FileUpload';
import { showSuccess, showError } from '@/utils/toast';

export default function DocumentActions({
  onUploadComplete,
  onCreateFolder,
  onRefresh,
  loading = false,
  currentFolderId = null
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUploadComplete = (uploadedFiles) => {
    setShowUploadModal(false);
    setUploading(false);

    if (uploadedFiles && uploadedFiles.length > 0) {
      showSuccess(`${uploadedFiles.length} document(s) uploaded successfully`);
      onUploadComplete && onUploadComplete(uploadedFiles);
    }
  };

  const handleUploadError = (error) => {
    setUploading(false);
    showError(error.message || 'Upload failed');
  };

  const handleCreateFolder = (folderName) => {
    setShowNewFolderModal(false);
    onCreateFolder && onCreateFolder(folderName);
  };

  const handleRefresh = () => {
    onRefresh && onRefresh();
  };

  return (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => setShowNewFolderModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
      >
        <PlusCircleIcon className="w-5 h-5" />
        <span>New Folder</span>
      </button>

      <button
        onClick={() => {
          setShowUploadModal(true);
          setUploading(true);
        }}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 border-2 border-orange-600 text-orange-600 bg-white rounded-lg hover:bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowUpTrayIcon className="w-5 h-5" />
        <span>Upload File</span>
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUpload
          folderId={currentFolderId}
          onClose={() => {
            setShowUploadModal(false);
            setUploading(false);
          }}
          onUploadSuccess={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <FolderModal
          onClose={() => setShowNewFolderModal(false)}
          onCreateFolder={handleCreateFolder}
        />
      )}
    </div>
  );
}

// Simple Folder Modal Component
function FolderModal({ onClose, onCreateFolder }) {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!folderName.trim()) {
      showError('Folder name is required');
      return;
    }

    if (folderName.trim().length > 255) {
      showError('Folder name too long (max 255 characters)');
      return;
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(folderName.trim())) {
      showError('Folder name contains invalid characters');
      return;
    }

    try {
      setLoading(true);
      if (onCreateFolder) {
        await onCreateFolder(folderName.trim());
      }
      onClose();
    } catch (error) {
      showError(error.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create New Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter folder name"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !folderName.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}