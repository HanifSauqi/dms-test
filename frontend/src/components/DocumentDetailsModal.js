'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  XMarkIcon,
  DocumentIcon,
  CalendarIcon,
  FolderIcon,
  TagIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function DocumentDetailsModal({ document, isOpen, onClose }) {
  const { api } = useAuth();
  const [documentDetails, setDocumentDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocumentDetails = useCallback(async () => {
    try {
      setLoading(true);
      // Use /details endpoint to avoid logging 'viewed' activity
      const response = await api.get(`/documents/${document.id}/details`);
      if (response.data.success) {
        setDocumentDetails(response.data.data.document);
      }
    } catch (error) {
      console.error('Error fetching document details:', error);
    } finally {
      setLoading(false);
    }
  }, [api, document]);

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentDetails();
    }
  }, [isOpen, document, fetchDocumentDetails]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (fileName) => {
    return fileName?.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (fileName) => {
    const extension = getFileExtension(fileName);
    const typeMap = {
      pdf: 'PDF Document',
      doc: 'Word Document',
      docx: 'Word Document',
      xls: 'Excel Spreadsheet',
      xlsx: 'Excel Spreadsheet',
      ppt: 'PowerPoint Presentation',
      pptx: 'PowerPoint Presentation',
      txt: 'Text File',
      csv: 'CSV File',
      jpg: 'JPEG Image',
      jpeg: 'JPEG Image',
      png: 'PNG Image',
      gif: 'GIF Image',
      json: 'JSON File'
    };
    return typeMap[extension] || 'Document';
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-4 sm:p-6 md:p-8 w-full max-w-2xl bg-white rounded-lg shadow-xl m-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start space-x-3">
            <DocumentIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Details</h2>
              <p className="text-sm text-gray-500 mt-1">View information about this document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 md:h-5 md:w-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : documentDetails ? (
          <div className="space-y-6">
            {/* Document Title */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {documentDetails.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {documentDetails.fileName}
                </p>
              </div>
            </div>

            {/* Document Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">File Type</p>
                      <p className="text-sm text-gray-600">{getFileType(documentDetails.fileName)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">File Size</p>
                      <p className="text-sm text-gray-600">{formatFileSize(documentDetails.fileSize)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Created</p>
                      <p className="text-sm text-gray-600">
                        {new Date(documentDetails.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Organization
                </h4>
                
                <div className="space-y-3">
                  {documentDetails.folderName ? (
                    <div className="flex items-center space-x-3">
                      <FolderIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Folder</p>
                        <p className="text-sm text-blue-600">{documentDetails.folderName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <FolderIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Folder</p>
                        <p className="text-sm text-gray-600">Root directory</p>
                      </div>
                    </div>
                  )}

                  {documentDetails.labels && documentDetails.labels.length > 0 ? (
                    <div className="flex items-start space-x-3">
                      <TagIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Labels</p>
                        <div className="flex flex-wrap gap-1">
                          {documentDetails.labels.map((label, index) => (
                            <span
                              key={label.id || index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: (typeof label === 'object' ? label.color : '#3B82F6') + '20',
                                color: typeof label === 'object' ? label.color : '#3B82F6'
                              }}
                            >
                              {typeof label === 'object' ? label.name : label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <TagIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Labels</p>
                        <p className="text-sm text-gray-600">No labels assigned</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Preview */}
            {documentDetails.extractedContent && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Content Preview
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 sm:max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {documentDetails.extractedContent.substring(0, 500)}
                    {documentDetails.extractedContent.length > 500 && '...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Failed to load document details
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}