'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  MagnifyingGlassIcon,
  DocumentIcon,
  FolderIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  ArchiveBoxArrowDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import FileViewerModal from '@/components/FileViewerModal';
import DocumentDetailsModal from '@/components/DocumentDetailsModal';
import JSZip from 'jszip';

export default function ResumePage() {
  const { api } = useAuth();
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(true);

  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal states
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Download all state
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [documentsRes, labelsRes] = await Promise.all([
        api.get('/documents'),
        api.get('/labels')
      ]);

      // Match the structure from DocumentSearch component
      const docs = documentsRes.data.data?.documents || [];
      setDocuments(docs);
      // Don't set filteredDocuments - keep it empty until user searches

      const labelsData = labelsRes.data.data?.labels || [];
      setLabels(Array.isArray(labelsData) ? labelsData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setDocuments([]);
      setFilteredDocuments([]);
      setLabels([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSearch = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      let results = [];

      if (searchQuery.trim()) {
        try {
          // RAG Search with Gemini AI (only on resume page) - correct path
          const response = await api.get(`/documents/rag-search?q=${encodeURIComponent(searchQuery.trim())}&limit=50`);
          if (response.data.success) {
            results = response.data.data.results || [];
          }
        } catch (ragError) {
          console.warn('⚠️ RAG search failed, falling back to keyword search:', ragError.message);
          // Fallback to simple search if RAG fails
          try {
            const fallbackResponse = await api.get(`/documents/search?q=${encodeURIComponent(searchQuery.trim())}`);
            if (fallbackResponse.data.success) {
              results = fallbackResponse.data.data.documents || [];
            }
          } catch (fallbackError) {
            console.error('❌ Fallback search also failed:', fallbackError);
          }
        }
      }

      // Apply filters to search results
      results = applyFilters(results);
      setFilteredDocuments(results);
    } catch (err) {
      console.error('Error searching:', err);
      setFilteredDocuments([]);
    } finally {
      setSearching(false);
    }
  };

  const handleApplyFilters = async () => {
    setHasSearched(true);
    setSearching(true);

    try {
      let results = [];

      // If there's a search query, use search with fallback
      if (searchQuery.trim()) {
        try {
          // RAG search with Gemini AI (only on resume page) - correct path
          const response = await api.get(`/documents/rag-search?q=${encodeURIComponent(searchQuery.trim())}&limit=50`);
          if (response.data.success) {
            results = response.data.data.results || [];
          }
        } catch (ragError) {
          console.warn('⚠️ RAG search failed, falling back to simple search');
          // Fallback to simple search
          try {
            const fallbackResponse = await api.get(`/documents/search?q=${encodeURIComponent(searchQuery.trim())}`);
            if (fallbackResponse.data.success) {
              results = fallbackResponse.data.data.documents || [];
            }
          } catch (fallbackError) {
            console.error('❌ Fallback search also failed:', fallbackError);
          }
        }
      } else {
        // No search query - use all documents as base for filtering
        results = [...documents];
      }

      // Then apply filters to the results
      results = applyFilters(results);
      setFilteredDocuments(results);
    } catch (err) {
      console.error('Error applying filters:', err);
      setFilteredDocuments([]);
    } finally {
      setSearching(false);
    }
  };

  const applyFilters = (docs) => {
    let results = [...docs];

    // Filter by label
    if (selectedLabel) {
      results = results.filter(doc =>
        doc.labels && doc.labels.includes(selectedLabel)
      );
    }

    // Filter by file type
    if (selectedFileType) {
      results = results.filter(doc =>
        doc.fileName?.toLowerCase().endsWith(`.${selectedFileType.toLowerCase()}`)
      );
    }

    // Filter by date range
    if (selectedDateRange) {
      const now = new Date();
      results = results.filter(doc => {
        const docDate = new Date(doc.createdAt);
        switch (selectedDateRange) {
          case 'today':
            return docDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return docDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return docDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return docDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'name_desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });

    return results;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const baseClasses = "h-8 w-8 flex-shrink-0";

    switch (extension) {
      case 'pdf':
        return <DocumentIcon className={`${baseClasses} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <DocumentIcon className={`${baseClasses} text-blue-600`} />;
      case 'xls':
      case 'xlsx':
        return <DocumentIcon className={`${baseClasses} text-green-600`} />;
      case 'ppt':
      case 'pptx':
        return <DocumentIcon className={`${baseClasses} text-orange-600`} />;
      default:
        return <DocumentIcon className={`${baseClasses} text-gray-400`} />;
    }
  };

  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
  };

  const handleDocumentDetails = (document) => {
    setSelectedDocument(document);
    setShowDocumentDetails(true);
  };

  const handleDownloadDocument = async (docToDownload) => {
    try {
      // Correct path without /api prefix
      const response = await api.get(`/documents/${docToDownload.id}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const linkElement = window.document.createElement('a');
      linkElement.href = url;
      linkElement.download = docToDownload.title || docToDownload.fileName;
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleDownloadAll = async () => {
    if (filteredDocuments.length === 0) {
      alert('No documents to download');
      return;
    }

    if (!confirm(`Download all ${filteredDocuments.length} documents as ZIP file?`)) {
      return;
    }

    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: filteredDocuments.length });

    try {
      const zip = new JSZip();
      let successCount = 0;
      let failCount = 0;

      // Download each file and add to ZIP
      for (let i = 0; i < filteredDocuments.length; i++) {
        const doc = filteredDocuments[i];
        setDownloadProgress({ current: i + 1, total: filteredDocuments.length });

        try {
          // Correct path without /api prefix
          const response = await api.get(`/documents/${doc.id}/download`, {
            responseType: 'blob'
          });

          // Add file to ZIP with proper filename
          const fileName = doc.fileName || `${doc.title}.${doc.fileType || 'file'}`;
          zip.file(fileName, response.data);
          successCount++;
        } catch (error) {
          console.error(`Failed to download ${doc.title}:`, error);
          failCount++;
        }
      }

      if (successCount === 0) {
        alert('Failed to download any documents');
        return;
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP file
      const url = window.URL.createObjectURL(zipBlob);
      const linkElement = window.document.createElement('a');
      linkElement.href = url;
      linkElement.download = `documents_${new Date().getTime()}.zip`;
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);
      window.URL.revokeObjectURL(url);

      // Show result
      if (failCount > 0) {
        alert(`Downloaded ${successCount} documents. ${failCount} failed.`);
      } else {
        alert(`Successfully downloaded all ${successCount} documents!`);
      }
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('Failed to create ZIP file');
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleModalClose = () => {
    setShowFileViewer(false);
    setShowDocumentDetails(false);
    setSelectedDocument(null);
  };

  const fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600">
        <span
          onClick={() => router.push('/dashboard')}
          className="hover:text-gray-900 cursor-pointer transition-colors"
        >
          Home
        </span>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Resume</span>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4 mb-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search with AI (e.g., 'cv with 5+ years experience', 'unpaid invoices')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 transition-colors"
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              <AdjustmentsHorizontalIcon className={`h-5 w-5 ${showFilters ? 'text-orange-500' : ''}`} />
            </button>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Info */}
        {searchQuery && (
          <div className="mb-4 text-xs text-gray-500 italic">
            🤖 AI-Powered RAG Search with Gemini: Understands natural language and finds documents based on meaning
          </div>
        )}


        {/* Filters */}
        {showFilters && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Labels Filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Labels</label>
                <select
                  value={selectedLabel}
                  onChange={(e) => setSelectedLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Any Labels</option>
                  {Array.isArray(labels) && labels.map((label) => (
                    <option key={label.id} value={label.name}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Type Filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">File Type</label>
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Any Types</option>
                  {fileTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Data Range</label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Apply Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Apply
              </button>
            </div>
          </>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Results Header with Download All Button */}
        {filteredDocuments.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
              </h3>
            </div>
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingAll ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Downloading {downloadProgress.current}/{downloadProgress.total}...
                </>
              ) : (
                <>
                  <ArchiveBoxArrowDownIcon className="h-4 w-4 mr-2" />
                  Download All as ZIP
                </>
              )}
            </button>
          </div>
        )}

        <div className="p-6">
          {!hasSearched ? (
            // Empty state - before any search
            <div className="text-center py-20">
              <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Documents</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Use the search bar and filters above to find your documents. You can search by keywords, filter by labels, file types, date ranges, and sort the results.
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            // Empty state - after search with no results
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No documents found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(document.fileName)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.title}
                        </p>
                        {/* Similarity Badge - only show if semantic search was used */}
                        {document.similarity !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${document.similarity >= 70 ? 'bg-green-100 text-green-700' :
                              document.similarity >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                            {document.similarity}% match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {document.fileName}
                        </p>
                        {document.fileSize && (
                          <>
                            <span className="text-gray-300">•</span>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(document.fileSize)}
                            </p>
                          </>
                        )}
                        <span className="text-gray-300">•</span>
                        <p className="text-xs text-gray-500">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDocumentDetails(document)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <InformationCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDocumentClick(document)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="View document"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(document)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Viewer Modal */}
      {showFileViewer && selectedDocument && (
        <FileViewerModal
          document={selectedDocument}
          isOpen={showFileViewer}
          onClose={handleModalClose}
        />
      )}

      {/* Document Details Modal */}
      {showDocumentDetails && selectedDocument && (
        <DocumentDetailsModal
          document={selectedDocument}
          isOpen={showDocumentDetails}
          onClose={handleModalClose}
          onView={(doc) => {
            setShowDocumentDetails(false);
            setShowFileViewer(true);
          }}
          onDownload={handleDownloadDocument}
        />
      )}
    </div>
  );
}
