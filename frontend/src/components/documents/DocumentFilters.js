'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { labelApi } from '@/lib/api';

export default function DocumentFilters({
  onSearch,
  onFolderFilter,
  onLabelFilter,
  onClearFilters,
  currentSearch = '',
  currentFolderId = null,
  currentLabels = []
}) {
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [labels, setLabels] = useState([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch labels for filter dropdown
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        setLoadingLabels(true);
        const response = await labelApi.getAll();
        setLabels(response.data?.labels || []);
      } catch (error) {
        console.error('Error fetching labels:', error);
      } finally {
        setLoadingLabels(false);
      }
    };

    if (showFilters) {
      fetchLabels();
    }
  }, [showFilters]);

  // Debounced search
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (searchTerm !== currentSearch) {
        onSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm, onSearch, currentSearch]);

  const handleLabelToggle = (label) => {
    const newLabels = currentLabels.includes(label)
      ? currentLabels.filter(l => l !== label)
      : [...currentLabels, label];

    onLabelFilter(newLabels);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    onClearFilters();
  };

  const hasActiveFilters = currentSearch || currentFolderId || currentLabels.length > 0;

  return (
    <div>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black z-10" />
        <input
          type="text"
          placeholder="Search Document"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-md text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:shadow-md bg-gray-100 shadow-md hover:shadow-xl transition-shadow duration-200"
        />
      </div>
    </div>
  );
}