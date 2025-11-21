'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HomeIcon } from '@heroicons/react/24/outline';
import DocumentList from '@/components/documents/DocumentList';
import DocumentFilters from '@/components/documents/DocumentFilters';
import DocumentActions from '@/components/documents/DocumentActions';
import FolderSharingModal from '@/components/FolderSharingModal';
import FolderEditModal from '@/components/FolderEditModal';
import FileViewerModal from '@/components/FileViewerModal';
import DocumentLabelsModal from '@/components/DocumentLabelsModal';
import DocumentDetailsModal from '@/components/DocumentDetailsModal';
import DocumentEditModal from '@/components/DocumentEditModal';
import { documentApi, folderApi } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // States
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);

  // Modal states
  const [showFolderSharingModal, setShowFolderSharingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [showDocumentEdit, setShowDocumentEdit] = useState(false);
  const [showDocumentLabels, setShowDocumentLabels] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Get current folder ID from URL
  const currentFolderId = useMemo(() => {
    const id = searchParams.get('folderId');
    return id ? parseInt(id) : null;
  }, [searchParams]);

  // Get current folder name and breadcrumbs
  const currentFolderName = useMemo(() => {
    if (!currentFolderId) return 'My Files';
    const folder = folders.find(f => f.id === currentFolderId);
    return folder?.name || 'Folder';
  }, [currentFolderId, folders]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const promises = [];

      // Jika di root level, fetch owned folders dan shared folders terpisah
      if (!currentFolderId) {
        // Fetch owned folders
        promises.push(folderApi.getAll(null));

        // Fetch shared folders
        promises.push(folderApi.getShared());

        // Fetch documents
        promises.push(documentApi.getAll({
          folderId: null,
          limit: 100
        }));

        const [ownedFoldersResponse, sharedFoldersResponse, documentsResponse] = await Promise.all(promises);

        const allFoldersFromApi = ownedFoldersResponse.data?.folders || ownedFoldersResponse.folders || [];
        const sharedFoldersData = sharedFoldersResponse.data?.sharedFolders || sharedFoldersResponse.sharedFolders || [];

        console.log('📊 allFoldersFromApi:', allFoldersFromApi);
        console.log('📊 Sample folder:', allFoldersFromApi[0]);
        console.log('📊 sharedFoldersData:', sharedFoldersData);

        // Filter owned folders - hanya ambil yang accessLevel === 'owner'
        // karena getFolders() mengembalikan semua folder (owned + shared)
        // Backend mengembalikan accessLevel (camelCase) dari controller
        const ownedFolders = allFoldersFromApi.filter(f => {
          const isOwner = f.accessLevel === 'owner' || f.access_level === 'owner';
          console.log(`📁 Folder "${f.name}": accessLevel="${f.accessLevel}", access_level="${f.access_level}", isOwner=${isOwner}`);
          return isOwner;
        });

        console.log('✅ ownedFolders:', ownedFolders.length);
        console.log('✅ sharedFoldersData:', sharedFoldersData.length);
        console.log('📊 Sample sharedFolder from API:', sharedFoldersData[0]);

        // Combine folders dengan flag untuk membedakan
        // Pastikan semua folder punya accessLevel (camelCase) untuk konsistensi
        // sharedFoldersData menggunakan permissionLevel, bukan accessLevel
        const mappedSharedFolders = sharedFoldersData.map(f => {
          const mapped = {
            ...f,
            accessLevel: f.permissionLevel || f.accessLevel,
            access_level: f.permissionLevel || f.access_level
          };
          console.log(`🔄 Mapped shared folder "${f.name}":`, {
            original_permissionLevel: f.permissionLevel,
            original_accessLevel: f.accessLevel,
            mapped_accessLevel: mapped.accessLevel,
            mapped_access_level: mapped.access_level
          });
          return mapped;
        });

        const allFolders = [
          ...ownedFolders.map(f => ({ ...f, accessLevel: 'owner', access_level: 'owner' })),
          ...mappedSharedFolders
        ];

        console.log('✅ allFolders combined:', allFolders.length);
        console.log('📂 All folders:', allFolders);

        setFolders(allFolders);
        setDocuments(documentsResponse.data?.documents || documentsResponse.documents || []);
      } else {
        // Jika sedang di dalam folder, fetch subfolders dan documents
        promises.push(folderApi.getAll(currentFolderId));
        promises.push(documentApi.getAll({
          folderId: currentFolderId,
          limit: 100
        }));

        const [foldersResponse, documentsResponse] = await Promise.all(promises);

        setFolders(foldersResponse.data?.folders || foldersResponse.folders || []);
        setDocuments(documentsResponse.data?.documents || documentsResponse.documents || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load documents');
      setFolders([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  // Fetch breadcrumbs for current folder
  const fetchBreadcrumbs = useCallback(async () => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      return;
    }

    try {
      // Build breadcrumb path by traversing up the folder tree
      const buildBreadcrumbs = async (folderId) => {
        const response = await folderApi.getById(folderId);
        const folder = response.data?.folder || response.data || response.folder || response;

        if (folder.parent_id) {
          const parentBreadcrumbs = await buildBreadcrumbs(folder.parent_id);
          return [...parentBreadcrumbs, { id: folder.id, name: folder.name }];
        } else {
          return [{ id: folder.id, name: folder.name }];
        }
      };

      const breadcrumbPath = await buildBreadcrumbs(currentFolderId);
      setBreadcrumbs(breadcrumbPath);
    } catch (error) {
      console.error('Error fetching breadcrumbs:', error);
      setBreadcrumbs([]);
    }
  }, [currentFolderId]);

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchBreadcrumbs();
  }, [fetchBreadcrumbs]);

  // Event handlers
  const handleFolderClick = (folder) => {
    const params = new URLSearchParams(searchParams);
    params.set('folderId', folder.id);
    router.push(`?${params.toString()}`);
  };

  const handleBreadcrumbClick = (folderId) => {
    if (folderId === null) {
      router.push('/dashboard/files');
    } else {
      const params = new URLSearchParams(searchParams);
      params.set('folderId', folderId);
      router.push(`?${params.toString()}`);
    }
  };

  const handleCreateFolder = async (folderName) => {
    try {
      // Check if current folder is a shared folder (not owned by user)
      const currentFolder = folders.find(f => f.id === currentFolderId);
      // Check accessLevel, access_level, atau permissionLevel
      const accessLvl = currentFolder?.accessLevel || currentFolder?.access_level || currentFolder?.permissionLevel;
      const isInSharedFolder = currentFolder && accessLvl !== 'owner';

      // If in shared folder, create new folder at root level (parentId = null)
      // If in own folder, create as subfolder
      const parentId = isInSharedFolder ? null : currentFolderId;

      await folderApi.create({
        name: folderName,
        parentId: parentId
      });

      showSuccess('Folder created successfully');

      // If created at root level while in shared folder, redirect to root
      if (isInSharedFolder) {
        router.push('/dashboard/files');
      }

      fetchData();
    } catch (error) {
      console.error('Error creating folder:', error);
      showError(error.message || 'Failed to create folder');
    }
  };

  const handleFolderEdit = (folder) => {
    setSelectedFolder(folder);
    setShowEditModal(true);
  };

  const handleFolderDelete = async (folder, forceDelete = false) => {
    if (!forceDelete) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${folder.name}"?\n\n` +
        `This action cannot be undone.`
      );

      if (!confirmDelete) {
        return;
      }
    }

    try {
      await folderApi.delete(folder.id, forceDelete);
      showSuccess('Folder deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting folder:', error);

      const errorMessage = error.response?.data?.message || error.message;

      if (errorMessage && errorMessage.includes('contains subfolders or documents')) {
        const confirmForceDelete = window.confirm(
          `⚠️ This folder is not empty!\n\n` +
          `The folder "${folder.name}" contains subfolders or documents.\n\n` +
          `Do you want to DELETE IT along with ALL its contents?\n\n` +
          `⚠️ WARNING: This will permanently delete everything inside! This action cannot be undone!`
        );

        if (confirmForceDelete) {
          return handleFolderDelete(folder, true);
        }
      } else {
        showError(errorMessage || 'Failed to delete folder');
      }
    }
  };

  const handleFolderShare = (folder) => {
    setSelectedFolder(folder);
    setShowFolderSharingModal(true);
  };

  const handleDocumentView = (document) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
  };

  const handleDocumentEdit = (document) => {
    console.log('✏️ Page: handleDocumentEdit called', document);
    setSelectedDocument(document);
    setShowDocumentEdit(true);
  };

  const handleDocumentDelete = async (document) => {
    console.log('🗑️ Page: handleDocumentDelete called', document);
    if (!window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Page: Calling documentApi.delete with ID:', document.id);
      await documentApi.delete(document.id);
      showSuccess('Document deleted successfully');
      fetchData();
    } catch (error) {
      console.error('❌ Page: Error deleting document:', error);
      showError(error.message || 'Failed to delete document');
    }
  };

  const handleDocumentDownload = async (doc) => {
    console.log('⬇️ Page: handleDocumentDownload called', doc);
    try {
      console.log('⬇️ Page: Calling documentApi.download with ID:', doc.id);
      const response = await documentApi.download(doc.id);
      console.log('⬇️ Page: Download response received:', response);
      console.log('⬇️ Page: Response type:', typeof response);
      console.log('⬇️ Page: Response instanceof Blob:', response instanceof Blob);

      // The response is already a Blob from the interceptor
      const blob = response instanceof Blob ? response : new Blob([response]);
      console.log('⬇️ Page: Blob created, size:', blob.size);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      console.log('⬇️ Page: Object URL created:', url);

      const link = window.document.createElement('a');
      link.href = url;
      const fileName = doc.fileName || doc.title || 'download';
      link.setAttribute('download', fileName);
      console.log('⬇️ Page: Downloading as:', fileName);

      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess('Document downloaded successfully');
      console.log('✅ Page: Download completed successfully');
    } catch (error) {
      console.error('❌ Page: Error downloading document:', error);
      console.error('❌ Page: Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      showError(error.message || 'Failed to download document');
    }
  };

  const handleDocumentLabels = (document) => {
    console.log('🏷️ Page: handleDocumentLabels called', document);
    setSelectedDocument(document);
    setShowDocumentLabels(true);
  };

  const handleDocumentDetails = (document) => {
    console.log('ℹ️ Page: handleDocumentDetails called', document);
    setSelectedDocument(document);
    setShowDocumentDetails(true);
  };

  const handleUploadComplete = () => {
    fetchData();
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleLabelFilter = (labels) => {
    setSelectedLabels(labels);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedLabels([]);
  };

  const handleModalClose = () => {
    setShowFolderSharingModal(false);
    setShowEditModal(false);
    setShowFileViewer(false);
    setShowDocumentDetails(false);
    setShowDocumentEdit(false);
    setShowDocumentLabels(false);
    setSelectedFolder(null);
    setSelectedDocument(null);
  };

  const handleModalUpdate = () => {
    fetchData();
    handleModalClose();
  };

  // Filter documents based on search and labels
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.labels && doc.labels.some(label =>
          label.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Apply label filter
    if (selectedLabels.length > 0) {
      filtered = filtered.filter(doc =>
        doc.labels && selectedLabels.every(label => doc.labels.includes(label))
      );
    }

    return filtered;
  }, [documents, searchTerm, selectedLabels]);

  // Separate folders into owned and shared
  const { ownedFolders, sharedFolders } = useMemo(() => {
    // Check accessLevel, access_level, dan permissionLevel untuk compatibility
    const owned = folders.filter(folder => {
      const accessLvl = folder.accessLevel || folder.access_level || folder.permissionLevel;
      return accessLvl === 'owner';
    });
    const shared = folders.filter(folder => {
      const accessLvl = folder.accessLevel || folder.access_level || folder.permissionLevel;
      return accessLvl && accessLvl !== 'owner';
    });
    console.log('🔍 useMemo - owned:', owned.length, 'shared:', shared.length);
    return { ownedFolders: owned, sharedFolders: shared };
  }, [folders]);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center mb-6 text-sm">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            Home
          </button>
          <span className="mx-2 text-gray-400">{'>'}</span>
          <button
            onClick={() => handleBreadcrumbClick(null)}
            className={`transition-colors font-medium ${!currentFolderId ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            My Files
          </button>

          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center">
              <span className="mx-2 text-gray-400">{'>'}</span>
              <button
                onClick={() => handleBreadcrumbClick(crumb.id)}
                className={`transition-colors font-medium ${index === breadcrumbs.length - 1 ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <DocumentActions
          onUploadComplete={handleUploadComplete}
          onCreateFolder={handleCreateFolder}
          onRefresh={fetchData}
          loading={loading}
          currentFolderId={currentFolderId}
        />

        {/* Filters */}
        <DocumentFilters
          onSearch={handleSearch}
          onFolderFilter={(folderId) => {
            const params = new URLSearchParams(searchParams);
            if (folderId) {
              params.set('folderId', folderId);
            } else {
              params.delete('folderId');
            }
            router.push(`?${params.toString()}`);
          }}
          onLabelFilter={handleLabelFilter}
          onClearFilters={handleClearFilters}
          currentSearch={searchTerm}
          currentFolderId={currentFolderId}
          currentLabels={selectedLabels}
        />

        {/* Document List */}
        <DocumentList
          documents={filteredDocuments}
          ownedFolders={ownedFolders}
          sharedFolders={sharedFolders}
          loading={loading}
          onFolderClick={handleFolderClick}
          onFolderEdit={handleFolderEdit}
          onFolderDelete={handleFolderDelete}
          onFolderShare={handleFolderShare}
          onDocumentView={handleDocumentView}
          onDocumentEdit={handleDocumentEdit}
          onDocumentDelete={handleDocumentDelete}
          onDocumentDownload={handleDocumentDownload}
          onDocumentLabels={handleDocumentLabels}
          onDocumentDetails={handleDocumentDetails}
          accessLevel="owner"
        />

      {/* Modals */}
      {showFolderSharingModal && selectedFolder && (
        <FolderSharingModal
          folder={selectedFolder}
          isOpen={showFolderSharingModal}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}

      {showEditModal && selectedFolder && (
        <FolderEditModal
          folder={selectedFolder}
          isOpen={showEditModal}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}

      {showFileViewer && selectedDocument && (
        <FileViewerModal
          document={selectedDocument}
          isOpen={showFileViewer}
          onClose={handleModalClose}
        />
      )}

      {showDocumentLabels && selectedDocument && (
        <DocumentLabelsModal
          document={selectedDocument}
          isOpen={showDocumentLabels}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}

      {showDocumentDetails && selectedDocument && (
        <DocumentDetailsModal
          document={selectedDocument}
          isOpen={showDocumentDetails}
          onClose={handleModalClose}
        />
      )}

      {showDocumentEdit && selectedDocument && (
        <DocumentEditModal
          document={selectedDocument}
          isOpen={showDocumentEdit}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}
    </>
  );
}