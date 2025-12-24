'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  XMarkIcon, 
  TagIcon, 
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';

export default function DocumentLabelsModal({ document, isOpen, onClose, onUpdate }) {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allLabels, setAllLabels] = useState([]);
  const [documentLabels, setDocumentLabels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const fetchLabels = useCallback(async () => {
    try {
      const response = await api.get('/labels');
      if (response.data.success) {
        setAllLabels(response.data.data.labels || []);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, [api]);

  const fetchDocumentLabels = useCallback(async () => {
    try {
      setLoading(true);
      // Use /details endpoint to avoid logging 'viewed' activity
      const response = await api.get(`/documents/${document.id}/details`);
      if (response.data.success) {
        setDocumentLabels(response.data.data.document.labels || []);
      }
    } catch (error) {
      console.error('Error fetching document labels:', error);
    } finally {
      setLoading(false);
    }
  }, [api, document]);

  useEffect(() => {
    if (isOpen && document) {
      fetchLabels();
      fetchDocumentLabels();
    }
  }, [isOpen, document, fetchLabels, fetchDocumentLabels]);

  const createLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      const response = await api.post('/labels', {
        name: newLabelName.trim(),
        color: newLabelColor
      });

      if (response.data.success) {
        const newLabel = response.data.data.label;
        setAllLabels([...allLabels, newLabel]);
        setNewLabelName('');
        setNewLabelColor('#3B82F6');
        setShowCreateLabel(false);
        
        // Auto-assign the new label to the document
        await assignLabelToDocument(newLabel.id);
      }
    } catch (error) {
      console.error('Error creating label:', error);
      alert(error.response?.data?.message || 'Failed to create label');
    }
  };

  const assignLabelToDocument = async (labelId) => {
    try {
      const response = await api.post('/labels/assign', {
        documentId: document.id,
        labelId: labelId
      });

      if (response.data.success) {
        // Find the label and add it to document labels
        const label = allLabels.find(l => l.id === labelId);
        if (label && !documentLabels.some(l => l.id === labelId)) {
          setDocumentLabels([...documentLabels, label]);
          if (onUpdate) onUpdate();
        }
      }
    } catch (error) {
      console.error('Error assigning label:', error);
      alert(error.response?.data?.message || 'Failed to assign label');
    }
  };

  const removeLabelFromDocument = async (labelObj) => {
    try {
      const response = await api.delete(`/labels/remove/${document.id}/${labelObj.id}`);

      if (response.data.success) {
        setDocumentLabels(documentLabels.filter(l => l.id !== labelObj.id));
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error removing label:', error);
      alert(error.response?.data?.message || 'Failed to remove label');
    }
  };

  const filteredLabels = allLabels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !documentLabels.some(docLabel => docLabel.id === label.id)
  );

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-4 sm:p-6 md:p-8 w-full max-w-2xl bg-white rounded-lg shadow-xl m-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start space-x-3">
            <TagIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Labels</h2>
              <p className="text-sm text-gray-500 mt-1">{document.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 md:h-5 md:w-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Labels */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Current Labels</h3>
              {documentLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {documentLabels.map((label, index) => (
                    <div
                      key={label.id || index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border group"
                      style={{
                        backgroundColor: label?.color + '20' || '#3B82F620',
                        borderColor: label?.color || '#3B82F6',
                        color: label?.color || '#3B82F6'
                      }}
                    >
                      <span>{label.name}</span>
                      <button
                        onClick={() => removeLabelFromDocument(label)}
                        className="ml-2 p-0.5 rounded-full hover:bg-black hover:bg-opacity-20 opacity-70 hover:opacity-100 transition-all"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No labels assigned</div>
              )}
            </div>

            {/* Search and Add Labels */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-900">Add Labels</h3>
                <button
                  onClick={() => setShowCreateLabel(!showCreateLabel)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Label
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search labels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Create New Label */}
              {showCreateLabel && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Label</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Label name"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && createLabel()}
                    />
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-wrap gap-1">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setNewLabelColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                newLabelColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowCreateLabel(false);
                          setNewLabelName('');
                          setNewLabelColor('#3B82F6');
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createLabel}
                        disabled={!newLabelName.trim()}
                        className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      >
                        Create & Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Labels */}
              <div className="max-h-40 sm:max-h-60 overflow-y-auto">
                {filteredLabels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => assignLabelToDocument(label.id)}
                        className="flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{label.name}</span>
                        </div>
                        <PlusIcon className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TagIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">
                      {searchTerm ? 'No labels match your search' : 'All labels are already assigned'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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