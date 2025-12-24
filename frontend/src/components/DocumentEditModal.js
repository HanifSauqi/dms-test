'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, PencilIcon, DocumentIcon } from '@heroicons/react/24/outline';

export default function DocumentEditModal({ document, isOpen, onClose, onUpdate }) {
  const { api } = useAuth();
  const [documentTitle, setDocumentTitle] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      setDocumentTitle(document.title || '');
    }
  }, [isOpen, document]);

  const updateDocument = async () => {
    if (!documentTitle.trim()) return;

    try {
      setUpdating(true);
      const response = await api.put(`/documents/${document.id}`, {
        title: documentTitle.trim()
      });

      if (response.data.success) {
        if (onUpdate) onUpdate();
        onClose();
        alert('Document updated successfully');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert(error.response?.data?.message || 'Failed to update document');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateDocument();
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-4 sm:p-6 w-full max-w-md bg-white rounded-lg shadow-xl m-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Edit Document</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 md:h-5 md:w-5 text-gray-500" />
          </button>
        </div>

        {/* Current document info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <DocumentIcon className="h-4 w-4 text-gray-500" />
            <p className="text-sm text-gray-600">{document.fileName}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="documentTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              id="documentTitle"
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter document title"
              autoFocus
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be the display name for your document
            </p>
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
              disabled={!documentTitle.trim() || updating || documentTitle.trim() === document.title}
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