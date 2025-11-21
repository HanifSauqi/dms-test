'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MagnifyingGlassIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchBar() {
  const { api } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search documents with request cancellation (simple search - no AI)
  useEffect(() => {
    if (debouncedSearchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Create AbortController for cancelling request
    const abortController = new AbortController();

    const searchDocuments = async () => {
      setSearchLoading(true);
      try {
        // Simple search (without AI) - correct path without /api prefix
        const response = await api.get(`/documents/search?q=${encodeURIComponent(debouncedSearchQuery.trim())}`, {
          signal: abortController.signal
        });
        if (response.data.success) {
          setSearchResults(response.data.data.documents || []);
          setShowDropdown(true);
        }
      } catch (error) {
        // Don't show error if request was cancelled
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          console.error('Search error:', error);
          setSearchResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearchLoading(false);
        }
      }
    };

    searchDocuments();

    // Cleanup: cancel request if component unmounts or query changes
    return () => {
      abortController.abort();
    };
  }, [debouncedSearchQuery, api]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDocumentClick = (doc) => {
    setShowDropdown(false);
    setSearchQuery('');

    // Navigate to the folder where the document is located
    if (doc.folderId) {
      // Navigate to My Files with the specific folder
      router.push(`/dashboard/files?folderId=${doc.folderId}`);
    } else {
      // Navigate to My Files root (documents without folder)
      router.push('/dashboard/files');
    }
  };

  return (
    <div className="pb-4">
      <div className="relative w-full" ref={searchRef}>
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black z-10" />
        <input
          type="text"
          placeholder="Search Document"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-md text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:shadow-md bg-gray-100 shadow-md hover:shadow-xl transition-shadow duration-200"
        />

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
            {searchLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="border border-orange-600 rounded-lg">
                {searchResults.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className="w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors border-b border-orange-600 last:border-b-0 last:rounded-b-lg first:rounded-t-lg"
                  >
                    <div className="flex items-start">
                      <DocumentIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.title || doc.fileName || 'Untitled'}
                        </p>
                        {doc.content_summary && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {doc.content_summary}
                          </p>
                        )}
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <span>{doc.fileName?.split('.').pop()?.toUpperCase()}</span>
                          {doc.createdAt && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <DocumentIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No documents found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
