'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MagnifyingGlassIcon,
  DocumentIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  InformationCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import DocumentSearch from '@/components/DocumentSearch';
import DropdownMenu from '@/components/DropdownMenu';
import FileViewerModal from '@/components/FileViewerModal';
import DocumentDetailsModal from '@/components/DocumentDetailsModal';
import DocumentEditModal from '@/components/DocumentEditModal';
import DocumentLabelsModal from '@/components/DocumentLabelsModal';

export default function SearchPage() {
  const { api } = useAuth();
  
  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [showDocumentEdit, setShowDocumentEdit] = useState(false);
  const [showDocumentLabels, setShowDocumentLabels] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleSearchResults = (results) => {
    if (results === null) {
      // Clear search
      setSearchResults([]);
      setHasSearched(false);
      setError(null);
    } else {
      // Display results
      setSearchResults(results);
      setHasSearched(true);
      setError(null);
    }
  };

  const handleSearchLoading = (loading) => {
    setIsSearching(loading);
  };

  const handleSearchError = (error) => {
    setError(error);
    setSearchResults([]);
    setHasSearched(true);
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
      case 'txt':
      case 'csv':
        return <DocumentIcon className={`${baseClasses} text-gray-600`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <DocumentIcon className={`${baseClasses} text-purple-500`} />;
      case 'json':
        return <DocumentIcon className={`${baseClasses} text-yellow-600`} />;
      default:
        return <DocumentIcon className={`${baseClasses} text-gray-400`} />;
    }
  };

  // Document action handlers
  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
  };

  const handleDocumentMenuClick = (option, document) => {
    setSelectedDocument(document);
    
    switch (option.action) {
      case 'view':
        setShowFileViewer(true);
        break;
      case 'details':
        setShowDocumentDetails(true);
        break;
      case 'download':
        handleDownloadDocument(document);
        break;
      case 'edit':
        setShowDocumentEdit(true);
        break;
      case 'labels':
        setShowDocumentLabels(true);
        break;
      case 'delete':
        handleDeleteDocument(document);
        break;
    }
  };

  const handleDownloadDocument = async (docToDownload) => {
    try {
      const response = await api.get(`/documents/${docToDownload.id}/download`, {
        responseType: 'blob'
      });

      // Create blob URL
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const linkElement = window.document.createElement('a');
      linkElement.href = url;
      linkElement.download = docToDownload.title || docToDownload.fileName;
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);

      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  // Get document dropdown options based on access level
  const getDocumentDropdownOptions = (document) => {
    const canEdit = document.accessLevel === 'admin' || 
                   document.accessLevel === 'write' || 
                   document.accessLevel === 'owner';
    const canView = true; // All documents can be viewed
    
    const options = [];

    if (canView) {
      options.push({
        label: 'View',
        icon: <EyeIcon className="h-4 w-4" />,
        action: 'view'
      });
      
      options.push({
        label: 'Details',
        icon: <InformationCircleIcon className="h-4 w-4" />,
        action: 'details'
      });
      
      options.push({
        label: 'Download',
        icon: <ArrowDownTrayIcon className="h-4 w-4" />,
        action: 'download'
      });
    }
    
    if (canEdit) {
      options.push({
        label: 'Edit',
        icon: <PencilIcon className="h-4 w-4" />,
        action: 'edit'
      });
      
      options.push({
        label: 'Manage Labels',
        icon: <TagIcon className="h-4 w-4" />,
        action: 'labels'
      });
      
      options.push({
        label: 'Delete',
        icon: <TrashIcon className="h-4 w-4" />,
        action: 'delete',
        destructive: true
      });
    }

    return options;
  };

  const handleDeleteDocument = async (document) => {
    if (!confirm(`Are you sure you want to delete "${document.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/documents/${document.id}`);
      if (response.data.success) {
        // Remove from search results
        setSearchResults(searchResults.filter(d => d.id !== document.id));
        alert('Document deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error.response?.data?.message || 'Failed to delete document');
    }
  };

  // Modal handlers
  const handleModalClose = () => {
    setShowFileViewer(false);
    setShowDocumentDetails(false);
    setShowDocumentEdit(false);
    setShowDocumentLabels(false);
    setSelectedDocument(null);
  };

  const handleDocumentUpdate = () => {
    // Refresh search results after update
    // You might want to re-run the search or update the local state
    handleModalClose();
  };

  return (
    <div className="space-y-0 h-full">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search Documents</h1>
            <p className="text-sm text-gray-600 mt-1">
              Search through all your documents and content
            </p>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <DocumentSearch 
        onSearchResults={handleSearchResults}
        onLoading={handleSearchLoading}
        onError={handleSearchError}
      />
      
      {/* Main Content Area */}
      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Searching documents...</p>
            </div>
          </div>
        )}
        
        {/* No Search State */}
        {!isSearching && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
              <p className="text-gray-500 max-w-sm">
                Enter keywords, use filters, or browse by labels to find your documents quickly.
              </p>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isSearching && hasSearched && searchResults.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <DocumentIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                No documents match your search criteria. Try adjusting your search terms or filters.
              </p>
              <div className="text-sm text-gray-400">
                <p>Search tips:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Check your spelling</li>
                  <li>Use different keywords</li>
                  <li>Try removing some filters</li>
                  <li>Search for partial words</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && hasSearched && searchResults.length > 0 && (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentIcon className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Found {searchResults.length} document{searchResults.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Results are sorted by relevance and date
                  </p>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((document) => (
                    <div
                      key={document.id}
                      className="group cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-md relative"
                    >
                      <div 
                        onClick={() => handleDocumentClick(document)}
                        className="flex flex-col space-y-3"
                      >
                        {/* File Icon and Name */}
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getFileIcon(document.fileName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600" title={document.title}>
                              {document.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {document.fileName}
                            </p>
                          </div>
                        </div>

                        {/* Document Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {new Date(document.createdAt).toLocaleDateString()}
                            </p>
                            {document.fileSize && (
                              <p className="text-xs text-gray-500">
                                {formatFileSize(document.fileSize)}
                              </p>
                            )}
                          </div>

                          {/* Folder Context */}
                          {document.folderName && (
                            <div className="flex items-center">
                              <FolderIcon className="h-3 w-3 text-blue-500 mr-1" />
                              <p className="text-xs text-blue-600 truncate" title={`In folder: ${document.folderName}`}>
                                {document.folderName}
                              </p>
                            </div>
                          )}

                          {/* Labels */}
                          {document.labels && document.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {document.labels.slice(0, 3).map((label, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {label}
                                </span>
                              ))}
                              {document.labels.length > 3 && (
                                <span className="text-xs text-gray-400 px-1">
                                  +{document.labels.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Indicator */}
                        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view document
                        </div>
                      </div>

                      {/* Three-dot menu for documents with permission-based options */}
                      <div className="absolute top-2 right-2">
                        <DropdownMenu
                          options={getDocumentDropdownOptions(document)}
                          onOptionClick={(option) => handleDocumentMenuClick(option, document)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Document Edit Modal */}
      {showDocumentEdit && selectedDocument && (
        <DocumentEditModal
          document={selectedDocument}
          isOpen={showDocumentEdit}
          onClose={handleModalClose}
          onUpdate={handleDocumentUpdate}
        />
      )}

      {/* Document Labels Modal */}
      {showDocumentLabels && selectedDocument && (
        <DocumentLabelsModal
          document={selectedDocument}
          isOpen={showDocumentLabels}
          onClose={handleModalClose}
          onUpdate={handleDocumentUpdate}
        />
      )}
    </div>
  );
}