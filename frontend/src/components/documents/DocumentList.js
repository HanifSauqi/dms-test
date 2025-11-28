'use client';

import { useState, useEffect } from 'react';
import {
  DocumentIcon,
  FolderIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  TagIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import DropdownMenu from '@/components/DropdownMenu';
import { showSuccess, showError } from '@/utils/toast';

export default function DocumentList({
  documents = [],
  folders = [],
  ownedFolders = [],
  sharedFolders = [],
  loading = false,
  onFolderClick,
  onFolderEdit,
  onFolderDelete,
  onFolderShare,
  onDocumentView,
  onDocumentEdit,
  onDocumentDelete,
  onDocumentDownload,
  onDocumentLabels,
  onDocumentDetails,
  accessLevel = 'owner'
}) {
  // Support backward compatibility - if folders prop is used, split it
  const actualOwnedFolders = ownedFolders.length > 0 ? ownedFolders : folders.filter(f => {
    const accessLvl = f.accessLevel || f.access_level || f.permissionLevel;
    return accessLvl === 'owner';
  });
  const actualSharedFolders = sharedFolders.length > 0 ? sharedFolders : folders.filter(f => {
    const accessLvl = f.accessLevel || f.access_level || f.permissionLevel;
    return accessLvl && accessLvl !== 'owner';
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'detail'

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('filesViewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('filesViewMode', mode);
  };

  const handleFolderAction = async (action, folder) => {
    if (!folder || !folder.id) {
      showError('Invalid folder');
      return;
    }

    try {
      setActionLoading(`${action}-folder-${folder.id}`);

      switch (action) {
        case 'edit':
          onFolderEdit && onFolderEdit(folder);
          break;
        case 'delete':
          if (onFolderDelete) await onFolderDelete(folder);
          break;
        case 'share':
          onFolderShare && onFolderShare(folder);
          break;
        default:
          console.warn(`Unknown folder action: ${action}`);
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on folder:`, error);
      showError(`Failed to ${action} folder`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDocumentAction = async (action, document) => {
    console.log('🔵 handleDocumentAction called:', { action, document });

    if (!document || !document.id) {
      console.error('❌ Invalid document:', document);
      showError('Invalid document');
      return;
    }

    try {
      setActionLoading(`${action}-${document.id}`);
      console.log(`🔄 Action loading set for: ${action}-${document.id}`);

      switch (action) {
        case 'view':
          console.log('👁️ Calling onDocumentView');
          if (onDocumentView) {
            onDocumentView(document);
          } else {
            console.error('❌ onDocumentView is not defined');
          }
          break;
        case 'edit':
          console.log('✏️ Calling onDocumentEdit');
          if (onDocumentEdit) {
            onDocumentEdit(document);
          } else {
            console.error('❌ onDocumentEdit is not defined');
          }
          break;
        case 'delete':
          console.log('🗑️ Calling onDocumentDelete');
          if (onDocumentDelete) {
            await onDocumentDelete(document);
          } else {
            console.error('❌ onDocumentDelete is not defined');
          }
          break;
        case 'download':
          console.log('⬇️ Calling onDocumentDownload');
          if (onDocumentDownload) {
            await onDocumentDownload(document);
          } else {
            console.error('❌ onDocumentDownload is not defined');
          }
          break;
        case 'labels':
          console.log('🏷️ Calling onDocumentLabels');
          if (onDocumentLabels) {
            onDocumentLabels(document);
          } else {
            console.error('❌ onDocumentLabels is not defined');
          }
          break;
        case 'details':
          console.log('ℹ️ Calling onDocumentDetails');
          if (onDocumentDetails) {
            onDocumentDetails(document);
          } else {
            console.error('❌ onDocumentDetails is not defined');
          }
          break;
        default:
          console.warn(`⚠️ Unknown action: ${action}`);
          break;
      }
      console.log(`✅ Action ${action} completed successfully`);
    } catch (error) {
      console.error(`❌ Error performing ${action} on document:`, error);
      showError(`Failed to ${action} document: ${error.message}`);
    } finally {
      setActionLoading(null);
      console.log('🔄 Action loading cleared');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIconColor = (fileName) => {
    // All document icons now use orange-600 to match the add document/folder buttons
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0 && actualOwnedFolders.length === 0 && actualSharedFolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <DocumentIcon className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No documents found</p>
        <p className="text-gray-400 text-sm mt-2">Upload some documents to get started</p>
      </div>
    );
  }

  // Render folder section helper
  const renderFolderSection = (folderList, title, folderAccessLevel) => {
    if (folderList.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {title} ({folderList.length})
        </h3>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
            {folderList.map((folder) => (
              <div
                key={folder.id}
                className="group flex flex-col items-center cursor-pointer"
              >
                <div
                  className="relative flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors w-full"
                  onClick={() => onFolderClick(folder)}
                >
                  <FolderIcon className="w-20 h-20 text-orange-600 mb-1" />
                  <p className="text-sm text-gray-900 text-center break-words w-full px-1 line-clamp-2">
                    {folder.name}
                  </p>
                  <div
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu
                      trigger={
                        <button className="p-1 rounded-full hover:bg-gray-200 bg-white shadow-sm transition-colors">
                          <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      }
                      options={[
                        {
                          label: 'Rename',
                          icon: PencilIcon,
                          onClick: () => handleFolderAction('edit', folder),
                          disabled: actionLoading === `edit-folder-${folder.id}`
                        },
                        ...(folderAccessLevel === 'owner' ? [{
                          label: 'Share',
                          icon: ShareIcon,
                          onClick: () => handleFolderAction('share', folder),
                          disabled: actionLoading === `share-folder-${folder.id}`
                        }] : []),
                        ...(folderAccessLevel === 'owner' ? [{
                          label: 'Delete',
                          icon: TrashIcon,
                          onClick: () => handleFolderAction('delete', folder),
                          disabled: actionLoading === `delete-folder-${folder.id}`,
                          className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }] : [])
                      ]}
                      onOptionClick={(option) => {
                        console.log('📁 FolderList: onOptionClick received:', option.label);
                        if (option.onClick) {
                          console.log('📁 FolderList: Calling option.onClick()');
                          option.onClick();
                        } else {
                          console.error('❌ FolderList: option.onClick is not defined!');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail View */}
        {viewMode === 'detail' && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 [&>tr:last-child>td:first-child]:rounded-bl-lg [&>tr:last-child>td:last-child]:rounded-br-lg">
                {folderList.map((folder) => (
                  <tr
                    key={folder.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onFolderClick(folder)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FolderIcon className="w-6 h-6 text-orange-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{folder.documentCount || 0} items</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {folder.createdAt ? formatDate(folder.createdAt) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <DropdownMenu
                          trigger={
                            <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                              <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                            </button>
                          }
                          options={[
                            {
                              label: 'Rename',
                              icon: PencilIcon,
                              onClick: () => handleFolderAction('edit', folder),
                              disabled: actionLoading === `edit-folder-${folder.id}`
                            },
                            ...(folderAccessLevel === 'owner' ? [{
                              label: 'Share',
                              icon: ShareIcon,
                              onClick: () => handleFolderAction('share', folder),
                              disabled: actionLoading === `share-folder-${folder.id}`
                            }] : []),
                            ...(folderAccessLevel === 'owner' ? [{
                              label: 'Delete',
                              icon: TrashIcon,
                              onClick: () => handleFolderAction('delete', folder),
                              disabled: actionLoading === `delete-folder-${folder.id}`,
                              className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }] : [])
                          ]}
                          onOptionClick={(option) => {
                            console.log('📁 FolderList: onOptionClick received:', option.label);
                            if (option.onClick) {
                              console.log('📁 FolderList: Calling option.onClick()');
                              option.onClick();
                            } else {
                              console.error('❌ FolderList: option.onClick is not defined!');
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* View Mode Toggle */}
      {(actualOwnedFolders.length > 0 || actualSharedFolders.length > 0 || documents.length > 0) && (
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => handleViewModeChange('detail')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'detail'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
              <span>Detail View</span>
            </button>
          </div>
        </div>
      )}

      {/* My Folders Section */}
      {renderFolderSection(actualOwnedFolders, 'My Folder', 'owner')}

      {/* Shared Folders Section */}
      {renderFolderSection(actualSharedFolders, 'Shared Folder', 'read')}

      {/* Files Section */}
      {documents.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            File ({documents.length})
          </h3>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div
                    className="relative flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors w-full"
                    onClick={() => handleDocumentAction('view', document)}
                  >
                    <DocumentIcon className={`w-20 h-20 mb-1 ${getFileIconColor(document.fileName)}`} />
                    <p className="text-sm text-gray-900 text-center break-words w-full px-1 line-clamp-2" title={document.title}>
                      {document.title}
                    </p>
                    <div
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu
                        trigger={
                          <button className="p-1 rounded-full hover:bg-gray-200 bg-white shadow-sm transition-colors">
                            <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                          </button>
                        }
                        options={[
                          {
                            label: 'View',
                            icon: EyeIcon,
                            onClick: () => handleDocumentAction('view', document),
                            disabled: actionLoading === `view-${document.id}`
                          },
                          {
                            label: 'Download',
                            icon: ArrowDownTrayIcon,
                            onClick: () => handleDocumentAction('download', document),
                            disabled: actionLoading === `download-${document.id}`
                          },
                          {
                            label: 'Edit Details',
                            icon: PencilIcon,
                            onClick: () => handleDocumentAction('edit', document),
                            disabled: actionLoading === `edit-${document.id}`
                          },
                          {
                            label: 'Manage Labels',
                            icon: TagIcon,
                            onClick: () => handleDocumentAction('labels', document),
                            disabled: actionLoading === `labels-${document.id}`
                          },
                          {
                            label: 'Document Info',
                            icon: InformationCircleIcon,
                            onClick: () => handleDocumentAction('details', document),
                            disabled: actionLoading === `details-${document.id}`
                          },
                          ...(accessLevel === 'owner' ? [{
                            label: 'Delete',
                            icon: TrashIcon,
                            onClick: () => handleDocumentAction('delete', document),
                            disabled: actionLoading === `delete-${document.id}`,
                            className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          }] : [])
                        ]}
                        onOptionClick={(option) => {
                          console.log('📄 DocumentList: onOptionClick received:', option.label);
                          if (option.onClick) {
                            console.log('📄 DocumentList: Calling option.onClick()');
                            option.onClick();
                          } else {
                            console.error('❌ DocumentList: option.onClick is not defined!');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail View */}
          {viewMode === 'detail' && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Labels
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 [&>tr:last-child>td:first-child]:rounded-bl-lg [&>tr:last-child>td:last-child]:rounded-br-lg">
                  {documents.map((document) => (
                    <tr
                      key={document.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleDocumentAction('view', document)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentIcon className="w-6 h-6 text-orange-600 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{document.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {document.labels && document.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {document.labels.map((label, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{document.fileName || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDate(document.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <DropdownMenu
                            trigger={
                              <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                                <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                              </button>
                            }
                            options={[
                              {
                                label: 'View',
                                icon: EyeIcon,
                                onClick: () => handleDocumentAction('view', document),
                                disabled: actionLoading === `view-${document.id}`
                              },
                              {
                                label: 'Download',
                                icon: ArrowDownTrayIcon,
                                onClick: () => handleDocumentAction('download', document),
                                disabled: actionLoading === `download-${document.id}`
                              },
                              {
                                label: 'Edit Details',
                                icon: PencilIcon,
                                onClick: () => handleDocumentAction('edit', document),
                                disabled: actionLoading === `edit-${document.id}`
                              },
                              {
                                label: 'Manage Labels',
                                icon: TagIcon,
                                onClick: () => handleDocumentAction('labels', document),
                                disabled: actionLoading === `labels-${document.id}`
                              },
                              {
                                label: 'Document Info',
                                icon: InformationCircleIcon,
                                onClick: () => handleDocumentAction('details', document),
                                disabled: actionLoading === `details-${document.id}`
                              },
                              ...(accessLevel === 'owner' ? [{
                                label: 'Delete',
                                icon: TrashIcon,
                                onClick: () => handleDocumentAction('delete', document),
                                disabled: actionLoading === `delete-${document.id}`,
                                className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              }] : [])
                            ]}
                            onOptionClick={(option) => {
                              console.log('📄 DocumentList: onOptionClick received:', option.label);
                              if (option.onClick) {
                                console.log('📄 DocumentList: Calling option.onClick()');
                                option.onClick();
                              } else {
                                console.error('❌ DocumentList: option.onClick is not defined!');
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shared Folder Section - Placeholder for future implementation */}
      {/* This section will be implemented when folder sharing is fully functional */}
    </div>
  );
}