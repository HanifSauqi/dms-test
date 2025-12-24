'use client';

import { useState } from 'react';
import {
  TagIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { showError } from '@/utils/toast';

export default function LabelList({
  labels = [],
  loading = false,
  onEdit,
  onDelete,
  onAssignDocument
}) {
  const [actionLoading, setActionLoading] = useState(null);

  const handleLabelAction = async (action, label) => {
    try {
      setActionLoading(`${action}-${label.id}`);

      if (action === 'edit') {
        onEdit(label);
      } else if (action === 'delete') {
        await onDelete(label);
      }
    } catch (error) {
      console.error(`Error performing ${action} on label:`, error);
      showError(`Failed to ${action} label`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Loading labels...</p>
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <TagIcon className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No labels found</p>
        <p className="text-gray-400 text-sm mt-2">Create your first label to get started</p>
      </div>
    );
  }

  return (
<div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
        {labels.map((label) => (
        <div
          key={label.id}
          className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-4 h-24"
        >
          {/* Action Icons */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button
              onClick={() => handleLabelAction('edit', label)}
              className="p-1 hover:bg-orange-50 rounded transition-colors"
              title="Edit label"
              disabled={actionLoading === `edit-${label.id}`}
            >
              <PencilIcon className="w-4 h-4 text-orange-500 hover:text-orange-600" />
            </button>
            <button
              onClick={() => handleLabelAction('delete', label)}
              className="p-1 hover:bg-red-50 rounded transition-colors"
              title="Delete label"
              disabled={actionLoading === `delete-${label.id}`}
            >
              <TrashIcon className="w-4 h-4 text-red-500 hover:text-red-600" />
            </button>
          </div>

          {/* Label Badge */}
          <div className="flex items-center justify-center h-full">
            <div
              className="rounded-full px-6 py-1.5 shadow-sm"
              style={{ backgroundColor: label.color }}
            >
              <h3 className="text-sm font-medium text-white text-center whitespace-nowrap">
                {label.name}
              </h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}