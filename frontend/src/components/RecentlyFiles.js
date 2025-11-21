'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentIcon, EyeIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/react/24/outline';
import FileViewerModal from './FileViewerModal';
import DocumentEditModal from './DocumentEditModal';
import { showError, showSuccess } from '@/utils/toast';

export default function RecentlyFiles({ limit = 10, folderId = null }) {
  const { api } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showDocumentEdit, setShowDocumentEdit] = useState(false);
  const [sharedUsersMap, setSharedUsersMap] = useState({});

  const fetchSharedUsers = useCallback(async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/shared-users`);
      if (response.data.success) {
        return response.data.data.sharedUsers || [];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching shared users for document ${documentId}:`, error);
      return [];
    }
  }, [api]);

  const fetchRecentDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = `?limit=${limit}`;
      const response = await api.get(`/documents/recent${params}`);

      if (response.data.success) {
        const docs = response.data.data.documents || [];
        setDocuments(docs);

        const sharedUsersPromises = docs.map(doc =>
          fetchSharedUsers(doc.id).catch(() => [])
        );
        const sharedUsersResults = await Promise.all(sharedUsersPromises);

        const sharedUsersObj = {};
        docs.forEach((doc, index) => {
          sharedUsersObj[doc.id] = sharedUsersResults[index];
        });
        setSharedUsersMap(sharedUsersObj);
      }
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      showError('Failed to load recent files');
    } finally {
      setLoading(false);
    }
  }, [api, limit, fetchSharedUsers]);

  useEffect(() => {
    fetchRecentDocuments();
  }, [fetchRecentDocuments]);

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
    // Activity logging will be done automatically by FileViewerModal
    // when it fetches document data
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentEdit(true);
  };

  const handleDownloadDocument = async (document) => {
    try {
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const linkElement = window.document.createElement('a');
      linkElement.href = url;
      linkElement.download = document.title || document.fileName;
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);
      window.URL.revokeObjectURL(url);

      showSuccess('Document downloaded successfully');
    } catch (error) {
      showError('Failed to download document');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getActivityLabel = (activity) => {
    const activityMap = {
      'created': 'Created',
      'viewed': 'Viewed',
      'edited': 'Edited',
      'downloaded': 'Downloaded',
      'shared': 'Shared'
    };
    return activityMap[activity] || 'Created';
  };

  const getFileIcon = (fileName) => {
    const extension = (fileName || '')?.split('.').pop()?.toLowerCase();

    // Custom SVG File Icon Component with document shape
    const FileIconSVG = ({ color, extension: ext }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document shape with folded corner */}
        <path
          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Folded corner */}
        <path
          d="M14 2V8H20"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Extension text */}
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill={color}
          fontSize="6"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {ext.toUpperCase()}
        </text>
      </svg>
    );

    switch (extension) {
      case 'pdf':
        return <FileIconSVG color="#DC2626" extension="pdf" />;
      case 'doc':
      case 'docx':
        return <FileIconSVG color="#2563EB" extension="doc" />;
      case 'xls':
      case 'xlsx':
        return <FileIconSVG color="#16A34A" extension="xls" />;
      case 'ppt':
      case 'pptx':
        return <FileIconSVG color="#EA580C" extension="ppt" />;
      case 'txt':
        return <FileIconSVG color="#6B7280" extension="txt" />;
      default:
        return <DocumentIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const renderSharedWith = (documentId) => {
    const sharedUsers = sharedUsersMap[documentId] || [];
    const displayCount = Math.min(sharedUsers.length, 3);
    const remainingCount = sharedUsers.length - displayCount;

    // If no shared users, return empty/dash
    if (sharedUsers.length === 0) {
      return <span className="text-gray-400 text-sm">-</span>;
    }

    // Generate blue shades for avatars
    const blueShades = [
      'bg-blue-500',
      'bg-blue-400',
      'bg-blue-300'
    ];

    return (
      <div className="flex items-center -space-x-2">
        {sharedUsers.slice(0, displayCount).map((user, index) => (
          <div
            key={user.id}
            className={`h-7 w-7 rounded-full ${blueShades[index % 3]} border-2 border-white flex items-center justify-center`}
            title={`${user.name} (${user.email})`}
          >
            <span className="text-xs font-medium text-white">{user.initials}</span>
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="h-7 w-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-xs font-medium border-2 border-white"
            title={`${remainingCount} more user${remainingCount > 1 ? 's' : ''}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500">No recent files</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Document
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Shared With
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {documents.map((activity) => (
                <tr
                  key={`${activity.id}-${activity.activityId}`}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => handleViewDocument(activity)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {getFileIcon(activity.fileName)}
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {activity.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                      activity.activityType === 'viewed' ? 'bg-blue-100 text-blue-700' :
                      activity.activityType === 'edited' ? 'bg-orange-100 text-orange-700' :
                      activity.activityType === 'created' ? 'bg-green-100 text-green-700' :
                      activity.activityType === 'downloaded' ? 'bg-purple-100 text-purple-700' :
                      activity.activityType === 'shared' ? 'bg-pink-100 text-pink-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {getActivityLabel(activity.activityType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{activity.ownerEmail || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {formatDate(activity.activityTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderSharedWith(activity.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Viewer Modal */}
      {showFileViewer && selectedDocument && (
        <FileViewerModal
          document={selectedDocument}
          isOpen={showFileViewer}
          onClose={() => {
            setShowFileViewer(false);
            setSelectedDocument(null);
            // Refresh recent documents after viewing
            fetchRecentDocuments();
          }}
        />
      )}

      {/* Document Edit Modal */}
      {showDocumentEdit && selectedDocument && (
        <DocumentEditModal
          document={selectedDocument}
          isOpen={showDocumentEdit}
          onClose={() => {
            setShowDocumentEdit(false);
            setSelectedDocument(null);
          }}
          onUpdate={() => {
            fetchRecentDocuments();
            setShowDocumentEdit(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </>
  );
}
