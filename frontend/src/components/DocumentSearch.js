'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  TagIcon,
  DocumentIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

export default function DocumentSearch({ onSearchResults, currentFolderId, onLoading, onError }) {
  const { api } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter state
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [dateRange, setDateRange] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [fileTypes, setFileTypes] = useState([]);
  
  // Available options
  const [availableLabels, setAvailableLabels] = useState([]);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showFileTypeDropdown, setShowFileTypeDropdown] = useState(false);

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF', color: 'text-red-500' },
    { value: 'docx', label: 'Word', color: 'text-blue-600' },
    { value: 'xlsx', label: 'Excel', color: 'text-green-600' },
    { value: 'pptx', label: 'PowerPoint', color: 'text-orange-600' },
    { value: 'txt', label: 'Text', color: 'text-gray-600' },
    { value: 'csv', label: 'CSV', color: 'text-gray-600' }
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Newest first' },
    { value: 'date_asc', label: 'Oldest first' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'relevance', label: 'Relevance' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'Any time' },
    { value: '1d', label: 'Last 24 hours' },
    { value: '7d', label: 'Last week' },
    { value: '30d', label: 'Last month' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ];

  // Fetch available labels
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await api.get('/labels');
        if (response.data.success) {
          setAvailableLabels(response.data.data.labels || []);
        }
      } catch (error) {
        console.error('Error fetching labels:', error);
      }
    };
    
    fetchLabels();
  }, [api]);

  // Manual search function - simple and direct
  const performSearch = async (query, filters) => {
    const hasActiveFilters = (filters = {}) => {
      return (
        (filters.selectedLabels || []).length > 0 ||
        (filters.dateRange || '') ||
        (filters.fileTypes || []).length > 0
      );
    };

    const applyClientFilters = (documents, filters) => {
      return documents.filter(doc => {
        // File type filter
        if (filters.fileTypes && filters.fileTypes.length > 0) {
          const extension = doc.fileName?.split('.').pop()?.toLowerCase();
          if (!filters.fileTypes.includes(extension)) return false;
        }
        
        // Date range filter
        if (filters.dateRange) {
          const docDate = new Date(doc.createdAt);
          const now = new Date();
          const daysAgo = getDaysFromRange(filters.dateRange);
          const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          if (docDate < cutoffDate) return false;
        }
        
        return true;
      });
    };

    if (!query.trim() && !hasActiveFilters(filters)) {
      setSearchResults([]);
      setHasSearched(false);
      onSearchResults?.(null);
      return;
    }

    setIsSearching(true);
    onLoading?.(true);

    try {
      const params = new URLSearchParams();
      
      if (query.trim()) {
        params.append('search', query.trim());
      }
      
      if (currentFolderId) {
        params.append('folderId', currentFolderId);
      }
      
      if (filters.selectedLabels && filters.selectedLabels.length > 0) {
        filters.selectedLabels.forEach(label => params.append('labels', label));
      }
      
      params.append('limit', '100');

      const response = await api.get(`/documents?${params.toString()}`);
      
      if (response.data.success) {
        let results = response.data.data.documents || [];
        
        // Client-side filtering and sorting
        results = applyClientFilters(results, filters);
        results = applySorting(results, filters.sortBy);
        
        setSearchResults(results);
        setHasSearched(true);
        onSearchResults?.(results);
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      setSearchResults([]);
      setHasSearched(true);
      onSearchResults?.([]);
      onError?.('Failed to search documents. Please try again.');
    } finally {
      setIsSearching(false);
      onLoading?.(false);
    }
  };


  // Apply sorting
  const applySorting = (documents, sortBy) => {
    return documents.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name_asc':
          return a.title.localeCompare(b.title);
        case 'name_desc':
          return b.title.localeCompare(a.title);
        case 'relevance':
          // Could implement relevance scoring here
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });
  };

  const getDaysFromRange = (range) => {
    switch (range) {
      case '1d': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 0;
    }
  };

  const hasActiveFilters = (filters = {}) => {
    return (
      (filters.selectedLabels || selectedLabels).length > 0 ||
      (filters.dateRange || dateRange) ||
      (filters.fileTypes || fileTypes).length > 0
    );
  };

  // Manual search handler
  const handleSearch = () => {
    const filters = { selectedLabels, dateRange, sortBy, fileTypes };
    performSearch(searchQuery, filters);
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Note: No auto-search - all search is manual only

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLabels([]);
    setDateRange('');
    setSortBy('date_desc');
    setFileTypes([]);
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    onSearchResults?.(null);
    onError?.(null);
  };

  const toggleLabel = (labelName) => {
    setSelectedLabels(prev => 
      prev.includes(labelName)
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  const toggleFileType = (fileType) => {
    setFileTypes(prev => 
      prev.includes(fileType)
        ? prev.filter(ft => ft !== fileType)
        : [...prev, fileType]
    );
  };

  const getFileTypeLabel = (fileType) => {
    return fileTypeOptions.find(ft => ft.value === fileType)?.label || fileType;
  };

  const activeFiltersCount = useMemo(() => {
    return selectedLabels.length + fileTypes.length + (dateRange ? 1 : 0);
  }, [selectedLabels.length, fileTypes.length, dateRange]);

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Search Bar */}
      <div className="px-6 py-4">
        <div className="max-w-2xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 ${isSearching ? 'animate-pulse text-blue-500' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search documents and content..."
              className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {(searchQuery || hasActiveFilters()) && (
                <button
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() && !hasActiveFilters()}
                className="ml-1 mr-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Search (Enter)"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="text-sm text-gray-500">
            {hasSearched ? (
              <span>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </span>
            ) : (
              <span>
                Enter search terms and click Search or press Enter
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Labels Filter */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labels
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                  className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {selectedLabels.length === 0 
                        ? 'Any labels' 
                        : `${selectedLabels.length} selected`
                      }
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
                
                {showLabelDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    {availableLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.name)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {label.name}
                        </span>
                        {selectedLabels.includes(label.name) && (
                          <CheckIcon className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                    {availableLabels.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No labels available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* File Type Filter */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowFileTypeDropdown(!showFileTypeDropdown)}
                  className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {fileTypes.length === 0 
                        ? 'Any type' 
                        : fileTypes.map(ft => getFileTypeLabel(ft)).join(', ')
                      }
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
                
                {showFileTypeDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                    {fileTypeOptions.map((fileType) => (
                      <button
                        key={fileType.value}
                        onClick={() => toggleFileType(fileType.value)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <DocumentIcon className={`h-4 w-4 mr-2 ${fileType.color}`} />
                          {fileType.label}
                        </span>
                        {fileTypes.includes(fileType.value) && (
                          <CheckIcon className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {dateRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedLabels.length > 0 || fileTypes.length > 0 || dateRange) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {label}
                  <button
                    onClick={() => toggleLabel(label)}
                    className="ml-2 inline-flex items-center p-0.5 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              
              {fileTypes.map((fileType) => (
                <span
                  key={fileType}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  <DocumentIcon className="h-3 w-3 mr-1" />
                  {getFileTypeLabel(fileType)}
                  <button
                    onClick={() => toggleFileType(fileType)}
                    className="ml-2 inline-flex items-center p-0.5 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              
              {dateRange && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateRangeOptions.find(d => d.value === dateRange)?.label}
                  <button
                    onClick={() => setDateRange('')}
                    className="ml-2 inline-flex items-center p-0.5 rounded-full text-purple-600 hover:bg-purple-200 hover:text-purple-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showLabelDropdown || showFileTypeDropdown) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowLabelDropdown(false);
            setShowFileTypeDropdown(false);
          }}
        />
      )}
    </div>
  );
}

