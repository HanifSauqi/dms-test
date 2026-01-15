'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { showError } from '@/utils/toast';

export default function FileUpload({ folderId, onUploadSuccess, onClose }) {
  const { api } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const validTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain', // .txt
      'text/csv' // .csv
    ];

    const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];

    const validFiles = [];
    const rejectedFiles = [];

    files.forEach(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      const isValidType = validTypes.includes(file.type) || validExtensions.includes(extension);
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        rejectedFiles.push({
          name: file.name,
          reason: `Format tidak didukung (.${extension}). Format yang diizinkan: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV`
        });
      } else if (!isValidSize) {
        rejectedFiles.push({
          name: file.name,
          reason: `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(2)} MB). Maksimal 100 MB`
        });
      } else {
        validFiles.push(file);
      }
    });

    // Show error message for rejected files
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(f => `${f.name}: ${f.reason}`).join(', ');
      showError(`File tidak dapat diupload: ${errorMessages}`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      if (folderId) {
        formData.append('folderId', folderId);
      }

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.data.success) {
        const documents = response.data.data.documents;
        setUploadResults(documents);

        // Show classification results for a few seconds before closing
        setTimeout(() => {
          onUploadSuccess && onUploadSuccess(documents);
          setSelectedFiles([]);
          setUploadResults([]);
          onClose && onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Upload failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Custom Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
            ? 'border-orange-400 bg-orange-50'
            : 'border-gray-300 hover:border-orange-400'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'
            }
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (max 100MB each)
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Results with Classification Info */}
        {uploadResults.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Upload Complete! 🎉</h4>
            <div className="space-y-3">
              {uploadResults.map((doc, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <DocumentIcon className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">{doc.title}</span>
                      </div>

                      {doc.autoClassified ? (
                        <div className="mt-1 text-xs text-green-700">
                          🤖 <strong>Auto-classified:</strong> Moved to &quot;{doc.targetFolderName}&quot; folder
                          <br />
                          📝 <strong>Keyword found:</strong> &quot;{doc.matchedKeyword}&quot;
                        </div>
                      ) : doc.folderId ? (
                        <div className="mt-1 text-xs text-green-700">
                          📁 Saved to selected folder
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-gray-600">
                          📁 Saved to root directory
                        </div>
                      )}
                    </div>

                    {doc.autoClassified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Auto-classified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                {uploadResults.some(doc => doc.autoClassified) && (
                  <>Auto-classification worked! You can manage rules in Settings.</>
                )}
                Closing in 3 seconds...
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0 || uploading}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}