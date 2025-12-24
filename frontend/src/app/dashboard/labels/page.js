'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TagIcon, PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import LabelList from '@/components/labels/LabelList';
import LabelForm from '@/components/labels/LabelForm';
import { labelApi } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';

export default function LabelsPage() {
  const router = useRouter();
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);

  // Fetch labels
  const fetchLabels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await labelApi.getAll({
        sortBy: 'name',
        sortOrder: 'asc'
      });

      setLabels(response.data?.labels || response.labels || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
      setError(error.message || 'Failed to load labels');
      showError('Failed to load labels');
      setLabels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch labels on component mount
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Handle create label
  const handleCreateLabel = async (data) => {
    try {
      await labelApi.create(data);
      fetchLabels(); // Refresh labels
    } catch (error) {
      throw error; // Re-throw to let form handle error display
    }
  };

  // Handle edit label
  const handleEditLabel = (label) => {
    setSelectedLabel(label);
    setShowEditModal(true);
  };

  // Handle update label
  const handleUpdateLabel = async (data) => {
    try {
      await labelApi.update(selectedLabel.id, data);
      fetchLabels(); // Refresh labels
    } catch (error) {
      throw error; // Re-throw to let form handle error display
    }
  };

  // Handle delete label
  const handleDeleteLabel = async (label) => {
    // Check if label is being used
    if (label.usageCount > 0) {
      if (!window.confirm(
        `This label is used by ${label.usageCount} document(s). Deleting it will remove it from all documents. Are you sure?`
      )) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete "${label.name}"?`)) {
        return;
      }
    }

    try {
      await labelApi.delete(label.id);
      showSuccess('Label deleted successfully');
      fetchLabels(); // Refresh labels
    } catch (error) {
      console.error('Error deleting label:', error);
      showError(error.message || 'Failed to delete label');
    }
  };

  // Handle assign document to label
  const handleAssignDocument = (label) => {
    // TODO: Implement document assignment modal
    showError('Document assignment feature coming soon');
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedLabel(null);
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange-600"
            >
              Home
            </button>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              <span className="ml-1 text-sm font-medium text-gray-500">
                Labels
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Labels</h1>
            <p className="text-sm text-gray-600">Manage labels to organize your documents</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Label</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <TagIcon className="w-5 h-5 text-red-400 mr-2" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error loading labels</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <button
                onClick={fetchLabels}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Labels Grid */}
        <LabelList
          labels={labels}
          loading={loading}
          onEdit={handleEditLabel}
          onDelete={handleDeleteLabel}
          onAssignDocument={handleAssignDocument}
        />

        {/* Create Label Modal */}
        <LabelForm
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSubmit={handleCreateLabel}
        />

        {/* Edit Label Modal */}
        <LabelForm
          label={selectedLabel}
          isOpen={showEditModal}
          onClose={handleModalClose}
          onSubmit={handleUpdateLabel}
        />
    </>
  );
}