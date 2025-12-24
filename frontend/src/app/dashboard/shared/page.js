'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserIcon,
  FolderIcon,
  DocumentIcon,
  ShareIcon,
  EyeIcon,
  PencilIcon,
  ShieldCheckIcon,
  CalendarIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  TagIcon,
  EllipsisVerticalIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import DropdownMenu from '@/components/DropdownMenu';
import FileViewerModal from '@/components/FileViewerModal';
import DocumentDetailsModal from '@/components/DocumentDetailsModal';
import DocumentEditModal from '@/components/DocumentEditModal';
import DocumentLabelsModal from '@/components/DocumentLabelsModal';
import SearchBar from '@/components/SearchBar';
import { useRouter } from 'next/navigation';

export default function SharedPage() {
  const { api } = useAuth();
  const router = useRouter();
  
  // State management
  const [sharedFolders, setSharedFolders] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('folders');
  
  // Modal states
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [showDocumentEdit, setShowDocumentEdit] = useState(false);
  const [showDocumentLabels, setShowDocumentLabels] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalFolders: 0,
    totalDocuments: 0,
    readOnlyItems: 0,
    editableItems: 0
  });

  // Fetch shared folders
  const fetchSharedFolders = useCallback(async () => {
    try {
      const response = await api.get('/folders/shared');
      
      if (response.data.success) {
        return response.data.data.sharedFolders || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching shared folders:', error);
      return [];
    }
  }, [api]);

  // Fetch shared documents
  const fetchSharedDocuments = useCallback(async () => {
    try {
      const response = await api.get('/documents/shared');
      
      if (response.data.success) {
        return response.data.data.documents || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching shared documents:', error);
      return [];
    }
  }, [api]);

  // Load all shared content
  const loadSharedContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [folders, documents] = await Promise.all([
        fetchSharedFolders(),
        fetchSharedDocuments()
      ]);
      
      setSharedFolders(folders);
      setSharedDocuments(documents);
      
      // Calculate stats
      const totalItems = folders.length + documents.length;
      const readOnlyItems = [...folders, ...documents].filter(item =>
        item.permissionLevel === 'viewer'
      ).length;
      const editableItems = totalItems - readOnlyItems;
      
      setStats({
        totalFolders: folders.length,
        totalDocuments: documents.length,
        readOnlyItems,
        editableItems
      });
      
    } catch (error) {
      console.error('Error loading shared content:', error);
      setError('Failed to load shared content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchSharedFolders, fetchSharedDocuments]);

  // Load data on component mount
  useEffect(() => {
    loadSharedContent();
  }, [loadSharedContent]);

  // Permission level badge
  const getPermissionBadge = (permissionLevel) => {
    const config = {
      viewer: {
        text: 'Viewer',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700'
      },
      editor: {
        text: 'Editor',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      }
    };

    const { text, bgColor, textColor } = config[permissionLevel] || config.viewer;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
        {text}
      </span>
    );
  };

  // File icon helper
  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const baseClasses = "h-6 w-6 flex-shrink-0";
    
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

  // Copy folder handler
  const handleCopyFolder = async (folder) => {
    if (!confirm(`Copy folder "${folder.name}" to your own folders?`)) return;

    try {
      const response = await api.post(`/folders/${folder.id}/copy`, {});

      if (response.data.success) {
        alert(`Folder "${folder.name}" has been copied successfully!`);
        // Optionally, redirect to My Files to see the copied folder
        router.push('/dashboard/files');
      }
    } catch (error) {
      console.error('Error copying folder:', error);
      alert(error.response?.data?.message || 'Failed to copy folder');
    }
  };

  // Get dropdown options based on permission level
  const getDropdownOptions = (item, type) => {
    const canEdit = item.permissionLevel === 'editor';
    const canView = true; // All shared items can be viewed

    const options = [];

    if (type === 'document') {
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
      }
    } else if (type === 'folder') {
      if (canView) {
        options.push({
          label: 'Open',
          icon: <EyeIcon className="h-4 w-4" />,
          action: 'open'
        });
      }

      if (canEdit) {
        options.push({
          label: 'Copy to My Folders',
          icon: <DocumentDuplicateIcon className="h-4 w-4" />,
          action: 'copy'
        });
      }
    }

    return options;
  };

  // Handle item action
  const handleItemAction = (action, item, type) => {
    setSelectedDocument(item);

    switch (action) {
      case 'view':
        setShowFileViewer(true);
        break;
      case 'details':
        setShowDocumentDetails(true);
        break;
      case 'download':
        handleDownloadDocument(item);
        break;
      case 'edit':
        setShowDocumentEdit(true);
        break;
      case 'labels':
        setShowDocumentLabels(true);
        break;
      case 'open':
        // Navigate to shared folder di halaman My Files
        router.push(`/dashboard/files?folderId=${item.id}`);
        break;
      case 'copy':
        // Copy folder to user's own folders
        handleCopyFolder(item);
        break;
    }
  };

  // Handle folder/document click
  const handleItemClick = (item, type) => {
    if (type === 'folder') {
      // Navigate ke My Files page dengan folderId dari shared folder
      router.push(`/dashboard/files?folderId=${item.id}`);
    } else {
      setSelectedDocument(item);
      setShowFileViewer(true);
    }
  };

  // Download handler
  const handleDownloadDocument = async (docToDownload) => {
    try {
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

  // Modal handlers
  const handleModalClose = () => {
    setShowFileViewer(false);
    setShowDocumentDetails(false);
    setShowDocumentEdit(false);
    setShowDocumentLabels(false);
    setSelectedDocument(null);
  };

  const handleDocumentUpdate = () => {
    loadSharedContent(); // Refresh data after updates
    handleModalClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading shared content...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
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
                Shared with Me
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <SearchBar />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DocumentIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Shared File</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FolderIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Shared Folder</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalFolders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <EyeIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Viewer Access</p>
              <p className="text-xl font-bold text-gray-900">{stats.readOnlyItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PencilIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Editor Access</p>
              <p className="text-xl font-bold text-gray-900">{stats.editableItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              About Shared Content
            </h4>
            <p className="text-sm text-blue-800">
              Items shown here have been shared with you by other users. Your permission level determines what actions you can perform:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Viewer</strong> - You can view and download the content</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Editor</strong> - You can view, download, modify content, and copy folders</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('folders')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'folders'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Folders ({stats.totalFolders})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'documents'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              File ({stats.totalDocuments})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Folders Tab */}
          {activeTab === 'folders' && (
            <div>
              {sharedFolders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FolderIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shared folders</h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    You don&apos;t have any shared folders yet. When someone shares a folder with you, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all"
                    >
                      <div
                        className="flex items-center flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleItemClick(folder, 'folder')}
                      >
                        <FolderIcon className="h-6 w-6 text-gray-500 flex-shrink-0 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {folder.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            Shared by {folder.owner?.name || 'Unknown'} • {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'months'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getPermissionBadge(folder.permissionLevel)}
                        {folder.permissionLevel === 'editor' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyFolder(folder);
                            }}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Copy to My Folders"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5 text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleItemClick(folder, 'folder')}
                          className="p-1"
                        >
                          <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              {sharedDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <DocumentIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shared documents</h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    You don&apos;t have any shared documents yet. When someone shares a document with you, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="group flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all"
                      onClick={() => handleItemClick(document, 'document')}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {getFileIcon(document.fileName)}
                        <div className="flex-1 min-w-0 ml-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {document.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            Shared by {document.ownerName || 'Unknown'} • {document.createdAt ? new Date(document.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'months'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {document.labels && document.labels.length > 0 && (
                          <div className="flex gap-1">
                            {document.labels.slice(0, 2).map((label, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
                              >
                                {label}
                              </span>
                            ))}
                            {document.labels.length > 2 && (
                              <span className="text-xs text-gray-400">+{document.labels.length - 2}</span>
                            )}
                          </div>
                        )}
                        {getPermissionBadge(document.permissionLevel)}
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
    </>
  );
}